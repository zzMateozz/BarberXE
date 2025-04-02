import { User } from '../entity/user';
import { UserRepository } from '../repository/UserRepository';
import { CreateUserDto } from '../dtos/User/CreateUser.dto';
import { UserFactory } from '../factories/UserFactory';
import { UpdateUserDto } from '../dtos/User/UpdateUser.dto';
import { LoginUserDto } from '../dtos/User/LoginUser.dto';
import { Empleado } from '../entity/empleado';
import { Cliente } from '../entity/cliente';

export class UserService {
    async findAll(): Promise<User[]> {
        return await UserRepository.find({
            relations: ['empleado', 'cliente']
        });
    }

    async findById(id: number): Promise<User> {  // Removemos el | null
        const user = await UserRepository.findOne({
            where: { idUser: id },
            relations: ['empleado', 'cliente']
        });
        if (!user) {
            throw new Error(`Usuario con ID ${id} no encontrado`);
        }
        return user;
    }

    async findByUsername(username: string): Promise<User | null> {
        return await UserRepository.findOne({
            where: { usuario: username },
            relations: ['empleado', 'cliente']
        });
    }

    async create(userData: CreateUserDto): Promise<User> {
        const queryRunner = UserRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
    
        try {
            // Verificar usuario existente
            if (await this.findByUsername(userData.usuario)) {
                throw new Error('El nombre de usuario ya está en uso');
            }
    
            const user = new User();
            user.usuario = userData.usuario;
            user.contraseña = userData.contraseña;
    
            // Manejar Cliente
            if (userData.cliente) {
                const cliente = new Cliente();
                Object.assign(cliente, userData.cliente);
                user.cliente = cliente;
            }
    
            // Manejar Empleado
            if (userData.empleado) {
                const empleado = new Empleado();
                Object.assign(empleado, userData.empleado);
                user.empleado = empleado;
            }
    
            // Validar que tenga al menos cliente o empleado
            if (!user.cliente && !user.empleado) {
                throw new Error('El usuario debe tener asociado un cliente o un empleado');
            }
    
            // Guardar todo
            await queryRunner.manager.save(user);
            await queryRunner.commitTransaction();
    
            return await this.findById(user.idUser); // Retornar con relaciones cargadas
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async login(loginData: LoginUserDto): Promise<User | null> {
        const user = await UserRepository.findOne({
            where: { 
                usuario: loginData.usuario, 
                contraseña: loginData.contraseña 
            },
            relations: ['empleado', 'cliente']
        });

        if (!user) {
            throw new Error('Credenciales inválidas');
        }

        return user;
    }

    async update(id: number, userData: UpdateUserDto): Promise<User> {
        const queryRunner = UserRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const user = await this.findById(id);
            if (!user) {
                throw new Error('Usuario no encontrado');
            }

            // Actualizar solo campos permitidos
            if (userData.usuario) user.usuario = userData.usuario;
            if (userData.contraseña) user.contraseña = userData.contraseña;

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

    async delete(id: number): Promise<void> {
        const queryRunner = UserRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const user = await this.findById(id);
            if (!user) {
                throw new Error('Usuario no encontrado');
            }

            // Eliminar relaciones primero si es necesario
            if (user.empleado) {
                await queryRunner.manager.delete(Empleado, user.empleado.idEmpleado);
            }
            
            if (user.cliente) {
                await queryRunner.manager.delete(Cliente, user.cliente.idCliente);
            }

            await queryRunner.manager.delete(User, id);
            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
}