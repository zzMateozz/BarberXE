import { AppDataSource } from '../config/database';
import { Servicio } from '../entity/servicio';

export const ServicioRepository = AppDataSource.getRepository(Servicio).extend({
    async findByNombre(nombre: string) {
        return this.createQueryBuilder('servicio')
            .where('servicio.nombre LIKE :nombre', { nombre: `%${nombre}%` })
            .getMany();
    },

    async findWithCitas(id: number) {
        return this.createQueryBuilder('servicio')
            .leftJoinAndSelect('servicio.citas', 'citas')
            .where('servicio.idServicio = :id', { id })
            .getOne();
    },

    async findWithCortes(id: number) {
        return this.createQueryBuilder('servicio')
            .leftJoinAndSelect('servicio.cortes', 'cortes')
            .where('servicio.idServicio = :id', { id })
            .getOne();
    },

    async findAllWithRelations() {
        return this.createQueryBuilder('servicio')
            .leftJoinAndSelect('servicio.citas', 'citas')
            .leftJoinAndSelect('servicio.cortes', 'cortes')
            .orderBy('servicio.nombre', 'ASC')
            .getMany();
    },
    
    async findAllWithCortes() {
        return this.find({ 
            relations: ['cortes'] 
        });
    }
});