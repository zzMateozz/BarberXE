import { Request, Response } from 'express';
import { ArqueoCajaService } from '../services/ArqueoCajaService';
import { CreateArqueoCajaDto } from '../dtos/ArqueoCaja/CreateArqueoCaja.dto';
import { CloseArqueoCajaDto } from '../dtos/ArqueoCaja/CloseArqueoCaja.dto';
import { IngresoService } from '../services/ingresoService';
import { EgresoService } from '../services/egresoService';
import { CreateEgresoDto } from '../dtos/Egreso/CreateEgreso.dto';
import { CreateIngresoDto } from '../dtos/Ingreso/CreateIngreso.dto';
import { ArqueoCaja } from '../entity/arqueoCaja';
import { HttpResponse } from '../shared/response/http.response';

export class ArqueoCajaController {
    private arqueoCajaService: ArqueoCajaService;
    private ingresoService: IngresoService;
    private egresoService: EgresoService;
    private httpResponse: HttpResponse;

    constructor() {
        this.arqueoCajaService = new ArqueoCajaService();
        this.ingresoService = new IngresoService();
        this.egresoService = new EgresoService();
        this.httpResponse = new HttpResponse();
        this.close = this.close.bind(this);
    }

    // Función auxiliar para calcular totales de forma segura
    private calculateTotal(items: any[], field: string = 'monto'): number {
        if (!Array.isArray(items) || items.length === 0) {
            return 0;
        }

        const total = items.reduce((sum, item) => {
            const value = Number(item[field]) || 0;

            return sum + value;
        }, 0);


        return total;
    }

    // Función auxiliar para validar números
    private validateNumber(value: any, defaultValue: number = 0): number {
        const num = Number(value);
        const result = isNaN(num) ? defaultValue : num;
  
        return result;
    }

