export class UpdateCorteDto {
    readonly estilo?: string;
    readonly imagenUrl?: string;
    // Eliminamos servicioIds ya que no es relevante para el Corte

    constructor(data: Partial<UpdateCorteDto> = {}) {
        if (!data.estilo && !data.imagenUrl) {
            throw new Error('Al menos un campo debe ser proporcionado para actualizar');
        }

        if (data.estilo !== undefined) {
            if (typeof data.estilo !== 'string' || data.estilo.trim() === '') {
                throw new Error('El estilo debe ser una cadena no vacía');
            }
            this.estilo = data.estilo;
        }

        if (data.imagenUrl !== undefined) {
            if (typeof data.imagenUrl !== 'string') {
                throw new Error('La URL de la imagen debe ser una cadena');
            }
            this.imagenUrl = data.imagenUrl;
        }
    }
}