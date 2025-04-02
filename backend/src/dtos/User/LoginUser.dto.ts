export class LoginUserDto {
    readonly usuario: string;
    readonly contraseña: string;

    constructor(data: {
        usuario: string;
        contraseña: string;
    }) {
        if (!data.usuario || !data.contraseña) {
            throw new Error('Usuario y contraseña son requeridos');
        }

        this.usuario = data.usuario;
        this.contraseña = data.contraseña;
    }
}