    getAll = async (req: Request, res: Response): Promise<void> => {
        try {
            const arqueos = await this.arqueoCajaService.findAll();
            this.httpResponse.OK(res, {
                success: true,
                data: arqueos
            });
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Error en getAll:', error.message);
                this.httpResponse.Error(res, {
                    success: false,
                    message: 'Error al obtener arqueos de caja',
                    error: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            } else {
                console.error('Error en getAll:', error);
                this.httpResponse.Error(res, {
                    success: false,
                    message: 'Error desconocido'
                });
            }
        }
    };

    getById = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const arqueo = await this.arqueoCajaService.findById(id);

            // Cálculos seguros
            const totalIngresos = this.calculateTotal(arqueo.ingresos || []);
            const totalEgresos = this.calculateTotal(arqueo.egresos || []);
            const saldoInicial = this.validateNumber(arqueo.saldoInicial);
            const saldoCalculado = saldoInicial + totalIngresos - totalEgresos;

            this.httpResponse.OK(res, {
                success: true,
                data: {
                    ...arqueo,
                    totalIngresos,
                    totalEgresos,
                    saldoCalculado
                }
            });
        } catch (error: any) {
            this.httpResponse.NotFound(res, {
                success: false,
                message: error.message
            });
        }
    }

    // Métodos auxiliares para formatear la respuesta
    private formatBasicArqueo(arqueo: ArqueoCaja): any {
        return {
            id: arqueo.idArqueo,
            fechaInicio: arqueo.fechaInicio,
            fechaCierre: arqueo.fechaCierre,
            estado: arqueo.fechaCierre ? 'CERRADO' : 'ABIERTO'
        };
    }

    private formatDetailedArqueo(arqueo: ArqueoCaja): any {
        const totalIngresos = this.calculateTotal(arqueo.ingresos || []);
        const totalEgresos = this.calculateTotal(arqueo.egresos || []);

        return {
            id: arqueo.idArqueo,
            fechaInicio: arqueo.fechaInicio,
            fechaCierre: arqueo.fechaCierre,
            saldoInicial: this.validateNumber(arqueo.saldoInicial),
            saldoFinal: this.validateNumber(arqueo.saldoFinal),
            empleado: {
                id: arqueo.empleado.idEmpleado,
                nombre: arqueo.empleado.nombre
            },
            resumen: {
                totalIngresos,
                totalEgresos,
                cantidadMovimientos: (arqueo.ingresos?.length || 0) + (arqueo.egresos?.length || 0)
            }
        };
    }

    getByEmpleado = async (req: Request, res: Response): Promise<void> => {
        try {
            const empleadoId = parseInt(req.params.empleadoId);
            const withDetails = req.query.details === 'true';

            const arqueos = await this.arqueoCajaService.getByEmpleado(empleadoId, {
                withRelations: withDetails
            });

            if (!arqueos || arqueos.length === 0) {
                this.httpResponse.NotFound(res, {
                    success: false,
                    message: 'No se encontraron arqueos para este empleado'
                });
                return;
            }

            const responseData = withDetails
                ? arqueos.map(arqueo => this.formatDetailedArqueo(arqueo))
                : arqueos.map(arqueo => this.formatBasicArqueo(arqueo));

            this.httpResponse.OK(res, {
                success: true,
                data: responseData
            });
        } catch (error: any) {
            this.httpResponse.Error(res, {
                success: false,
                message: 'Error al obtener arqueos por empleado',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    create = async (req: Request, res: Response): Promise<void> => {
        try {
            const arqueoData = new CreateArqueoCajaDto(req.body);
            const arqueo = await this.arqueoCajaService.create(arqueoData);
            this.httpResponse.Created(res, {
                success: true,
                data: arqueo
            });
        } catch (error: any) {
            console.error('Error en create:', error);

            if (error.message.includes('ID de empleado')) {
                this.httpResponse.BadRequest(res, {
                    success: false,
                    message: error.message,
                    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
                });
            } else if (error.message.includes('ya tiene un arqueo')) {
                this.httpResponse.BadRequest(res, {
                    success: false,
                    message: error.message,
                    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
                });
            } else if (error.message.includes('no encontrado')) {
                this.httpResponse.NotFound(res, {
                    success: false,
                    message: error.message,
                    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
                });
            } else {
                this.httpResponse.Error(res, {
                    success: false,
                    message: error.message,
                    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
                });
            }
        }
    };

    public close = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const closeData = new CloseArqueoCajaDto({
                saldoFinal: req.body.saldoFinal,
                observacion: req.body.observacion || req.body.observaciones || 'Sin observaciones'
            });

            const arqueo = await this.arqueoCajaService.close(id, closeData);
            const arqueoCompleto = await this.arqueoCajaService.findById(id);


            // 🔧 CORRECCIÓN: Cálculos seguros para evitar NaN
            const saldoInicial = this.validateNumber(arqueoCompleto.saldoInicial);
            const totalIngresos = this.calculateTotal(arqueoCompleto.ingresos || []);
            const totalEgresos = this.calculateTotal(arqueoCompleto.egresos || []);
            const saldoCalculado = saldoInicial + totalIngresos - totalEgresos;
            const saldoFinal = this.validateNumber(arqueoCompleto.saldoFinal);

            // 🔧 CORRECCIÓN: Diferencia = Saldo Final - Saldo Calculado
            const diferencia = saldoFinal - saldoCalculado;

            // Respuesta mejorada con toda la información
            this.httpResponse.OK(res, {
                success: true,
                data: {
                    id: arqueo.idArqueo,
                    fechaInicio: arqueo.fechaInicio,
                    fechaCierre: arqueo.fechaCierre,
                    saldoInicial,
                    saldoFinal,
                    saldoCalculado,
                    diferencia, // 🔧 Esta diferencia ahora es correcta
                    observaciones: arqueo.observaciones,
                    empleado: {
                        id: arqueo.empleado.idEmpleado,
                        nombre: arqueo.empleado.nombre
                    },
                    resumen: {
                        totalIngresos,
                        totalEgresos,
                        cantidadMovimientos: (arqueoCompleto.ingresos?.length || 0) + (arqueoCompleto.egresos?.length || 0)
                    },
                    estado: {
                        cerrado: true,
                        dentroDeToleranacia: Math.abs(diferencia) <= 1000, // 🔧 Tolerancia ajustada a $1000
                        requiereAtencion: Math.abs(diferencia) > 1000
                    }
                },
                message: Math.abs(diferencia) > 1000
                    ? `Arqueo cerrado con diferencia significativa de $${diferencia.toFixed(2)}`
                    : 'Arqueo cerrado exitosamente'
            });
        } catch (error: any) {
            console.error('❌ Error al cerrar arqueo:', error);

            if (error.message.includes('no encontrado')) {
                this.httpResponse.NotFound(res, {
                    success: false,
                    message: error.message
                });
            } else if (error.message.includes('ya está cerrado')) {
                this.httpResponse.BadRequest(res, {
                    success: false,
                    message: error.message
                });
            } else {
                this.httpResponse.Error(res, {
                    success: false,
                    message: error.message
                });
            }
        }
    }

    // Método adicional para obtener estadísticas de diferencias
    getStats = async (req: Request, res: Response): Promise<void> => {
        try {
            const empleadoId = req.query.empleadoId ? parseInt(req.query.empleadoId as string) : undefined;
            const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
            const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

            const dateRange = startDate && endDate ? { start: startDate, end: endDate } : undefined;

            const stats = await this.arqueoCajaService.getDifferencesStats(empleadoId, dateRange);

            this.httpResponse.OK(res, {
                success: true,
                data: stats
            });
        } catch (error: any) {
            this.httpResponse.Error(res, {
                success: false,
                message: 'Error al obtener estadísticas',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    update = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const arqueoData = req.body;

            const arqueo = await this.arqueoCajaService.update(id, arqueoData);

            if (!arqueo) {
                this.httpResponse.NotFound(res, {
                    message: 'Arqueo de caja no encontrado'
                });
                return;
            }

            this.httpResponse.OK(res, arqueo);
        } catch (error) {
            this.httpResponse.Error(res, {
                message: 'Error al actualizar arqueo de caja',
                error
            });
        }
    };

    addIncome = async (req: Request, res: Response): Promise<void> => {
        try {
            const arqueoId = parseInt(req.params.id);
            const incomeData = new CreateIngresoDto(req.body);

            const arqueo = await this.arqueoCajaService.findById(arqueoId);
            if (arqueo.fechaCierre) {
                this.httpResponse.BadRequest(res, {
                    success: false,
                    message: 'No se pueden agregar ingresos a un arqueo cerrado'
                });
                return;
            }

            const ingreso = await this.ingresoService.create({
                ...incomeData,
                arqueoId
            });

            this.httpResponse.Created(res, {
                success: true,
                data: ingreso
            });
        } catch (error: any) {
            if (error.message.includes('No se pueden agregar')) {
                this.httpResponse.BadRequest(res, {
                    success: false,
                    message: error.message
                });
            } else {
                this.httpResponse.Error(res, {
                    success: false,
                    message: error.message
                });
            }
        }
    }

    addExpense = async (req: Request, res: Response): Promise<void> => {
        try {
            const arqueoId = parseInt(req.params.id);
            const expenseData = new CreateEgresoDto(req.body);

            const arqueo = await this.arqueoCajaService.findById(arqueoId);
            if (arqueo.fechaCierre) {
                this.httpResponse.BadRequest(res, {
                    success: false,
                    message: 'No se pueden agregar egresos a un arqueo cerrado'
                });
                return;
            }

            const egreso = await this.egresoService.create({
                ...expenseData,
                arqueoId
            });

            this.httpResponse.Created(res, {
                success: true,
                data: egreso
            });
        } catch (error: any) {
            if (error.message.includes('No se pueden agregar')) {
                this.httpResponse.BadRequest(res, {
                    success: false,
                    message: error.message
                });
            } else {
                this.httpResponse.Error(res, {
                    success: false,
                    message: error.message
                });
            }
        }
    }

    getOpenByEmpleado = async (req: Request, res: Response): Promise<void> => {
        try {
            const empleadoId = parseInt(req.params.empleadoId);
            const arqueo = await this.arqueoCajaService.findOpenByEmpleado(empleadoId);

            if (!arqueo) {
                this.httpResponse.NotFound(res, {
                    success: false,
                    message: 'No hay arqueos abiertos para este empleado'
                });
                return;
            }

            this.httpResponse.OK(res, {
                success: true,
                data: arqueo
            });
        } catch (error: any) {
            this.httpResponse.Error(res, {
                success: false,
                message: 'Error al obtener arqueo abierto',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    getIncomesByArqueo = async (req: Request, res: Response): Promise<void> => {
        try {
            const arqueoId = parseInt(req.params.id);
            const ingresos = await this.ingresoService.findByArqueoId(arqueoId);

            const total = this.calculateTotal(ingresos);

            this.httpResponse.OK(res, {
                success: true,
                data: {
                    count: ingresos.length,
                    total,
                    items: ingresos
                }
            });
        } catch (error: any) {
            this.httpResponse.Error(res, {
                success: false,
                message: 'Error al obtener ingresos del arqueo',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    getExpensesByArqueo = async (req: Request, res: Response): Promise<void> => {
        try {
            const arqueoId = parseInt(req.params.id);
            const egresos = await this.egresoService.findByArqueoId(arqueoId);

            const total = this.calculateTotal(egresos);

            this.httpResponse.OK(res, {
                success: true,
                data: {
                    count: egresos.length,
                    total,
                    items: egresos
                }
            });
        } catch (error: any) {
            this.httpResponse.Error(res, {
                success: false,
                message: 'Error al obtener egresos del arqueo',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}