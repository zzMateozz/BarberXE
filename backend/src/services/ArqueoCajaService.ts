import { IsNull } from 'typeorm';
import { CloseArqueoCajaDto } from '../dtos/ArqueoCaja/CloseArqueoCaja.dto';
import { CreateArqueoCajaDto } from '../dtos/ArqueoCaja/CreateArqueoCaja.dto';
import { ArqueoCaja } from '../entity/arqueoCaja';
import { Empleado } from '../entity/empleado';
import { ArqueoCajaRepository } from '../repository/ArqueoCajaRepository';

export class ArqueoCajaService {
    async findAll(): Promise<ArqueoCaja[]> {
        return await ArqueoCajaRepository.find({
            relations: ['empleado', 'ingresos', 'egresos', 'cortes'], // CAMBIOS AQUÍ
            order: { fechaInicio: 'DESC' }
        });
    }

    async findById(id: number): Promise<ArqueoCaja> {
        const arqueo = await ArqueoCajaRepository.findWithDetails(id);
        
        if (!arqueo) {
            throw new Error(`Arqueo con ID ${id} no encontrado`);
        }
        
        return arqueo;
    }

    async getByEmpleado(empleadoId: number, options?: { withRelations?: boolean }): Promise<ArqueoCaja[]> {
        const relations = options?.withRelations 
            ? ['ingresos', 'egresos', 'empleado'] 
            : [];
        
        return await ArqueoCajaRepository.find({
            where: { empleado: { idEmpleado: empleadoId } },
            relations,
            order: { fechaInicio: 'DESC' }
        });
    }

    async findOpenByEmpleado(empleadoId: number): Promise<ArqueoCaja | null> {
        return await ArqueoCajaRepository.findOne({
            where: { 
                empleado: { idEmpleado: empleadoId },
                fechaCierre: IsNull()
            },
            relations: ['ingresos', 'egresos', 'empleado']
        });
    }
    
    async findByArqueoId(arqueoId: number): Promise<ArqueoCaja> {
        const arqueo = await ArqueoCajaRepository.findOne({
            where: { idArqueo: arqueoId },
            relations: ['ingresos', 'egresos']
        });
        
        if (!arqueo) {
            throw new Error('Arqueo no encontrado');
        }
        
        return arqueo;
    }

    async create(arqueoData: CreateArqueoCajaDto): Promise<ArqueoCaja> {
        const queryRunner = ArqueoCajaRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
    
        try {
            // Verificar si el empleado ya tiene un arqueo abierto
            const arqueoExistente = await ArqueoCajaRepository.findOpenByEmpleado(arqueoData.empleadoId);
            if (arqueoExistente) {
                throw new Error('El empleado ya tiene un arqueo de caja abierto');
            }
    
            const arqueo = new ArqueoCaja();
            arqueo.fechaInicio = new Date();
            arqueo.saldoInicial = arqueoData.saldoInicial;
    
            const empleado = await queryRunner.manager.findOne(Empleado, {
                where: { idEmpleado: arqueoData.empleadoId }
            });
            
            if (!empleado) {
                throw new Error('Empleado no encontrado');
            }
    
            arqueo.empleado = empleado;
            await queryRunner.manager.save(arqueo);
            await queryRunner.commitTransaction();
    
            return arqueo;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
    
    async close(id: number, closeData: CloseArqueoCajaDto): Promise<ArqueoCaja> {
        const queryRunner = ArqueoCajaRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
    
        try {
            const arqueo = await ArqueoCajaRepository.findWithDetails(id);
    
            if (!arqueo) {
                throw new Error('Arqueo de caja no encontrado');
            }
    
            if (arqueo.fechaCierre) {
                throw new Error('El arqueo de caja ya está cerrado');
            }
    
            // Calcular totales
            const totalIngresos = arqueo.ingresos.reduce((sum, ing) => sum + ing.monto, 0);
            const totalEgresos = arqueo.egresos.reduce((sum, eg) => sum + eg.monto, 0);
            const saldoCalculado = arqueo.saldoInicial + totalIngresos - totalEgresos;
    
            // Validar saldo final
            if (Math.abs(saldoCalculado - closeData.saldoFinal) > 0.01) {
                throw new Error(`Discrepancia encontrada. Saldo calculado: ${saldoCalculado}, Saldo reportado: ${closeData.saldoFinal}`);
            }
            
    
            arqueo.fechaCierre = new Date();
            arqueo.saldoFinal = closeData.saldoFinal;
            arqueo.observaciones = closeData.observaciones || null;
    
            await queryRunner.manager.save(arqueo);
            await queryRunner.commitTransaction();
    
            return arqueo;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async update(id: number, partialData: { observaciones?: string }): Promise<ArqueoCaja> {
        await ArqueoCajaRepository.update(id, partialData);
        return this.findById(id);
    }

}