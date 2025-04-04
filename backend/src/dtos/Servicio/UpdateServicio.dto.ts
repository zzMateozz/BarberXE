export class UpdateServicioDto {
    readonly nombre?: string;
    readonly precio?: number;
    readonly duracion?: number;
    readonly imagenUrl?: string;
    readonly estado?: 'activo' | 'inactivo';
    readonly corteIds?: number[];

    constructor(data: any = {}) {
        this.nombre = data.nombre;
        this.precio = data.precio;
        this.duracion = data.duracion;
        this.imagenUrl = data.imagenUrl;
        this.estado = data.estado;
        this.corteIds = data.corteIds;
    }
}