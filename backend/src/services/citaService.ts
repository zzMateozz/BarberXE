import { AppDataSource } from '../config/database';
import { CreateCitaDto } from '../dtos/CreateCita.dto';
import { Cita } from '../entity/cita';
import { CitaFactory } from '../factories/Cita.factory';
import { CitaRepository } from '../repository/CitaRepository';

export class CitaService {
    async findAll(): Promise<Cita[]> {
        return await CitaRepository.find();
    }

    async findById(id: number): Promise<Cita | null> {
        return await CitaRepository.findOneBy({ idCita: id });
    }

    async findByCliente(clienteId: number): Promise<Cita[]> {
        return await CitaRepository.findByCliente(clienteId);
    }

    async findByEmpleado(empleadoId: number): Promise<Cita[]> {
        return await CitaRepository.findByEmpleado(empleadoId);
    }

    async create(citaData: CreateCitaDto) {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Validación básica
            if (!citaData.clienteId || !citaData.empleadoId) {
                throw new Error('Cliente y empleado son requeridos');
            }

            // Usar factory para creación
            const cita = await CitaFactory.create(citaData);
            
            // Persistir
            await queryRunner.manager.save(cita);
            await queryRunner.commitTransaction();
            
            return cita;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async update(id: number, citaData: Partial<Cita>): Promise<Cita | null> {
        await CitaRepository.update(id, citaData);
        return this.findById(id);
    }

    async delete(id: number): Promise<void> {
        await CitaRepository.delete(id);
    }
}