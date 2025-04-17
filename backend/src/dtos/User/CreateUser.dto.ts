export class CreateUserDto {
    readonly usuario: string;
    readonly contraseña: string;
    readonly empleado?: {
        nombre: string;
        apellido: string;
        telefono: string;
        cargo?: 'Barbero' | 'Cajero';
    };
    readonly cliente?: {
        nombre: string;
        apellido: string;
        telefono: string;
    };

    constructor(data: any) {
        if (!data.usuario || !data.contraseña) {
            throw new Error('Usuario y contraseña son requeridos');
        }

        this.usuario = data.usuario;
        this.contraseña = data.contraseña;
        
        if (data.empleado) {
            this.empleado = {
                nombre: data.empleado.nombre,
                apellido: data.empleado.apellido,
                telefono: data.empleado.telefono,
                cargo: data.empleado.cargo || 'Cajero' 
            };
        }
        
        if (data.cliente) {
            this.cliente = {
                nombre: data.cliente.nombre,
                apellido: data.cliente.apellido,
                telefono: data.cliente.telefono
            };
        }
    }
}