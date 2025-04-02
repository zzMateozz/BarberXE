import { Servicio } from '../entity/servicio';
import { ServicioRepository } from '../repository/ServicioRepository';

export class ServicioService {
    async findAll(): Promise<Servicio[]> {
        return await ServicioRepository.find();
    }

    async findById(id: number): Promise<Servicio | null> {
        return await ServicioRepository.findOneBy({ idServicio: id });
    }

    async findByNombre(nombre: string): Promise<Servicio[]> {
        return await ServicioRepository.findByNombre(nombre);
    }

    async create(servicioData: Partial<Servicio>): Promise<Servicio> {
        const servicio = ServicioRepository.create(servicioData);
        return await ServicioRepository.save(servicio);
    }

    async update(id: number, servicioData: Partial<Servicio>): Promise<Servicio | null> {
        await ServicioRepository.update(id, servicioData);
        return this.findById(id);
    }

    async delete(id: number): Promise<void> {
        await ServicioRepository.delete(id);
    }
}