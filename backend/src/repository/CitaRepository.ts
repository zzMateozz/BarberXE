import { Between, Not } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Cita } from '../entity/cita';

export const CitaRepository = AppDataSource.getRepository(Cita).extend({
    async findByCliente(clienteId: number) {
        return this.createQueryBuilder('cita')
            .leftJoinAndSelect('cita.cliente', 'cliente')
            .leftJoinAndSelect('cita.servicios', 'servicios')
            .where('cliente.idCliente = :clienteId', { clienteId })
            .getMany();
    },

    async findByEmpleado(empleadoId: number) {
        return this.createQueryBuilder('cita')
            .leftJoinAndSelect('cita.empleado', 'empleado')
            .leftJoinAndSelect('cita.servicios', 'servicios')
            .where('empleado.idEmpleado = :empleadoId', { empleadoId })
            .getMany();
    },

    async findWithDetails(id: number) {
        return this.createQueryBuilder('cita')
            .leftJoinAndSelect('cita.cliente', 'cliente')
            .leftJoinAndSelect('cita.empleado', 'empleado')
            .leftJoinAndSelect('cita.servicios', 'servicios')
            .where('cita.idCita = :id', { id })
            .getOne();
    },

    async checkDisponibilidad(
        idEmpleado: number,
        fechaInicio: Date,
        fechaFin: Date,
        excludeCitaId?: number
    ): Promise<boolean> {
        const where: any = {
            empleado: { idEmpleado },
            fecha: Between(fechaInicio, fechaFin)
        };
    
        if (excludeCitaId) {
            where.idCita = Not(excludeCitaId);
        }
    
        const citasExistente = await this.find({ where });
        return citasExistente.length === 0;
    }
});