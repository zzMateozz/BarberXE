import { AppDataSource } from '../config/database';
import { Corte } from '../entity/corte';

export const CorteRepository = AppDataSource.getRepository(Corte).extend({
    async findByEstilo(estilo: string) {
        return this.createQueryBuilder('corte')
            .where('corte.estilo LIKE :estilo', { estilo: `%${estilo}%` })
            .getMany();
    },

    async findWithServicios(id: number) {
        return this.createQueryBuilder('corte')
            .leftJoinAndSelect('corte.servicios', 'servicios')
            .where('corte.idCorte = :id', { id })
            .getOne();
    }
});
