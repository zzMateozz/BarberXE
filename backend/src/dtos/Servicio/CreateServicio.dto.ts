export class CreateServicioDto {
    readonly nombre: string;
    readonly precio: number;
    readonly duracion: string;
    readonly imagenUrl: string;
    readonly estado?: 'activo' | 'inactivo';
    readonly corteIds?: number[];

    constructor(data: any) {
        if (!data.nombre || !data.precio || !data.duracion || !data.imagenUrl) {
            throw new Error('Nombre, precio, duración e imagenUrl son requeridos');
        }

        this.nombre = data.nombre;
        this.precio = data.precio;
        this.duracion = data.duracion;
        this.imagenUrl = data.imagenUrl;
        this.estado = data.estado || 'activo';
        this.corteIds = data.corteIds || [];
    }
}