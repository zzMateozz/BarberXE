import { AppDataSource } from '../config/database';
import { ArqueoCaja } from '../entity/arqueoCaja';

export const ArqueoCajaRepository = AppDataSource.getRepository(ArqueoCaja).extend({
    async findOpenByEmpleado(empleadoId: number): Promise<ArqueoCaja | null> {
        return this.createQueryBuilder('arqueo')
            .where('arqueo.empleadoId = :empleadoId', { empleadoId })
            .andWhere('arqueo.fechaCierre IS NULL')
            .getOne();
    },

    async findWithDetails(id: number): Promise<ArqueoCaja | null> {
        return this.createQueryBuilder('arqueo')
            .leftJoinAndSelect('arqueo.empleado', 'empleado')
            .leftJoinAndSelect('arqueo.ingresos', 'ingresos')
            .leftJoinAndSelect('arqueo.egresos', 'egresos')
            .leftJoinAndSelect('arqueo.cortes', 'cortes')
            .where('arqueo.idArqueo = :id', { id })
            .orderBy('ingresos.fecha', 'DESC') // Ordenar ingresos
            .addOrderBy('egresos.fecha', 'DESC') // Ordenar egresos
            .getOne();
    },

    async getDailySummary(empleadoId: number, date: Date): Promise<any> {
        const startDate = new Date(date.setHours(0, 0, 0, 0));
        const endDate = new Date(date.setHours(23, 59, 59, 999));

        return this.createQueryBuilder('arqueo')
            .select('SUM(ingresos.monto)', 'totalIngresos')
            .addSelect('SUM(egresos.monto)', 'totalEgresos')
            .leftJoin('arqueo.ingresos', 'ingresos')
            .leftJoin('arqueo.egresos', 'egresos')
            .where('arqueo.empleadoId = :empleadoId', { empleadoId })
            .andWhere('arqueo.fechaInicio BETWEEN :startDate AND :endDate', { startDate, endDate })
            .getRawOne();
    }
});