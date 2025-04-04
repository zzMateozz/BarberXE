export class CloseArqueoCajaDto {
    readonly fechaCierre: Date;
    readonly ingreso?: {
        monto: number;
    };
    readonly egreso?: {
        monto: number;
    };

    constructor(data: any) {
        if (!data.fechaCierre) {
            throw new Error('Fecha de cierre es requerida');
        }

        this.fechaCierre = new Date(data.fechaCierre);
        
        if (data.ingreso) {
            if (typeof data.ingreso.monto !== 'number') {
                throw new Error('Monto de ingreso debe ser un número');
            }
            this.ingreso = {
                monto: data.ingreso.monto
            };
        }
        
        if (data.egreso) {
            if (typeof data.egreso.monto !== 'number') {
                throw new Error('Monto de egreso debe ser un número');
            }
            this.egreso = {
                monto: data.egreso.monto
            };
        }
    }
}