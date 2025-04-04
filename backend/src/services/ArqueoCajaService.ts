import { CloseArqueoCajaDto } from '../dtos/ArqueoCaja/CloseArqueoCaja.dto';
import { CreateArqueoCajaDto } from '../dtos/ArqueoCaja/CreateArqueoCaja.dto';
import { ArqueoCaja } from '../entity/arqueoCaja';
import { Corte } from '../entity/corte';
import { Egreso } from '../entity/egreso';
import { Empleado } from '../entity/empleado';
import { Ingreso } from '../entity/ingreso';
import { ArqueoCajaRepository } from '../repository/ArqueoCajaRepository';

export class ArqueoCajaService {
    async findAll(): Promise<ArqueoCaja[]> {
        return await ArqueoCajaRepository.find({
            relations: ['empleado', 'ingreso', 'egreso', 'cortes']
        });
    }

    async findById(id: number): Promise<ArqueoCaja> {
        // Validación del ID
        if (isNaN(id) || id <= 0) {
            throw new Error('ID de arqueo no válido');
        }

        const arqueo = await ArqueoCajaRepository.findOne({
            where: { idArqueo: id },
            relations: ['empleado', 'ingreso', 'egreso', 'cortes']
        });

        if (!arqueo) {
            throw new Error(`Arqueo con ID ${id} no encontrado`);
        }

        return arqueo;
    }

    async findByEmpleado(empleadoId: number): Promise<ArqueoCaja[]> {
        return await ArqueoCajaRepository.findByEmpleado(empleadoId);
    }

    async create(arqueoData: CreateArqueoCajaDto): Promise<ArqueoCaja> {
        const queryRunner = ArqueoCajaRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
    
        try {
            const arqueo = new ArqueoCaja();
            arqueo.fechaInicio = arqueoData.fechaInicio;
    
            const empleado = await queryRunner.manager.findOne(Empleado, {
                where: { idEmpleado: arqueoData.empleadoId }
            });
            if (!empleado) throw new Error('Empleado no encontrado');
            
            arqueo.empleado = empleado;
            await queryRunner.manager.save(arqueo);
            await queryRunner.commitTransaction();
    
            return arqueo;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error instanceof Error ? error : new Error('Error desconocido');
        } finally {
            await queryRunner.release();
        }
    }

    async close(id: number, closeData: CloseArqueoCajaDto): Promise<ArqueoCaja> {
        const queryRunner = ArqueoCajaRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
    
        try {
            const arqueo = await ArqueoCajaRepository.findOne({
                where: { idArqueo: id },
                relations: ['empleado']
            });
    
            if (!arqueo) {
                throw new Error('Arqueo de caja no encontrado');
            }
    
            if (arqueo.fechaCierre) {
                throw new Error('El arqueo de caja ya está cerrado');
            }
    
            arqueo.fechaCierre = closeData.fechaCierre;
    
            // Crear y asociar ingreso
            if (closeData.ingreso) {
                const ingreso = new Ingreso();
                ingreso.monto = closeData.ingreso.monto;
                arqueo.ingreso = ingreso; // La relación cascade se encargará del save
            }
    
            // Crear y asociar egreso
            if (closeData.egreso) {
                const egreso = new Egreso();
                egreso.monto = closeData.egreso.monto;
                arqueo.egreso = egreso; // La relación cascade se encargará del save
            }
    
            await queryRunner.manager.save(arqueo);
            await queryRunner.commitTransaction();
    
            return arqueo;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            console.error('Error al cerrar arqueo:', error);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async update(id: number, arqueoData: Partial<ArqueoCaja>): Promise<ArqueoCaja | null> {
        await ArqueoCajaRepository.update(id, arqueoData);
        return this.findById(id);
    }

    async delete(id: number): Promise<void> {
        const queryRunner = ArqueoCajaRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
    
        try {
            // Buscar el arqueo con sus relaciones
            const arqueo = await queryRunner.manager.findOne(ArqueoCaja, {
                where: { idArqueo: id },
                relations: ['ingreso', 'egreso', 'cortes']
            });
    
            if (!arqueo) {
                throw new Error('Arqueo de caja no encontrado');
            }
    
            // Eliminar relaciones primero (si es necesario)
            if (arqueo.ingreso) {
                await queryRunner.manager.delete(Ingreso, arqueo.ingreso.idIngreso);
            }
    
            if (arqueo.egreso) {
                await queryRunner.manager.delete(Egreso, arqueo.egreso.idEgreso);
            }
    
            // Eliminar cortes asociados (dependiendo de tus requisitos de negocio)
            if (arqueo.cortes && arqueo.cortes.length > 0) {
                await queryRunner.manager.delete(Corte, arqueo.cortes.map(c => c.idCorte));
            }
    
            // Finalmente eliminar el arqueo
            await queryRunner.manager.delete(ArqueoCaja, id);
            
            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            console.error('Error al eliminar arqueo:', error);
            
            // Relanzar el error con un mensaje adecuado
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Error desconocido al eliminar arqueo de caja');
        } finally {
            await queryRunner.release();
        }
    }
}