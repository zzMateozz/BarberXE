import { CreateIngresoDto } from '../dtos/Ingreso/CreateIngreso.dto';
import { ArqueoCaja } from '../entity/arqueoCaja';
import { Ingreso } from '../entity/ingreso';
import { IngresoRepository } from '../repository/IngresoRepository';

export class IngresoService {
    async findAll(): Promise<Ingreso[]> {
        return await IngresoRepository.find({ relations: ['arqueo'] });
    }

    async findById(id: number): Promise<Ingreso> {
        const ingreso = await IngresoRepository.findOne({
            where: { idIngreso: id },
            relations: ['arqueo']
        });
        if (!ingreso) {
            throw new Error(`Ingreso con ID ${id} no encontrado`);
        }
        return ingreso;
    }

    async create(ingresoData: CreateIngresoDto): Promise<Ingreso> {
        const queryRunner = IngresoRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const ingreso = new Ingreso();
            ingreso.monto = ingresoData.monto;

            // Obtener arqueo
            const arqueo = await queryRunner.manager.findOne(ArqueoCaja, {
                where: { idArqueo: ingresoData.arqueoId }
            });
            if (!arqueo) {
                throw new Error('Arqueo de caja no encontrado');
            }
            ingreso.arqueo = arqueo;

            await queryRunner.manager.save(ingreso);
            await queryRunner.commitTransaction();

            return await this.findById(ingreso.idIngreso);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async update(id: number, ingresoData: Partial<Ingreso>): Promise<Ingreso | null> {
        await IngresoRepository.update(id, ingresoData);
        return this.findById(id);
    }

    async delete(id: number): Promise<void> {
        const ingreso = await this.findById(id);
        await IngresoRepository.remove(ingreso);
    }
}