import { In } from 'typeorm';
import fs from 'fs';
import path from 'path';
import { CreateCorteDto } from '../dtos/Corte/CreateCorter.dto';
import { Corte } from '../entity/corte';
import { CorteRepository } from '../repository/CorteRepository';
import { Servicio } from '../entity/servicio';
import { UpdateCorteDto } from '../dtos/Corte/UpdateCorte.dto';
import { AppDataSource } from '../config/database';


export class CorteService {
    async findAll(): Promise<Corte[]> {
        return await CorteRepository.find();
    }

    async findById(id: number): Promise<Corte | null> {
            return await CorteRepository.findOneBy({ idCorte: id });
    }

    async findByEstilo(estilo: string): Promise<Corte[]> {
        return await CorteRepository.findByEstilo(estilo);
    }

    async create(corteData: CreateCorteDto): Promise<Corte> {
        const queryRunner = CorteRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
    
        try {
            const corte = new Corte();
            corte.estilo = corteData.estilo;
            corte.imagenUrl = corteData.imagenUrl;
    
            await queryRunner.manager.save(corte);
            await queryRunner.commitTransaction();
    
            // Retornar el corte recién creado sin volver a buscarlo
            return corte;
            
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw new Error((error as Error).message);// Asegurar que el error tenga mensaje
        } finally {
            await queryRunner.release();
        }
    }

    async update(id: number, corteData: UpdateCorteDto): Promise<Corte> {
        const queryRunner = AppDataSource.createQueryRunner();
        
        try {
            await queryRunner.connect();
            await queryRunner.startTransaction();
    
            // Buscar el corte existente
            const corte = await queryRunner.manager.findOne(Corte, {
                where: { idCorte: id }
            });
    
            if (!corte) {
                throw new Error(`Corte con ID ${id} no encontrado`);
            }
    
            // Guardar la ruta de la imagen anterior
            const oldImagePath = corte.imagenUrl;
    
            // Actualizar campos
            if (corteData.estilo !== undefined) {
                corte.estilo = corteData.estilo;
            }
    
            if (corteData.imagenUrl !== undefined) {
                corte.imagenUrl = corteData.imagenUrl;
            }
    
            // Guardar cambios (ya no manejamos servicios aquí)
            await queryRunner.manager.save(corte);
            await queryRunner.commitTransaction();
    
            // Eliminar imagen anterior si fue reemplazada
            if (corteData.imagenUrl && oldImagePath) {
                this.deleteImageFile(oldImagePath);
            }
    
            return corte;
    
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
        const queryRunner = CorteRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const corte = await CorteRepository.findOneBy({ idCorte: id });
            if (!corte) {
                throw new Error(`Corte con ID ${id} no encontrado`);
            }

            // Guardar la ruta de la imagen para eliminarla después
            const imagePath = corte.imagenUrl;

            await queryRunner.manager.remove(corte);
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