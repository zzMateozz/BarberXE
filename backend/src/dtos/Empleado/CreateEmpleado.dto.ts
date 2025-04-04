export class CreateEmpleadoDto {
    readonly nombre: string;
    readonly apellido: string;
    readonly telefono: string;
    readonly estado?: 'activo' | 'inactivo';
    readonly cargo?: 'Barbero' | 'Cajero';

    constructor(data: any) {
        if (!data.nombre || !data.apellido || !data.telefono) {
            throw new Error('Nombre, apellido y teléfono son requeridos');
        }

        this.nombre = data.nombre;
        this.apellido = data.apellido;
        this.telefono = data.telefono;
        this.estado = data.estado || 'activo';
        this.cargo = data.cargo || 'Barbero';
    }
}