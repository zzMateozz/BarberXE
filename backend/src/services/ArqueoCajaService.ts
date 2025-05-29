import { IsNull } from 'typeorm';
import { CloseArqueoCajaDto } from '../dtos/ArqueoCaja/CloseArqueoCaja.dto';
import { CreateArqueoCajaDto } from '../dtos/ArqueoCaja/CreateArqueoCaja.dto';
import { ArqueoCaja } from '../entity/arqueoCaja';
import { Empleado } from '../entity/empleado';
import { ArqueoCajaRepository } from '../repository/ArqueoCajaRepository';

export class ArqueoCajaService {
    // Tolerancia configurable
    private readonly TOLERANCIA_DEFAULT = 1.00;
    private arqueoRepository = ArqueoCajaRepository;

    async findAll(): Promise<ArqueoCaja[]> {
        return await ArqueoCajaRepository.find({
            relations: ['empleado', 'ingresos', 'egresos', 'cortes'],
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
        try {
            // Buscar el arqueo con sus relaciones
            const arqueo = await this.arqueoRepository.findOne({
                where: { idArqueo: id },
                relations: ['ingresos', 'egresos', 'empleado']
            });

            if (!arqueo) {
                throw new Error('Arqueo de caja no encontrado');
            }

            if (arqueo.fechaCierre) {
                throw new Error('El arqueo ya está cerrado');
            }

            // Función auxiliar para calcular totales de forma segura
            const calculateTotal = (items: any[]): number => {
                if (!Array.isArray(items) || items.length === 0) {
                    return 0;
                }
                return items.reduce((sum, item) => {
                    const value = Number(item.monto) || 0;
                    return sum + value;
                }, 0);
            };

            // Función auxiliar para validar números
            const validateNumber = (value: any): number => {
                const num = Number(value);
                return isNaN(num) ? 0 : num;
            };

            // Calcular valores de forma segura
            const saldoInicial = validateNumber(arqueo.saldoInicial);
            const totalIngresos = calculateTotal(arqueo.ingresos || []);
            const totalEgresos = calculateTotal(arqueo.egresos || []);
            const saldoCalculado = saldoInicial + totalIngresos - totalEgresos;
            const saldoFinal = validateNumber(closeData.saldoFinal);
            const diferencia = saldoFinal - saldoCalculado;

            // Actualizar el arqueo
            arqueo.fechaCierre = new Date();
            arqueo.saldoFinal = saldoFinal;
            arqueo.saldoCalculado = saldoCalculado;
            arqueo.diferencia = diferencia;
            arqueo.observaciones = closeData.observaciones || 'Sin observaciones';

            // Guardar en la base de datos
            const arqueoActualizado = await this.arqueoRepository.save(arqueo);

            // Retornar con las relaciones
            const arqueorelacion = await this.arqueoRepository.findOne({
                where: { idArqueo: arqueoActualizado.idArqueo },
                relations: ['ingresos', 'egresos', 'empleado']
                });

                if (!arqueorelacion) {
                throw new Error('Arqueo no encontrado');
                }
            return arqueorelacion;
        } catch (error) {
            console.error('Error en ArqueoCajaService.close:', error);
            throw error;
    }
}

    private generateCloseObservations(
        userObservations: string | null, 
        difference: number,
        tolerance: number
    ): string {
        const autoMessage = `Diferencia al cierre: $${difference.toFixed(2)}`;
        const warning = Math.abs(difference) > tolerance 
            ? ' (DIFERENCIA SIGNIFICATIVA)' 
            : ' (Dentro de tolerancia)';
        
        return userObservations 
            ? `${userObservations} | ${autoMessage}${warning}`
            : `${autoMessage}${warning}`;
    }

    async update(id: number, partialData: { observaciones?: string }): Promise<ArqueoCaja> {
        await ArqueoCajaRepository.update(id, partialData);
        return this.findById(id);
    }

    // Método para obtener estadísticas de diferencias
    async getDifferencesStats(empleadoId?: number, dateRange?: { start: Date, end: Date }) {
        let query = ArqueoCajaRepository.createQueryBuilder('arqueo')
            .select('arqueo.diferencia', 'diferencia')
            .addSelect('arqueo.fechaCierre', 'fechaCierre')
            .addSelect('arqueo.idArqueo', 'id')
            .where('arqueo.fechaCierre IS NOT NULL')
            .andWhere('arqueo.diferencia IS NOT NULL');

        if (empleadoId) {
            query = query.andWhere('arqueo.empleadoId = :empleadoId', { empleadoId });
        }

        if (dateRange) {
            query = query.andWhere('arqueo.fechaCierre BETWEEN :start AND :end', dateRange);
        }

        const results = await query.getRawMany();
        
        const stats = {
            total: results.length,
            conDiferencia: results.filter(r => Math.abs(r.diferencia) > this.TOLERANCIA_DEFAULT).length,
            promedioAbsoluto: results.reduce((sum, r) => sum + Math.abs(r.diferencia), 0) / results.length,
            mayorDiferencia: Math.max(...results.map(r => Math.abs(r.diferencia))),
            porcentajeFueraDeToleranacia: results.length > 0 
                ? (results.filter(r => Math.abs(r.diferencia) > this.TOLERANCIA_DEFAULT).length / results.length) * 100 
                : 0
        };

        return {
            estadisticas: stats,
            detalles: results
        };
    }
}