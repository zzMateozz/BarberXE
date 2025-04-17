import { In } from 'typeorm';
import { CreateServicioDto } from '../dtos/Servicio/CreateServicio.dto';
import { UpdateServicioDto } from '../dtos/Servicio/UpdateServicio.dto';
import { Servicio } from '../entity/servicio';
import { ServicioRepository } from '../repository/ServicioRepository';
import { Corte } from '../entity/corte';
import { AppDataSource } from '../config/database';
import path from 'path';
import * as fs from 'fs';

export class ServicioService {

    async findAll(): Promise<Servicio[]> {
        try {
            return await ServicioRepository.findAllWithCortes();
        } catch (error) {
            console.error('Error en findAll:', error);
            throw new Error('Error al obtener los servicios');
        }
    }
    async findById(id: number): Promise<Servicio | null> {
        return await ServicioRepository.findOneBy({ idServicio: id });
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
        const queryRunner = AppDataSource.createQueryRunner();
        
        try {
            await queryRunner.connect();
            await queryRunner.startTransaction();

            // Buscar el servicio existente
            const servicio = await queryRunner.manager.findOne(Servicio, {
                where: { idServicio: id }
            });

            if (!servicio) {
                throw new Error(`Servicio con ID ${id} no encontrado`);
            }

            // Guardar la ruta de la imagen anterior
            const oldImagePath = servicio.imagenUrl;

            // Actualizar campos
            if (servicioData.nombre !== undefined) {
                servicio.nombre = servicioData.nombre;
            }

            if (servicioData.precio !== undefined) {
                servicio.precio = servicioData.precio;
            }

            if (servicioData.duracion !== undefined) {
                servicio.duracion = servicioData.duracion;
            }

            if (servicioData.estado !== undefined) {
                servicio.estado = servicioData.estado;
            }

            if (servicioData.imagenUrl !== undefined) {
                servicio.imagenUrl = servicioData.imagenUrl;
            }

            // Manejar cortes si se proporcionan
            if (servicioData.corteIds !== undefined) {
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

            // Eliminar imagen anterior si fue reemplazada
            if (servicioData.imagenUrl && oldImagePath) {
                this.deleteImageFile(oldImagePath);
            }

            return servicio;

        } catch (error: any) {
            if (queryRunner.isTransactionActive) {
                await queryRunner.rollbackTransaction();
            }
            
            console.error('Error en update:', error);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async delete(id: number): Promise<void> {
        const queryRunner = ServicioRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const servicio = await ServicioRepository.findOneBy({ idServicio: id });
            if (!servicio) {
                throw new Error(`Servicio con ID ${id} no encontrado`);
            }

            // Guardar la ruta de la imagen para eliminarla después
            const imagePath = servicio.imagenUrl;

            await queryRunner.manager.remove(servicio);
            await queryRunner.commitTransaction();

            // Eliminar el archivo de imagen asociado
            if (imagePath) {
                this.deleteImageFile(imagePath);
            }
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    private deleteImageFile(imageUrl: string): void {
        try {
            if (imageUrl) {
                const basePath = path.join(__dirname, '../../uploads');
                const filename = path.basename(imageUrl);
                const filePath = path.join(basePath, filename);
                
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        } catch (error) {
            console.error('Error al eliminar el archivo de imagen:', error);
            // No lanzamos el error para no interrumpir el flujo principal
        }
    }
}
