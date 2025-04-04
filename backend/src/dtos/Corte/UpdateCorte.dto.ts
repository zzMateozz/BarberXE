// dtos/Corte/UpdateCorte.dto.ts
export class UpdateCorteDto {
    readonly estilo?: string;
    readonly servicioIds?: number[];// Opcional
    readonly imagenUrl?: string; 

    constructor(data: any = {}) {
        this.estilo = data.estilo;
        this.imagenUrl = data.imagenUrl;
        this.servicioIds = data.servicioIds;
    }
}