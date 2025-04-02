import { AppDataSource } from '../config/database';
import { QueryRunner } from 'typeorm';
import { User } from '../entity/user';
import { Cliente } from '../entity/cliente';
import { Empleado } from '../entity/empleado';
import { CreateUserDto } from '../dtos/User/CreateUser.dto';

export class UserFactory {
    static async create(userData: CreateUserDto): Promise<User> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Validación básica
            if (!userData.usuario || !userData.contraseña) {
                throw new Error('Usuario y contraseña son requeridos');
            }

            const user = new User();
            user.usuario = userData.usuario;
            user.contraseña = userData.contraseña;

            // Crear empleado si existe en el DTO
            if (userData.empleado) {
                const empleado = new Empleado();
                Object.assign(empleado, userData.empleado);
                await queryRunner.manager.save(empleado);
                user.empleado = empleado;
            }

            // Crear cliente si existe en el DTO
            if (userData.cliente) {
                const cliente = new Cliente();
                Object.assign(cliente, userData.cliente);
                await queryRunner.manager.save(cliente);
                user.cliente = cliente;
            }

            // Validar que tenga al menos cliente o empleado
            if (!user.empleado && !user.cliente) {
                throw new Error('El usuario debe tener asociado un cliente o un empleado');
            }

            await queryRunner.manager.save(user);
            await queryRunner.commitTransaction();

            return user;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    static async createWithRelations(userData: CreateUserDto): Promise<{
        user: User;
        cliente?: Cliente;
        empleado?: Empleado;
    }> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const user = await this.create(userData);
            await queryRunner.commitTransaction();

            return {
                user,
                cliente: user.cliente,
                empleado: user.empleado
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
}