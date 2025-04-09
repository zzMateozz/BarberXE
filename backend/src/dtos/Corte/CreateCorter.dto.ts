export class CreateCorteDto {
    readonly estilo: string;// Ahora es opcional
    readonly imagenUrl: string;

    constructor(data: any) {
        if (!data.estilo) {
            throw new Error('Estilo es requerido');
        }

        this.estilo = data.estilo;
        this.imagenUrl = data.imagenUrl; // Default: array vacío
    }
}