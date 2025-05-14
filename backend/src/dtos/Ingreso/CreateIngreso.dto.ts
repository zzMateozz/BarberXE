export class CreateIngresoDto {
    readonly monto: number;
    readonly descripcion: string;
    readonly arqueoId: number;
    readonly tipo?: string;
    readonly observaciones?: string;

    constructor(data: any) {
        if (!data.monto || !data.descripcion || !data.arqueoId) {
            throw new Error('Monto, descripción y ID de arqueo son requeridos');
        }

        if (data.monto <= 0) {
            throw new Error('El monto debe ser mayor que cero');
        }

        this.monto = parseFloat(data.monto);
        this.descripcion = data.descripcion;
        this.arqueoId = data.arqueoId;
        this.tipo = data.tipo || 'General'; // Valor por defecto
        this.observaciones = data.observaciones || null;
    }
}