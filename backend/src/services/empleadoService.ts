import { CreateEmpleadoDto } from '../dtos/Empleado/CreateEmpleado.dto';
import { UpdateEmpleadoDto } from '../dtos/Empleado/UpdateEmpleado.dto';
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
        empleado.cargo = empleadoData.cargo || 'Barbero';
    
        return await EmpleadoRepository.save(empleado);
    }

    async update(id: number, empleadoData: UpdateEmpleadoDto): Promise<Empleado> {
        const queryRunner = EmpleadoRepository.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
    
        try {
            const empleado = await this.findById(id);
            if (!empleado) {
                throw new Error(`Empleado con ID ${id} no encontrado`);
            }
            // Actualizar campos básicos
            if (empleadoData.nombre !== undefined) empleado.nombre = empleadoData.nombre;
            if (empleadoData.apellido !== undefined) empleado.apellido = empleadoData.apellido;
            if (empleadoData.telefono !== undefined) empleado.telefono = empleadoData.telefono;
            // Actualizar nuevos campos
            if (empleadoData.estado !== undefined) empleado.estado = empleadoData.estado;
            if (empleadoData.cargo !== undefined) empleado.cargo = empleadoData.cargo;
            await queryRunner.manager.save(empleado);
            await queryRunner.commitTransaction();
            return empleado;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async delete(id: number): Promise<void> {
        await EmpleadoRepository.delete(id);
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