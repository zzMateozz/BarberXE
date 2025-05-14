export class CreateEgresoDto {
    readonly monto: number;
    readonly descripcion: string;
    readonly arqueoId: number;
    readonly categoria?: string;
    readonly justificacion?: string;

    constructor(data: any) {
        if (!data.monto || !data.descripcion || !data.arqueoId) {
            throw new Error('Monto, descripción y ID de arqueo son requeridos');
        }

        this.monto = parseFloat(data.monto);
        this.descripcion = data.descripcion;
        this.arqueoId = data.arqueoId;
        this.categoria = data.categoria || null;
        this.justificacion = data.justificacion || null;
    }
}