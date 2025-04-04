export class CreateArqueoCajaDto {
    readonly fechaInicio: Date;
    readonly empleadoId: number;

    constructor(data: any) {
        if (!data.fechaInicio || !data.empleadoId) {
            throw new Error('Fecha de inicio y ID de empleado son requeridos');
        }

        this.fechaInicio = new Date(data.fechaInicio);
        this.empleadoId = data.empleadoId;
    }
}