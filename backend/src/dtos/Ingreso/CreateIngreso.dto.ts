// dtos/Ingreso/CreateIngreso.dto.ts
export class CreateIngresoDto {
    readonly monto: number;
    readonly arqueoId: number;

    constructor(data: any) {
        if (!data.monto || !data.arqueoId) {
            throw new Error('Monto y ID de arqueo son requeridos');
        }

        this.monto = data.monto;
        this.arqueoId = data.arqueoId;
    }
}