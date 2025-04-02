import { Cliente } from '../entity/cliente';
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
        await ClienteRepository.delete(id);
    }

    async findByName(nombre: string): Promise<Cliente[]> {
        return await ClienteRepository.findByName(nombre);
    }

    async findWithCitas(): Promise<Cliente[]> {
        return await ClienteRepository.findWithCitas();
    }
}