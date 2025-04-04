import { In } from 'typeorm';
import { CreateServicioDto } from '../dtos/Servicio/CreateServicio.dto';
import { UpdateServicioDto } from '../dtos/Servicio/UpdateServicio.dto';
import { Servicio } from '../entity/servicio';
import { ServicioRepository } from '../repository/ServicioRepository';
import { Corte } from '../entity/corte';
import { AppDataSource } from '../config/database';

export class ServicioService {
    async findAll(): Promise<Servicio[]> {
            return await ServicioRepository.find();
        }

    async findById(id: number): Promise<Servicio | null> {
        return await ServicioRepository.findOneBy({ idServicio: id });
    }

    async findByNombre(nombre: string): Promise<Servicio[]> {
        return await ServicioRepository.findByNombre(nombre);
    }

    async create(servicioData: CreateServicioDto): Promise<Servicio> {
        const queryRunner = ServicioRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
    
        try {
            const servicio = new Servicio();
            servicio.nombre = servicioData.nombre;
            servicio.precio = servicioData.precio;
            servicio.duracion = servicioData.duracion;
            servicio.imagenUrl = servicioData.imagenUrl;
            servicio.estado = servicioData.estado || 'activo';
    
            if (servicioData.corteIds && servicioData.corteIds.length > 0) {
                const cortes = await queryRunner.manager.findBy(Corte, {
                    idCorte: In(servicioData.corteIds)
                });
                
                if (cortes.length !== servicioData.corteIds.length) {
                    const encontradosIds = cortes.map(c => c.idCorte);
                    const faltantes = servicioData.corteIds.filter(
                        id => !encontradosIds.includes(id)
                    );
                    throw new Error(`Cortes no encontrados: ${faltantes.join(', ')}`);
                }
                
                servicio.cortes = cortes;
            }
    
            await queryRunner.manager.save(servicio);
            await queryRunner.commitTransaction();
    
            return servicio;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async update(id: number, servicioData: UpdateServicioDto): Promise<Servicio> {
        const servicio = await this.findById(id);
        
        if (!servicio) {
            throw new Error(`Servicio con ID ${id} no encontrado`);
        }
        if (servicioData.nombre) servicio.nombre = servicioData.nombre;
        if (servicioData.precio) servicio.precio = servicioData.precio;
        if (servicioData.duracion) servicio.duracion = servicioData.duracion;
        if (servicioData.estado) servicio.estado = servicioData.estado;
        await ServicioRepository.save(servicio);
        return servicio;
    }

    async delete(id: number): Promise<void> {
        await ServicioRepository.delete(id);
    }
}