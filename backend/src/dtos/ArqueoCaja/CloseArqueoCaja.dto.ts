export class CloseArqueoCajaDto {
    readonly saldoFinal: number;
    readonly observaciones: string;
    readonly saldoCalculado: number;
    readonly diferencia: number;

    constructor(data: any) {
        if (data.saldoFinal === undefined || data.saldoFinal === null) {
            throw new Error('Saldo final es requerido');
        }

        // Validar que saldoFinal sea un número válido
        const saldoFinalParsed = parseFloat(data.saldoFinal);
        if (isNaN(saldoFinalParsed)) {
            throw new Error('El saldo final debe ser un número válido');
        }
        const saldoCalculadoParsed = parseFloat(data.saldoCalculado);
        if (isNaN(saldoFinalParsed)) {
            throw new Error('El saldo final debe ser un número válido');
        }
        const deiferenciaParsed = parseFloat(data.diferencia);
        if (isNaN(saldoFinalParsed)) {
            throw new Error('El saldo final debe ser un número válido');
        }
        this.saldoFinal = saldoFinalParsed;

        // Manejar tanto 'observacion' como 'observaciones' para compatibilidad
        this.observaciones = data.observaciones || data.observacion || '';

        // Los campos calculados son opcionales - el servicio los calculará
        this.saldoCalculado = saldoCalculadoParsed;
        this.diferencia = deiferenciaParsed;
    }
}