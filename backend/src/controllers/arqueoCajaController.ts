import { Request, Response } from 'express';
import { ArqueoCajaService } from '../services/ArqueoCajaService';
import { CreateArqueoCajaDto } from '../dtos/ArqueoCaja/CreateArqueoCaja.dto';
import { CloseArqueoCajaDto } from '../dtos/ArqueoCaja/CloseArqueoCaja.dto';
import { IngresoService } from '../services/ingresoService';
import { EgresoService } from '../services/egresoService';
import { CreateEgresoDto } from '../dtos/Egreso/CreateEgreso.dto';
import { CreateIngresoDto } from '../dtos/Ingreso/CreateIngreso.dto';
import { ArqueoCaja } from '../entity/arqueoCaja';

export class ArqueoCajaController {
    private arqueoCajaService: ArqueoCajaService;
    private ingresoService: IngresoService;
    private egresoService: EgresoService;

    constructor() {
        this.arqueoCajaService = new ArqueoCajaService();
        this.ingresoService = new IngresoService();
        this.egresoService = new EgresoService();
        this.close = this.close.bind(this);
    }

    getAll = async (req: Request, res: Response): Promise<void> => {
        try {
            const arqueos = await this.arqueoCajaService.findAll();
            res.status(200).json({
                success: true,
                data: arqueos
            });
            } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Error en getAll:', error.message);
                res.status(500).json({
                success: false,
                message: 'Error al obtener arqueos de caja',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            } else {
                console.error('Error en getAll:', error);
                res.status(500).json({
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
            
            res.status(200).json({
                success: true,
                data: {
                    ...arqueo,
                    totalIngresos: arqueo.ingresos.reduce((sum, i) => sum + i.monto, 0),
                    totalEgresos: arqueo.egresos.reduce((sum, e) => sum + e.monto, 0),
                    saldoCalculado: arqueo.saldoInicial + 
                                    arqueo.ingresos.reduce((sum, i) => sum + i.monto, 0) - 
                                    arqueo.egresos.reduce((sum, e) => sum + e.monto, 0)
                }
            });
        } catch (error: any) {
            res.status(404).json({
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
        return {
            id: arqueo.idArqueo,
            fechaInicio: arqueo.fechaInicio,
            fechaCierre: arqueo.fechaCierre,
            saldoInicial: arqueo.saldoInicial,
            saldoFinal: arqueo.saldoFinal,
            empleado: {
                id: arqueo.empleado.idEmpleado,
                nombre: arqueo.empleado.nombre
            },
            resumen: {
                totalIngresos: arqueo.ingresos?.reduce((sum, i) => sum + i.monto, 0) || 0,
                totalEgresos: arqueo.egresos?.reduce((sum, e) => sum + e.monto, 0) || 0,
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
                res.status(404).json({
                    success: false,
                    message: 'No se encontraron arqueos para este empleado'
                });
                return;
            }
    
            const responseData = withDetails 
                ? arqueos.map(arqueo => this.formatDetailedArqueo(arqueo))
                : arqueos.map(arqueo => this.formatBasicArqueo(arqueo));
    
            res.status(200).json({
                success: true,
                data: responseData
            });
        } catch (error: any) {
            res.status(500).json({
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
            res.status(201).json({
                success: true,
                data: arqueo
            });
        } catch (error: any) {
            console.error('Error en create:', error); // Debug detallado
            
            const status = error.message.includes('ID de empleado') ? 400 : 
                            error.message.includes('ya tiene un arqueo') ? 409 : 
                            error.message.includes('no encontrado') ? 404 : 500;
            
            res.status(status).json({
                success: false,
                message: error.message,
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    };

    public close = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const closeData = new CloseArqueoCajaDto(req.body);
            
            // Usar this.arqueoCajaService correctamente
            const arqueo = await this.arqueoCajaService.close(id, closeData);
            
            res.status(200).json({
            success: true,
            data: {
                ...arqueo,
                diferencia: closeData.saldoFinal - (arqueo.saldoInicial + 
                arqueo.ingresos.reduce((sum, i) => sum + i.monto, 0) - 
                arqueo.egresos.reduce((sum, e) => sum + e.monto, 0))
            }
            });
        } catch (error: any) {
            console.error('Error al cerrar arqueo:', error);
            
            const status = error.message.includes('no encontrado') ? 404 : 
                            error.message.includes('ya está cerrado') ? 400 : 
                            error.message.includes('Discrepancia') ? 422 : 500;
            
            res.status(status).json({
            success: false,
            message: error.message
            });
        }
    }


    update = async (req: Request, res: Response): Promise<void> => {
        try {
            const id = parseInt(req.params.id);
            const arqueoData = req.body;
            
            const arqueo = await this.arqueoCajaService.update(id, arqueoData);
            
            if (!arqueo) {
                res.status(404).json({ message: 'Arqueo de caja no encontrado' });
                return;
            }
            
            res.status(200).json(arqueo);
        } catch (error) {
            res.status(500).json({ message: 'Error al actualizar arqueo de caja', error });
        }
    };

    addIncome = async (req: Request, res: Response): Promise<void> => {
        try {
            const arqueoId = parseInt(req.params.id);
            const incomeData = new CreateIngresoDto(req.body);
            
            // Validar que el arqueo existe y está abierto
            const arqueo = await this.arqueoCajaService.findById(arqueoId);
            if (arqueo.fechaCierre) {
                throw new Error('No se pueden agregar ingresos a un arqueo cerrado');
            }

            // Crear el ingreso asociado al arqueo
            const ingreso = await this.ingresoService.create({
                ...incomeData,
                arqueoId
            });

            res.status(201).json({
                success: true,
                data: ingreso
            });
        } catch (error: any) {
            const status = error.message.includes('No se pueden agregar') ? 400 : 500;
            res.status(status).json({
                success: false,
                message: error.message
            });
        }
    }

    addExpense = async (req: Request, res: Response): Promise<void> => {
        try {
            const arqueoId = parseInt(req.params.id);
            const expenseData = new CreateEgresoDto(req.body);
            
            // Validar que el arqueo existe y está abierto
            const arqueo = await this.arqueoCajaService.findById(arqueoId);
            if (arqueo.fechaCierre) {
                throw new Error('No se pueden agregar egresos a un arqueo cerrado');
            }

            // Crear el egreso asociado al arqueo
            const egreso = await this.egresoService.create({
                ...expenseData,
                arqueoId
            });

            res.status(201).json({
                success: true,
                data: egreso
            });
        } catch (error: any) {
            const status = error.message.includes('No se pueden agregar') ? 400 : 500;
            res.status(status).json({
                success: false,
                message: error.message
            });
        }
    }

    getOpenByEmpleado = async (req: Request, res: Response): Promise<void> => {
        try {
            const empleadoId = parseInt(req.params.empleadoId);
            const arqueo = await this.arqueoCajaService.findOpenByEmpleado(empleadoId);
            
            if (!arqueo) {
                res.status(404).json({
                    success: false,
                    message: 'No hay arqueos abiertos para este empleado'
                });
                return;
            }
            
            res.status(200).json({
                success: true,
                data: arqueo
            });
        } catch (error: any) {
            res.status(500).json({
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
            
            res.status(200).json({
                success: true,
                data: {
                    count: ingresos.length,
                    total: ingresos.reduce((sum, i) => sum + i.monto, 0),
                    items: ingresos
                }
            });
        } catch (error: any) {
            res.status(500).json({
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
            
            res.status(200).json({
                success: true,
                data: {
                    count: egresos.length,
                    total: egresos.reduce((sum, e) => sum + e.monto, 0),
                    items: egresos
                }
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                message: 'Error al obtener egresos del arqueo',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}