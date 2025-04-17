import { Between, Not} from 'typeorm';
import { AppDataSource } from '../config/database';
import { Cita } from '../entity/cita';
import { Cliente } from '../entity/cliente';
import { Empleado } from '../entity/empleado';
import { Servicio } from '../entity/servicio';
import { CreateCitaDto } from '../dtos/Cita/CreateCita.dto';
import { UpdateCitaDto } from '../dtos/Cita/UpdateCita.dto';
import { CitaRepository } from '../repository/CitaRepository';

export class CitaService {
    async findAll(): Promise<Cita[]> {
        return await CitaRepository.find({
            relations: ['cliente', 'empleado', 'servicios'],
            order: { fecha: 'ASC' }
        });
    }

    async getCitasPorFecha(desde: string, hasta: string): Promise<Cita[]> {
        const fechaDesde = new Date(desde);
        const fechaHasta = new Date(hasta);
        
        if (isNaN(fechaDesde.getTime()) || isNaN(fechaHasta.getTime())) {
            throw new Error('Formato de fecha inválido. Use YYYY-MM-DD');
        }

        fechaHasta.setHours(23, 59, 59, 999);

        return CitaRepository.find({
            where: {
                fecha: Between(fechaDesde, fechaHasta)
            },
            relations: ['cliente', 'empleado', 'servicios'],
            order: { fecha: 'ASC' }
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
        return await CitaRepository.find({
            where: { cliente: { idCliente: clienteId } },
            relations: ['cliente', 'empleado', 'servicios'],
            order: { fecha: 'ASC' }
        });
    }

    async findByEmpleado(empleadoId: number): Promise<Cita[]> {
        return await CitaRepository.find({
            where: { empleado: { idEmpleado: empleadoId } },
            relations: ['cliente', 'empleado', 'servicios'],
            order: { fecha: 'ASC' }
        });
    }

    async checkDisponibilidad(
        idEmpleado: number,
        fechaInicio: Date,
        fechaFin: Date,
        excludeCitaId?: number
    ): Promise<boolean> {
        const citasExistente = await CitaRepository.find({
            where: {
                empleado: { idEmpleado },
                fecha: Between(fechaInicio, fechaFin),
                ...(excludeCitaId && { idCita: Not(excludeCitaId) })
            }
        });
        return citasExistente.length === 0;
    }
    

    async create(citaData: CreateCitaDto): Promise<Cita> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
    
        try {
            // Validación básica
            if (!citaData.servicioIds || citaData.servicioIds.length === 0) {
                throw new Error('Debe especificar al menos un servicio');
            }
    
            // Obtener servicios y calcular duración total
            const servicios = await queryRunner.manager.findByIds(Servicio, citaData.servicioIds);
            const duracionTotal = servicios.reduce((total, s) => total + (Number(s.duracion) || 30), 0);
    
            // Configurar fechas de inicio y fin
            const fechaInicio = new Date(citaData.fecha);
            const fechaFin = new Date(fechaInicio.getTime() + duracionTotal * 60000);
    
            // Verificar disponibilidad del empleado (solo mismo día)
            const inicioDia = new Date(fechaInicio);
            inicioDia.setHours(0, 0, 0, 0);
            
            const finDia = new Date(fechaInicio);
            finDia.setHours(23, 59, 59, 999);
    
            const citasExistente = await queryRunner.manager.find(Cita, {
                where: {
                    empleado: { idEmpleado: citaData.empleadoId },
                    fecha: Between(inicioDia, finDia)
                },
                relations: ['servicios']
            });
    
            // Verificar cada cita existente para detectar solapamientos
            for (const citaExistente of citasExistente) {
                const serviciosExistente = citaExistente.servicios;
                const duracionExistente = serviciosExistente.reduce(
                    (total, s) => total + (Number(s.duracion) || 30), 0
                );
                
                const inicioExistente = new Date(citaExistente.fecha);
                const finExistente = new Date(inicioExistente.getTime() + duracionExistente * 60000);
    
                // Comprobar solapamiento
                if (
                    (fechaInicio >= inicioExistente && fechaInicio < finExistente) ||
                    (fechaFin > inicioExistente && fechaFin <= finExistente) ||
                    (fechaInicio <= inicioExistente && fechaFin >= finExistente)
                ) {
                    throw new Error(`El empleado ya tiene una cita programada que se solapa con este horario (${inicioExistente.toLocaleTimeString()} - ${finExistente.toLocaleTimeString()})`);
                }
            }
    
            // Validar que la fecha no sea en el pasado
            if (fechaInicio < new Date()) {
                throw new Error('No se pueden agendar citas en fechas pasadas');
            }
    
            // Crear la cita
            const cita = new Cita();
            cita.fecha = citaData.fecha;
    
            // Obtener y asignar cliente
            const cliente = await queryRunner.manager.findOne(Cliente, {
                where: { idCliente: citaData.clienteId }
            });
            if (!cliente) throw new Error('Cliente no encontrado');
            cita.cliente = cliente;
    
            // Obtener y asignar empleado
            const empleado = await queryRunner.manager.findOne(Empleado, {
                where: { idEmpleado: citaData.empleadoId }
            });
            if (!empleado) throw new Error('Empleado no encontrado');
            cita.empleado = empleado;
    
            // Asignar servicios
            cita.servicios = servicios;
    
            // Guardar la cita
            await queryRunner.manager.save(cita);
            await queryRunner.commitTransaction();
    
            // Retornar la cita con relaciones cargadas
            return this.findById(cita.idCita);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
    
    async update(id: number, citaData: UpdateCitaDto): Promise<Cita> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
    
        try {
            const cita = await this.findById(id);
    
            // Obtener servicios (los nuevos o los existentes)
            const servicioIds = citaData.servicioIds || cita.servicios.map(s => s.idServicio);
            const servicios = await queryRunner.manager.findByIds(Servicio, servicioIds);
            
            if (servicios.length !== servicioIds.length) {
                throw new Error('Algunos servicios no fueron encontrados');
            }
    
            const duracionTotal = servicios.reduce(
                (total, s) => total + (Number(s.duracion) || 30), 0
            );
    
            // Configurar fechas
            const fecha = citaData.fecha ? new Date(citaData.fecha) : cita.fecha;
            const fechaFin = new Date(fecha.getTime() + duracionTotal * 60000);
    
            // Verificar disponibilidad (excluyendo la cita actual)
            const empleadoId = citaData.empleadoId || cita.empleado.idEmpleado;
            
            const citasExistente = await queryRunner.manager.find(Cita, {
                where: {
                    empleado: { idEmpleado: empleadoId },
                    idCita: Not(id),
                    fecha: Between(
                        new Date(fecha.getTime() - duracionTotal * 60000),
                        new Date(fechaFin.getTime() + duracionTotal * 60000)
                    )
                },
                relations: ['servicios']
            });
    
            // Verificar solapamientos con otras citas
            for (const citaExistente of citasExistente) {
                const serviciosExistente = citaExistente.servicios;
                const duracionExistente = serviciosExistente.reduce(
                    (total, s) => total + (Number(s.duracion) || 30), 0
                );
                
                const inicioExistente = new Date(citaExistente.fecha);
                const finExistente = new Date(inicioExistente.getTime() + duracionExistente * 60000);
    
                if (
                    (fecha >= inicioExistente && fecha < finExistente) ||
                    (fechaFin > inicioExistente && fechaFin <= finExistente) ||
                    (fecha <= inicioExistente && fechaFin >= finExistente)
                ) {
                    throw new Error(`El empleado ya tiene una cita programada que se solapa con este horario (${inicioExistente.toLocaleTimeString()} - ${finExistente.toLocaleTimeString()})`);
                }
            }
    
            // Actualizar campos
            if (citaData.fecha) cita.fecha = new Date(citaData.fecha);
            if (citaData.clienteId) {
                const cliente = await queryRunner.manager.findOne(Cliente, {
                    where: { idCliente: citaData.clienteId }
                });
                if (!cliente) throw new Error('Cliente no encontrado');
                cita.cliente = cliente;
            }
            if (citaData.empleadoId) {
                const empleado = await queryRunner.manager.findOne(Empleado, {
                    where: { idEmpleado: citaData.empleadoId }
                });
                if (!empleado) throw new Error('Empleado no encontrado');
                cita.empleado = empleado;
            }
            if (citaData.servicioIds) {
                cita.servicios = servicios;
            }
    
            await queryRunner.manager.save(cita);
            await queryRunner.commitTransaction();
    
            return this.findById(cita.idCita);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async delete(id: number): Promise<void> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        
        try {
            await queryRunner.startTransaction();
            const cita = await queryRunner.manager.findOne(Cita, {
                where: { idCita: id },
                relations: ['servicios']
            });
            
            if (!cita) {
                throw new Error(`Cita con ID ${id} no encontrada`);
            }

            await queryRunner.manager.remove(cita);
            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
    
    async findByEmpleadoAndFechaRange(
        empleadoId: number,
        fechaInicio: Date,
        fechaFin: Date
        ): Promise<Cita[]> {
        return await CitaRepository.find({
        where: {
            empleado: { idEmpleado: empleadoId },
            fecha: Between(
              new Date(fechaInicio.getTime() - 24 * 60 * 60 * 1000), // 1 día antes
              new Date(fechaFin.getTime() + 24 * 60 * 60 * 1000)     // 1 día después
            )
        },
        relations: ['servicios']
        });
        }
}
