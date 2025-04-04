export class UpdateCitaDto {
    readonly fecha?: Date;
    readonly clienteId?: number;
    readonly empleadoId?: number;
    readonly servicioIds?: number[];

    constructor(data: any = {}) {
        if (data.fecha) {
            // Validación de fecha
            const fecha = new Date(data.fecha);
            if (isNaN(fecha.getTime())) {
                throw new Error('Fecha no válida');
            }

            // Validar que no sea fecha pasada
            const ahora = new Date();
            if (fecha < ahora) {
                throw new Error('No se pueden agendar citas en fechas pasadas');
            }

            // Validar intervalo de 30 minutos
            const minutos = fecha.getMinutes();
            const segundos = fecha.getSeconds();
            const milisegundos = fecha.getMilliseconds();
            
            if (minutos % 30 !== 0 || segundos !== 0 || milisegundos !== 0) {
                throw new Error('Las citas deben comenzar en hora exacta o media hora (ej: 10:00 o 10:30)');
            }

            this.fecha = new Date(
                fecha.getFullYear(),
                fecha.getMonth(),
                fecha.getDate(),
                fecha.getHours(),
                fecha.getMinutes(),
                0, 0
            );
        }

        if (data.clienteId) {
            if (typeof data.clienteId !== 'number') {
                throw new Error('clienteId debe ser un número');
            }
            this.clienteId = data.clienteId;
        }

        if (data.empleadoId) {
            if (typeof data.empleadoId !== 'number') {
                throw new Error('empleadoId debe ser un número');
            }
            this.empleadoId = data.empleadoId;
        }

        if (data.servicioIds) {
            if (!Array.isArray(data.servicioIds)) {
                throw new Error('servicioIds debe ser un array');
            }
            this.servicioIds = data.servicioIds;
        }
    }
}