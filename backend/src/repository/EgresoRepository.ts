import { AppDataSource } from '../config/database';
import { Egreso } from '../entity/egreso';

export const EgresoRepository = AppDataSource.getRepository(Egreso).extend({
    async findWithArqueo(id: number) {
        return this.createQueryBuilder('egreso')
            .leftJoinAndSelect('egreso.arqueo', 'arqueo')
            .where('egreso.idEgreso = :id', { id })
            .getOne();
    }
});