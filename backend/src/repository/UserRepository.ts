import { AppDataSource } from '../config/database';
import { User } from '../entity/user';

export const UserRepository = AppDataSource.getRepository(User).extend({
    async findWithDetails(id: number) {
        return this.createQueryBuilder('user')
            .leftJoinAndSelect('user.empleado', 'empleado')
            .leftJoinAndSelect('user.cliente', 'cliente')
            .where('user.idUser = :id', { id })
            .getOne();
    }
});