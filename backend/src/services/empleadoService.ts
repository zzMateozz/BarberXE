import { CreateEmpleadoDto } from '../dtos/Empleado/CreateEmpleado.dto';
import { UpdateEmpleadoDto } from '../dtos/Empleado/UpdateEmpleado.dto';
import { ArqueoCaja } from '../entity/arqueoCaja';
import { Empleado } from '../entity/empleado';
import { EmpleadoRepository } from '../repository/EmpleadoReporitory';

export class EmpleadoService {
    async findAll(): Promise<Empleado[]> {
        return await EmpleadoRepository.find();
    }

    async findById(id: number): Promise<Empleado | null> {
        return await EmpleadoRepository.findOneBy({ idEmpleado: id });
    }

    async create(empleadoData: CreateEmpleadoDto): Promise<Empleado> {
        const empleado = new Empleado();
        empleado.nombre = empleadoData.nombre;
        empleado.apellido = empleadoData.apellido;
        empleado.telefono = empleadoData.telefono;
        empleado.estado = empleadoData.estado || 'activo';
        empleado.cargo = empleadoData.cargo === 'Cajero' ? 'Cajero' : 'Barbero';
    
        return await EmpleadoRepository.save(empleado);
    }
    

    async update(id: number, empleadoData: UpdateEmpleadoDto): Promise<Empleado> {
        const queryRunner = EmpleadoRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
    
        try {
            const empleado = await EmpleadoRepository.findOneBy({ idEmpleado: id });
            if (!empleado) {
                throw new Error(`Empleado con ID ${id} no encontrado`);
            }
    
            // Actualizar campos permitidos
            if (empleadoData.nombre !== undefined) empleado.nombre = empleadoData.nombre;
            if (empleadoData.apellido !== undefined) empleado.apellido = empleadoData.apellido;
            if (empleadoData.telefono !== undefined) empleado.telefono = empleadoData.telefono;
            if (empleadoData.estado !== undefined) empleado.estado = empleadoData.estado;
            if (empleadoData.cargo !== undefined) empleado.cargo = empleadoData.cargo;
    
            const empleadoActualizado = await queryRunner.manager.save(empleado);
            await queryRunner.commitTransaction();
            
            return empleadoActualizado;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async delete(id: number): Promise<void> {
        const queryRunner = EmpleadoRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
    
        try {
            await queryRunner.manager.delete(ArqueoCaja, { empleado: { idEmpleado: id } });
            await queryRunner.manager.delete(Empleado, id);
            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async findByName(nombre: string): Promise<Empleado[]> {
        return await EmpleadoRepository.findByName(nombre);
    }

    async findWithCitas(): Promise<Empleado[]> {
        return await EmpleadoRepository.findWithCitas();
    }

    async findWithArqueos(): Promise<Empleado[]> {
        return await EmpleadoRepository.findWithArqueos();
    }
}