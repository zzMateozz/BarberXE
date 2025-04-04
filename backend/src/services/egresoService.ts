import { CreateEgresoDto } from '../dtos/Egreso/CreateEgreso.dto';
import { ArqueoCaja } from '../entity/arqueoCaja';
import { Egreso } from '../entity/egreso';
import { EgresoRepository } from '../repository/EgresoRepository';

export class EgresoService {
    async findAll(): Promise<Egreso[]> {
        return await EgresoRepository.find({ relations: ['arqueo'] });
    }

    async findById(id: number): Promise<Egreso> {
        const egreso = await EgresoRepository.findOne({
            where: { idEgreso: id },
            relations: ['arqueo']
        });
        if (!egreso) {
            throw new Error(`Egreso con ID ${id} no encontrado`);
        }
        return egreso;
    }

    async create(egresoData: CreateEgresoDto): Promise<Egreso> {
        const queryRunner = EgresoRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const egreso = new Egreso();
            egreso.monto = egresoData.monto;

            // Obtener arqueo
            const arqueo = await queryRunner.manager.findOne(ArqueoCaja, {
                where: { idArqueo: egresoData.arqueoId }
            });
            if (!arqueo) {
                throw new Error('Arqueo de caja no encontrado');
            }
            egreso.arqueo = arqueo;

            await queryRunner.manager.save(egreso);
            await queryRunner.commitTransaction();

            return await this.findById(egreso.idEgreso);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async update(id: number, egresoData: Partial<Egreso>): Promise<Egreso | null> {
        await EgresoRepository.update(id, egresoData);
        return this.findById(id);
    }

    async delete(id: number): Promise<void> {
        const egreso = await this.findById(id);
        await EgresoRepository.remove(egreso);
    }
}