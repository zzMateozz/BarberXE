export class CreateCorteDto {
    readonly estilo: string;
    readonly servicioIds?: number[]; // Ahora es opcional
    readonly imagenUrl: string;

    constructor(data: any) {
        if (!data.estilo) {
            throw new Error('Estilo es requerido');
        }

        this.estilo = data.estilo;
        this.imagenUrl = data.imagenUrl;
        this.servicioIds = data.servicioIds || []; // Default: array vacío
    }
}