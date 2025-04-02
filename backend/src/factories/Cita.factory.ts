// factories/CitaFactory.ts
import { CreateCitaDto } from '../dtos/CreateCita.dto';
import { Cita } from '../entity/cita';
import { AppDataSource } from '../config/database';
import { Cliente } from '../entity/cliente';
import { Empleado } from '../entity/empleado';
import { Servicio } from '../entity/servicio';
import { Corte } from '../entity/corte';

export class CitaFactory {
    static async create(dto: CreateCitaDto): Promise<Cita> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        
        try {
            const cita = new Cita();
            cita.fecha = dto.fecha;

            // Cargar cliente con verificación de null
            const cliente = await queryRunner.manager.findOne(Cliente, {
                where: { idCliente: dto.clienteId }
            });
            
            if (!cliente) {
                throw new Error(`Cliente con ID ${dto.clienteId} no encontrado`);
            }
            cita.cliente = cliente;

            // Cargar empleado con verificación de null
            const empleado = await queryRunner.manager.findOne(Empleado, {
                where: { idEmpleado: dto.empleadoId }
            });
            
            if (!empleado) {
                throw new Error(`Empleado con ID ${dto.empleadoId} no encontrado`);
            }
            cita.empleado = empleado;

            // Manejo de servicios (directos o por corte)
            if (dto.servicioIds) {
                const servicios = await queryRunner.manager.findByIds(Servicio, dto.servicioIds);
                if (servicios.length !== dto.servicioIds.length) {
                    const missingIds = dto.servicioIds.filter(id => 
                        !servicios.some(s => s.idServicio === id)
                    );
                    throw new Error(`Servicios no encontrados: ${missingIds.join(', ')}`);
                }
                cita.servicios = servicios;
            } 
            else if (dto.corteId) {
                const corte = await queryRunner.manager.findOne(Corte, {
                    where: { idCorte: dto.corteId },
                    relations: ['servicios']
                });
                
                if (!corte) {
                    throw new Error(`Corte con ID ${dto.corteId} no encontrado`);
                }
                
                if (!corte.servicios || corte.servicios.length === 0) {
                    throw new Error(`El corte ${corte.estilo} no tiene servicios asociados`);
                }
                
                cita.servicios = corte.servicios;
                cita.corte = corte;
            }

            // Validar que hay servicios asignados
            if (!cita.servicios || cita.servicios.length === 0) {
                throw new Error('La cita no tiene servicios asignados');
            }

            // Calcular totales
            cita.duracionTotal = cita.servicios.reduce((sum, s) => sum + (s.duracion || 0), 0);
            cita.precioTotal = cita.servicios.reduce((sum, s) => sum + (s.precio || 0), 0);

            return cita;
        } finally {
            await queryRunner.release();
        }
    }
}