import { Between } from 'typeorm';
import { AppDataSource } from '../config/database';
import { CreateCitaDto } from '../dtos/Cita/CreateCita.dto';
import { UpdateCitaDto } from '../dtos/Cita/UpdateCita.dto';
import { Cita } from '../entity/cita';
import { Cliente } from '../entity/cliente';
import { Empleado } from '../entity/empleado';
import { Servicio } from '../entity/servicio';
import { CitaRepository } from '../repository/CitaRepository';

export class CitaService {
    async findAll(): Promise<Cita[]> {
        return await CitaRepository.find({
            relations: ['cliente', 'empleado', 'servicios']
        });
    }
    async getCitasPorFecha(desde: string, hasta: string): Promise<Cita[]> {
        // Validar formato de fechas
        const fechaDesde = new Date(desde);
        const fechaHasta = new Date(hasta);
        
        if (isNaN(fechaDesde.getTime()) || isNaN(fechaHasta.getTime())) {
            throw new Error('Formato de fecha inválido. Use YYYY-MM-DD');
        }
    
        // Ajustar fechaHasta para incluir todo el día
        fechaHasta.setHours(23, 59, 59, 999);
    
        return CitaRepository.find({
            where: {
                fecha: Between(fechaDesde, fechaHasta)
            },
            relations: ['cliente', 'empleado', 'servicios'],
            order: {
                fecha: 'ASC'
            }
        });
    }

    async findById(id: number): Promise<Cita> {
        const cita = await CitaRepository.findOne({
            where: { idCita: id },
            relations: ['cliente', 'empleado', 'servicios']
        });
        if (!cita) {
            throw new Error(`Cita con ID ${id} no encontrada`);
        }
        return cita;
    }

    async findByCliente(clienteId: number): Promise<Cita[]> {
        return await CitaRepository.findByCliente(clienteId);
    }

    async findByEmpleado(empleadoId: number): Promise<Cita[]> {
        return await CitaRepository.findByEmpleado(empleadoId);
    }

    async create(citaData: CreateCitaDto): Promise<Cita> {
        const queryRunner = CitaRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
    
        try {
            // Validación de fecha y hora
            const nuevaFecha = new Date(citaData.fecha);
            const fechaFin = new Date(nuevaFecha.getTime() + 30 * 60000); // +30 minutos

            // Verificar solapamiento con otras citas del mismo empleado
            const citasExistente = await CitaRepository.find({
                where: {
                    empleado: { idEmpleado: citaData.empleadoId },
                    fecha: Between(nuevaFecha, fechaFin)
                }
            });

            if (citasExistente.length > 0) {
                throw new Error('El empleado ya tiene una cita programada en este horario. Las citas deben tener al menos 30 minutos de diferencia.');
            }
            // Validar que la fecha no sea en el pasado
            const ahora = new Date();
            if (citaData.fecha < ahora) {
                throw new Error('No se pueden agendar citas en fechas pasadas');
            }
            // Validación adicional
            if (!citaData.servicioIds || !Array.isArray(citaData.servicioIds)) {
                throw new Error('servicioIds debe ser un array');
            }
    
            if (citaData.servicioIds.length === 0) {
                throw new Error('Debe especificar al menos un servicio');
            }
    
            const cita = new Cita();
            cita.fecha = citaData.fecha;
    
            // Obtener cliente
            const cliente = await queryRunner.manager.findOne(Cliente, {
                where: { idCliente: citaData.clienteId }
            });
            if (!cliente) throw new Error('Cliente no encontrado');
            cita.cliente = cliente;
    
            // Obtener empleado
            const empleado = await queryRunner.manager.findOne(Empleado, {
                where: { idEmpleado: citaData.empleadoId }
            });
            if (!empleado) throw new Error('Empleado no encontrado');
            cita.empleado = empleado;
    
            // Obtener servicios (con conversión a número)
            const servicioIdsNumericos = citaData.servicioIds.map(id => Number(id));
            const servicios = await queryRunner.manager.findByIds(Servicio, servicioIdsNumericos);
            
            // Verificación mejorada
            const serviciosEncontradosIds = servicios.map(s => s.idServicio);
            const serviciosFaltantes = servicioIdsNumericos.filter(
                id => !serviciosEncontradosIds.includes(id)
            );
    
            if (serviciosFaltantes.length > 0) {
                throw new Error(`Servicios no encontrados: ${serviciosFaltantes.join(', ')}`);
            }
    
            cita.servicios = servicios;
    
            await queryRunner.manager.save(cita);
            await queryRunner.commitTransaction();
    
            return await this.findById(cita.idCita);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async update(id: number, citaData: UpdateCitaDto): Promise<Cita> {
        const queryRunner = CitaRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const cita = await this.findById(id);

            if (citaData.fecha) cita.fecha = citaData.fecha;

            if (citaData.clienteId) {
                const cliente = await queryRunner.manager.findOne(Cliente, {
                    where: { idCliente: citaData.clienteId }
                });
                if (!cliente) {
                    throw new Error('Cliente no encontrado');
                }
                cita.cliente = cliente;
            }

            if (citaData.empleadoId) {
                const empleado = await queryRunner.manager.findOne(Empleado, {
                    where: { idEmpleado: citaData.empleadoId }
                });
                if (!empleado) {
                    throw new Error('Empleado no encontrado');
                }
                cita.empleado = empleado;
            }

            if (citaData.servicioIds) {
                const servicios = await queryRunner.manager.findByIds(Servicio, citaData.servicioIds);
                if (servicios.length !== citaData.servicioIds.length) {
                    throw new Error('Algunos servicios no fueron encontrados');
                }
                cita.servicios = servicios;
            }

            await queryRunner.manager.save(cita);
            await queryRunner.commitTransaction();

            return await this.findById(cita.idCita);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async delete(id: number): Promise<void> {
        const cita = await this.findById(id);
        await CitaRepository.remove(cita);
    }
}