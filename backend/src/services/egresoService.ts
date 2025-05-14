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

    async findByArqueoId(arqueoId: number): Promise<Egreso[]> {
        return await EgresoRepository.find({
            where: { arqueo: { idArqueo: arqueoId } },
            relations: ['arqueo']
        });
    }

    async create(egresoData: CreateEgresoDto): Promise<Egreso> {
        const queryRunner = EgresoRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Obtener arqueo primero para validar
            const arqueo = await queryRunner.manager.findOne(ArqueoCaja, {
                where: { idArqueo: egresoData.arqueoId }
            });
            
            if (!arqueo) {
                throw new Error('Arqueo de caja no encontrado');
            }
            
            if (arqueo.fechaCierre) {
                throw new Error('No se pueden agregar egresos a un arqueo cerrado');
            }

            // Crear el nuevo egreso con todos los campos requeridos
            const egreso = new Egreso();
            egreso.monto = egresoData.monto;
            egreso.descripcion = egresoData.descripcion;
            egreso.fecha = new Date(); // Fecha actual
            egreso.categoria = egresoData.categoria || null;
            egreso.justificacion = egresoData.justificacion || null;
            egreso.arqueo = arqueo;

            // Guardar el egreso
            const savedEgreso = await queryRunner.manager.save(egreso);
            await queryRunner.commitTransaction();

            // Retornar el egreso guardado con sus relaciones
            return await this.findById(savedEgreso.idEgreso);
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