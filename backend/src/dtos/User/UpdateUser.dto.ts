export class UpdateUserDto {
    readonly usuario?: string;
    readonly contraseña?: string;

    constructor(data: {
        usuario?: string;
        contraseña?: string;
    } = {}) {
        this.usuario = data.usuario;
        this.contraseña = data.contraseña;
    }
}