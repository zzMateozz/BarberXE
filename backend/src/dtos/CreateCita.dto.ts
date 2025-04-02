export class CreateCitaDto {
    readonly fecha: Date;
    readonly clienteId: number;
    readonly empleadoId: number;
    readonly servicioIds?: number[];
    readonly corteId?: number;

    constructor(data: {
        fecha: Date | string;
        clienteId: number | string;
        empleadoId: number | string;
        servicioIds?: (number | string)[];
        corteId?: number | string;
    }) {
        // Validación de campos requeridos
        if (!data.fecha || data.clienteId === undefined || data.empleadoId === undefined) {
            throw new Error('Fecha, clienteId y empleadoId son requeridos');
        }

        // Validación de al menos servicioIds o corteId
        if ((!data.servicioIds || data.servicioIds.length === 0) && !data.corteId) {
            throw new Error('Debe especificar servicioIds o corteId');
        }

        // Conversión y asignación de valores
        this.fecha = new Date(data.fecha);
        
        this.clienteId = Number(data.clienteId);
        if (isNaN(this.clienteId)) {
            throw new Error('clienteId debe ser un número válido');
        }
        
        this.empleadoId = Number(data.empleadoId);
        if (isNaN(this.empleadoId)) {
            throw new Error('empleadoId debe ser un número válido');
        }

        // Procesamiento de servicioIds con validación
        if (data.servicioIds) {
            this.servicioIds = data.servicioIds.map(id => {
                const numId = Number(id);
                if (isNaN(numId)) {
                    throw new Error(`ID de servicio inválido: ${id}`);
                }
                return numId;
            });
        }

        // Procesamiento de corteId con validación
        if (data.corteId !== undefined) {
            this.corteId = Number(data.corteId);
            if (isNaN(this.corteId)) {
                throw new Error('corteId debe ser un número válido');
            }
        }

        // Validación adicional de fechas
        if (isNaN(this.fecha.getTime())) {
            throw new Error('Fecha inválida');
        }
    }
}