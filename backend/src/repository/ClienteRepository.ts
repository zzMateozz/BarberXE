import { AppDataSource } from '../config/database';
import { Cliente } from '../entity/cliente';

export const ClienteRepository = AppDataSource.getRepository(Cliente).extend({
  // Métodos personalizados para Cliente
    findByName(nombre: string) {
        return this.createQueryBuilder('cliente')
        .where('cliente.nombre LIKE :nombre', { nombre: `%${nombre}%` })
        .getMany();
    },
    
    findWithCitas() {
        return this.createQueryBuilder('cliente')
        .leftJoinAndSelect('cliente.citas', 'citas')
        .leftJoinAndSelect('citas.servicios', 'servicios')
        .getMany();
    }
});