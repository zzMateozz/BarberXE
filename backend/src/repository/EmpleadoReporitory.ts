import { AppDataSource } from '../config/database';
import { Empleado } from '../entity/empleado';

export const EmpleadoRepository = AppDataSource.getRepository(Empleado).extend({
    findByName(nombre: string) {
        return this.createQueryBuilder('empleado')
            .where('empleado.nombre LIKE :nombre', { nombre: `%${nombre}%` })
            .getMany();
    },

    findWithCitas() {
        return this.createQueryBuilder('empleado')
            .leftJoinAndSelect('empleado.citas', 'citas')
            .leftJoinAndSelect('citas.servicios', 'servicios')
            .getMany();
    },

    findWithArqueos() {
        return this.createQueryBuilder('empleado')
            .leftJoinAndSelect('empleado.arqueos', 'arqueos')
            .getMany();
    }
});