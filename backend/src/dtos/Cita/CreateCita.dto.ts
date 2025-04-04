export class CreateCitaDto {
    readonly fecha: Date;
    readonly clienteId: number;
    readonly empleadoId: number;
    readonly servicioIds?: number[];
    readonly corteId?: number;

    constructor(data: any) {
        // Validaciones básicas de campos requeridos
        if (!data.fecha || !data.clienteId || !data.empleadoId || !data.servicioIds) {
            throw new Error('Fecha, clienteId, empleadoId y servicioIds son requeridos');
        }

        if (!Array.isArray(data.servicioIds)) {
            throw new Error('servicioIds debe ser un array');
        }

        // Validación de fecha
        this.fecha = new Date(data.fecha);
        if (isNaN(this.fecha.getTime())) {
            throw new Error('Fecha no válida');
        }

        // Validar que no sea fecha pasada
        const ahora = new Date();
        if (this.fecha < ahora) {
            throw new Error('No se pueden agendar citas en fechas pasadas');
        }

        // Validar que sea en intervalo de 30 minutos
        const minutos = this.fecha.getMinutes();
        const segundos = this.fecha.getSeconds();
        const milisegundos = this.fecha.getMilliseconds();
        
        if (minutos % 30 !== 0 || segundos !== 0 || milisegundos !== 0) {
            throw new Error('Las citas deben comenzar en hora exacta o media hora (ej: 10:00 o 10:30)');
        }

        // Normalizar la fecha (eliminar segundos y milisegundos)
        this.fecha = new Date(
            this.fecha.getFullYear(),
            this.fecha.getMonth(),
            this.fecha.getDate(),
            this.fecha.getHours(),
            this.fecha.getMinutes(),
            0, 0
        );

        // Asignar el resto de propiedades
        this.clienteId = data.clienteId;
        this.empleadoId = data.empleadoId;
        this.servicioIds = data.servicioIds;

        // Validar corteId si está presente
        if (data.corteId !== undefined) {
            if (typeof data.corteId !== 'number') {
                throw new Error('corteId debe ser un número');
            }
            this.corteId = data.corteId;
        }
    }
}