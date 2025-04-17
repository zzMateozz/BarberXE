import { Between, Not} from 'typeorm';
import { AppDataSource } from '../config/database';
import { Cita } from '../entity/cita';
import { Cliente } from '../entity/cliente';
import { Empleado } from '../entity/empleado';
import { Servicio } from '../entity/servicio';
import { CreateCitaDto } from '../dtos/Cita/CreateCita.dto';
import { UpdateCitaDto } from '../dtos/Cita/UpdateCita.dto';

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

            // Calcular duración total
            const servicios = await queryRunner.manager.findByIds(Servicio, citaData.servicioIds);
            const duracionTotal = servicios.reduce((total, s) => total + (Number(s.duracion) || 30), 0);
            // Verificar disponibilidad
            const fechaInicio = new Date(citaData.fecha);
            const fechaFin = new Date(fechaInicio.getTime() + duracionTotal * 60000);
            
            const disponible = await this.checkDisponibilidad(
                citaData.empleadoId,
                fechaInicio,
                fechaFin
            );

            if (!disponible) {
                throw new Error('El empleado no está disponible en ese horario');
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

            // Verificar disponibilidad si se cambia la fecha o el empleado
            if (citaData.fecha || citaData.empleadoId) {
                const fecha = citaData.fecha ? new Date(citaData.fecha) : cita.fecha;
                const empleadoId = citaData.empleadoId || cita.empleado.idEmpleado;

                // Calcular duración
                const servicioIds = citaData.servicioIds || cita.servicios.map(s => s.idServicio);
                const servicios = await queryRunner.manager.findByIds(Servicio, servicioIds);
                const duracionTotal = servicios.reduce((total, s) => total + (Number(s.duracion) || 30), 0);

                const fechaFin = new Date(fecha.getTime() + duracionTotal * 60000);

                const disponible = await this.checkDisponibilidad(
                    empleadoId,
                    fecha,
                    fechaFin,
                    id // Excluir esta cita de la verificación
                );

                if (!disponible) {
                    throw new Error('El empleado no está disponible en el nuevo horario');
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
                const servicios = await queryRunner.manager.findByIds(Servicio, citaData.servicioIds);
                if (servicios.length !== citaData.servicioIds.length) {
                    throw new Error('Algunos servicios no fueron encontrados');
                }
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
}

export const CitaRepository = AppDataSource.getRepository(Cita).extend({
    async findByCliente(clienteId: number): Promise<Cita[]> {
        return this.find({
            where: { cliente: { idCliente: clienteId } },
            relations: ['cliente', 'empleado', 'servicios'],
            order: { fecha: 'ASC' }
        });
    },

    async findByEmpleado(empleadoId: number): Promise<Cita[]> {
        return this.find({
            where: { empleado: { idEmpleado: empleadoId } },
            relations: ['cliente', 'empleado', 'servicios'],
            order: { fecha: 'ASC' }
        });
    }
});