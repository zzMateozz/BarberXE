import { Empleado } from '../entity/empleado';
import { EmpleadoRepository } from '../repository/EmpleadoReporitory';

export class EmpleadoService {
    async findAll(): Promise<Empleado[]> {
        return await EmpleadoRepository.find();
    }

    async findById(id: number): Promise<Empleado | null> {
        return await EmpleadoRepository.findOneBy({ idEmpleado: id });
    }

    async create(empleadoData: Partial<Empleado>): Promise<Empleado> {
        const empleado = EmpleadoRepository.create(empleadoData);
        return await EmpleadoRepository.save(empleado);
    }

    async update(id: number, empleadoData: Partial<Empleado>): Promise<Empleado | null> {
        await EmpleadoRepository.update(id, empleadoData);
        return this.findById(id);
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