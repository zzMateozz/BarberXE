export class CloseArqueoCajaDto {
    readonly saldoFinal: number;
    readonly observaciones?: string;

    constructor(data: any) {
        if (data.saldoFinal === undefined) {
            throw new Error('Saldo final es requerido');
        }

        this.saldoFinal = parseFloat(data.saldoFinal);
        this.observaciones = data.observaciones || null;
    }
}