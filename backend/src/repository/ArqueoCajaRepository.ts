import { AppDataSource } from '../config/database';
import { ArqueoCaja } from '../entity/arqueoCaja';

export const ArqueoCajaRepository = AppDataSource.getRepository(ArqueoCaja).extend({
    async findByEmpleado(empleadoId: number) {
        return this.createQueryBuilder('arqueo')
            .leftJoinAndSelect('arqueo.empleado', 'empleado')
            .where('empleado.idEmpleado = :empleadoId', { empleadoId })
            .getMany();
    },

    async findWithDetails(id: number) {
        return this.createQueryBuilder('arqueo')
            .leftJoinAndSelect('arqueo.empleado', 'empleado')
            .leftJoinAndSelect('arqueo.cortes', 'cortes')
            .leftJoinAndSelect('arqueo.ingreso', 'ingreso')
            .leftJoinAndSelect('arqueo.egreso', 'egreso')
            .where('arqueo.idArqueo = :id', { id })
            .getOne();
    }
});