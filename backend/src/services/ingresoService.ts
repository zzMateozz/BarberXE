import { Ingreso } from '../entity/ingreso';
import { IngresoRepository } from '../repository/IngresoRepository';

export class IngresoService {
    async findAll(): Promise<Ingreso[]> {
        return await IngresoRepository.find();
    }

    async findById(id: number): Promise<Ingreso | null> {
        return await IngresoRepository.findOneBy({ idIngreso: id });
    }

    async create(ingresoData: Partial<Ingreso>): Promise<Ingreso> {
        const ingreso = IngresoRepository.create(ingresoData);
        return await IngresoRepository.save(ingreso);
    }

    async update(id: number, ingresoData: Partial<Ingreso>): Promise<Ingreso | null> {
        await IngresoRepository.update(id, ingresoData);
        return this.findById(id);
    }

    async delete(id: number): Promise<void> {
        await IngresoRepository.delete(id);
    }
}