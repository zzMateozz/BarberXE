export class UpdateEmpleadoDto {
    readonly nombre?: string;
    readonly apellido?: string;
    readonly telefono?: string;
    readonly estado?: 'activo' | 'inactivo';
    readonly cargo?: 'Barbero' | 'Cajero';
    readonly imagenPerfil?: string;

    constructor(data: any = {}) {
        this.nombre = data.nombre;
        this.apellido = data.apellido;
        this.telefono = data.telefono;
        this.estado = data.estado;
        this.cargo = data.cargo;
        this.imagenPerfil = data.imagenPerfil;
    }
}