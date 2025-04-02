import { Corte } from '../entity/corte';
import { CorteRepository } from '../repository/CorteRepository';

export class CorteService {
    async findAll(): Promise<Corte[]> {
        return await CorteRepository.find();
    }

    async findById(id: number): Promise<Corte | null> {
        return await CorteRepository.findOneBy({ idCorte: id });
    }

    async findByEstilo(estilo: string): Promise<Corte[]> {
        return await CorteRepository.findByEstilo(estilo);
    }

    async create(corteData: Partial<Corte>): Promise<Corte> {
        const corte = CorteRepository.create(corteData);
        return await CorteRepository.save(corte);
    }

    async update(id: number, corteData: Partial<Corte>): Promise<Corte | null> {
        await CorteRepository.update(id, corteData);
        return this.findById(id);
    }

    async delete(id: number): Promise<void> {
        await CorteRepository.delete(id);
    }
}