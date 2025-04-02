import { Egreso } from '../entity/egreso';
import { EgresoRepository } from '../repository/EgresoRepository';

export class EgresoService {
    async findAll(): Promise<Egreso[]> {
        return await EgresoRepository.find();
    }

    async findById(id: number): Promise<Egreso | null> {
        return await EgresoRepository.findOneBy({ idEgreso: id });
    }

    async create(egresoData: Partial<Egreso>): Promise<Egreso> {
        const egreso = EgresoRepository.create(egresoData);
        return await EgresoRepository.save(egreso);
    }

    async update(id: number, egresoData: Partial<Egreso>): Promise<Egreso | null> {
        await EgresoRepository.update(id, egresoData);
        return this.findById(id);
    }

    async delete(id: number): Promise<void> {
        await EgresoRepository.delete(id);
    }
}