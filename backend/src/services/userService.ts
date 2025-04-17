import { User } from '../entity/user';
import { DataSource, Repository } from 'typeorm';
import { UserRepository } from '../repository/UserRepository';
import { CreateUserDto } from '../dtos/User/CreateUser.dto';
import { UserFactory } from '../factories/UserFactory';
import { UpdateUserDto } from '../dtos/User/UpdateUser.dto';
import { LoginUserDto } from '../dtos/User/LoginUser.dto';
import { Empleado } from '../entity/empleado';
import { Cliente } from '../entity/cliente';
import { Cita } from '../entity/cita';
import { ArqueoCaja } from '../entity/arqueoCaja';
import * as bcrypt from 'bcryptjs';

export class UserService {
    private userRepository: Repository<User>;
    private empleadoRepository: Repository<Empleado>;

    constructor(private dataSource: DataSource) {
        this.userRepository = dataSource.getRepository(User);
        this.empleadoRepository = dataSource.getRepository(Empleado);
    }

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

    async create(userData: CreateUserDto): Promise<any> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            let empleado;
            
            if (userData.empleado) {
                // Crear empleado primero
                empleado = new Empleado();
                empleado.nombre = userData.empleado.nombre;
                empleado.apellido = userData.empleado.apellido;
                empleado.telefono = userData.empleado.telefono;
                empleado.estado = 'activo';
                empleado.cargo = userData.empleado.cargo || 'Cajero';
                
                await queryRunner.manager.save(empleado);
            }

            // Crear usuario
            const user = new User();
            user.usuario = userData.usuario;
            user.contraseña = userData.contraseña;
            //user.contraseña = await bcrypt.hash(userData.contraseña, 10);
            if (empleado) user.empleado = empleado;
            
            await queryRunner.manager.save(user);
            await queryRunner.commitTransaction();
            
            return {
                usuario: user,
                empleado: empleado
            };
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
    
            // 1. Eliminar citas asociadas al empleado (si existe)
            if (user.empleado) {
                // Primero eliminar las relaciones many-to-many si existen
                await queryRunner.manager.query(
                    `DELETE FROM cita_servicios_servicio WHERE citaIdCita IN 
                    (SELECT idCita FROM cita WHERE empleadoIdEmpleado = ?)`,
                    [user.empleado.idEmpleado]
                );
    
                // Luego eliminar las citas
                await queryRunner.manager.delete(Cita, { 
                    empleado: { idEmpleado: user.empleado.idEmpleado } 
                });
    
                // Eliminar arqueos de caja asociados al empleado
                await queryRunner.manager.delete(ArqueoCaja, {
                    empleado: { idEmpleado: user.empleado.idEmpleado }
                });
            }
    
            // 2. Eliminar citas asociadas al cliente (si existe)
            if (user.cliente) {
                // Primero eliminar las relaciones many-to-many si existen
                await queryRunner.manager.query(
                    `DELETE FROM cita_servicios_servicio WHERE citaIdCita IN 
                    (SELECT idCita FROM cita WHERE clienteIdCliente = ?)`,
                    [user.cliente.idCliente]
                );
    
                // Luego eliminar las citas
                await queryRunner.manager.delete(Cita, { 
                    cliente: { idCliente: user.cliente.idCliente } 
                });
            }
    
            // 3. Eliminar empleado o cliente asociado
            if (user.empleado) {
                await queryRunner.manager.delete(Empleado, user.empleado.idEmpleado);
            }
            
            if (user.cliente) {
                await queryRunner.manager.delete(Cliente, user.cliente.idCliente);
            }
    
            // 4. Finalmente eliminar el usuario
            await queryRunner.manager.delete(User, id);
            
            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            
            // Mejorar el mensaje de error para diagnóstico
            console.error('Error detallado al eliminar usuario:', {
                userId: id,
                error: error instanceof Error ? error.message : error,
                stack: error instanceof Error ? error.stack : undefined
            });
            
            throw new Error(`Error al eliminar usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            await queryRunner.release();
        }
    }
}