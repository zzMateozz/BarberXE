import { ArqueoCaja } from '../entity/arqueoCaja';
import { ArqueoCajaRepository } from '../repository/ArqueoCajaRepository';

export class ArqueoCajaService {
    async findAll(): Promise<ArqueoCaja[]> {
        return await ArqueoCajaRepository.find();
    }

    async findById(id: number): Promise<ArqueoCaja | null> {
        return await ArqueoCajaRepository.findOneBy({ idArqueo: id });
    }

    async findByEmpleado(empleadoId: number): Promise<ArqueoCaja[]> {
        return await ArqueoCajaRepository.findByEmpleado(empleadoId);
    }

    async create(arqueoData: Partial<ArqueoCaja>): Promise<ArqueoCaja> {
        const arqueo = ArqueoCajaRepository.create(arqueoData);
        return await ArqueoCajaRepository.save(arqueo);
    }

    async update(id: number, arqueoData: Partial<ArqueoCaja>): Promise<ArqueoCaja | null> {
        await ArqueoCajaRepository.update(id, arqueoData);
        return this.findById(id);
    }

    async delete(id: number): Promise<void> {
        await ArqueoCajaRepository.delete(id);
    }
}