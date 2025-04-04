import { Cita } from '../entity/cita';
import { Cliente } from '../entity/cliente';
import { User } from '../entity/user';
import { ClienteRepository } from '../repository/ClienteRepository';

export class ClienteService {
    async findAll(): Promise<Cliente[]> {
        return await ClienteRepository.find();
    }

    async findById(id: number): Promise<Cliente | null> {
        return await ClienteRepository.findOneBy({ idCliente: id });
    }

    async create(clienteData: Partial<Cliente>): Promise<Cliente> {
        const cliente = ClienteRepository.create(clienteData);
        return await ClienteRepository.save(cliente);
    }

    async update(id: number, clienteData: Partial<Cliente>): Promise<Cliente | null> {
        await ClienteRepository.update(id, clienteData);
        return this.findById(id);
    }

    async delete(id: number): Promise<void> {
        const queryRunner = ClienteRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
    
        try {
            // 1. Buscar el cliente con sus relaciones
            const cliente = await ClienteRepository.findOne({
                where: { idCliente: id },
                relations: ['citas', 'user']
            });
    
            if (!cliente) {
                throw new Error('Cliente no encontrado');
            }
    
            // 2. Eliminar las citas asociadas al cliente
            if (cliente.citas && cliente.citas.length > 0) {
                // Primero eliminar las relaciones many-to-many de servicios
                await queryRunner.manager.query(
                    `DELETE FROM cita_servicios_servicio WHERE citaIdCita IN 
                    (SELECT idCita FROM cita WHERE clienteIdCliente = ?)`,
                    [id]
                );
                
                // Luego eliminar las citas
                await queryRunner.manager.delete(Cita, { 
                    cliente: { idCliente: id } 
                });
            }
    
            // 3. Eliminar el usuario asociado si existe
            if (cliente.user) {
                await queryRunner.manager.delete(User, cliente.user.idUser);
            }
    
            // 4. Finalmente eliminar el cliente
            await queryRunner.manager.delete(Cliente, id);
            
            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            console.error('Error al eliminar cliente:', {
                clienteId: id,
                error: error instanceof Error ? error.message : error,
                stack: error instanceof Error ? error.stack : undefined
            });
            
            throw new Error(`Error al eliminar cliente: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            await queryRunner.release();
        }
    }

    async findByName(nombre: string): Promise<Cliente[]> {
        return await ClienteRepository.findByName(nombre);
    }

    async findWithCitas(): Promise<Cliente[]> {
        return await ClienteRepository.findWithCitas();
    }
}