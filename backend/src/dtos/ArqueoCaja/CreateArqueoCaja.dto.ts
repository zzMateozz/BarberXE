export class CreateArqueoCajaDto {
    readonly empleadoId: number;
    readonly saldoInicial: number;

    constructor(data: any) {
        if (!data.empleadoId || data.saldoInicial === undefined) {
            throw new Error('ID de empleado y saldo inicial son requeridos');
        }

        if (data.saldoInicial < 0) {
            throw new Error('El saldo inicial no puede ser negativo');
        }

        this.empleadoId = data.empleadoId;
        this.saldoInicial = parseFloat(data.saldoInicial);
    }
}