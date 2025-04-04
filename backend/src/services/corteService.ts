import { In } from 'typeorm';
import { CreateCorteDto } from '../dtos/Corte/CreateCorter.dto';
import { Corte } from '../entity/corte';
import { CorteRepository } from '../repository/CorteRepository';
import { Servicio } from '../entity/servicio';
import { UpdateCorteDto } from '../dtos/Corte/UpdateCorte.dto';


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
    
            // Relación opcional con servicios
            if (corteData.servicioIds && corteData.servicioIds.length > 0) {
                const servicios = await queryRunner.manager.findBy(Servicio, {
                    idServicio: In(corteData.servicioIds)
                });
                
                if (servicios.length !== corteData.servicioIds.length) {
                    const encontradosIds = servicios.map(s => s.idServicio);
                    const faltantes = corteData.servicioIds.filter(
                        id => !encontradosIds.includes(id)
                    );
                    throw new Error(`Servicios no encontrados: ${faltantes.join(', ')}`);
                }
                
                corte.servicios = servicios;
            }
    
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
        const queryRunner = CorteRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
    
        try {
            const corte = await this.findById(id);
            if (!corte) {
                throw new Error(`Empleado con ID ${id} no encontrado`);
            }
            // Actualizar campos básicos
            if (corteData.estilo !== undefined) corte.estilo = corteData.estilo;
            if (corteData.imagenUrl !== undefined) corte.imagenUrl = corteData.imagenUrl;
            await queryRunner.manager.save(corte);
            await queryRunner.commitTransaction();
            return corte;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async delete(id: number): Promise<void> {
        const corte = await this.findById(id);
        if (!corte) {
            throw new Error(`Corte con ID ${id} no encontrado`);
        }
        await CorteRepository.remove(corte);
    }
}