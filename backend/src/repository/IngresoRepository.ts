import { AppDataSource } from '../config/database';
import { Ingreso } from '../entity/ingreso';

export const IngresoRepository = AppDataSource.getRepository(Ingreso).extend({
    async findWithArqueo(id: number) {
        return this.createQueryBuilder('ingreso')
            .leftJoinAndSelect('ingreso.arqueo', 'arqueo')
            .where('ingreso.idIngreso = :id', { id })
            .getOne();
    }
});