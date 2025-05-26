// types/auth.types.ts
export enum RoleType {
    ADMIN = 'ADMIN',
    EMPLEADO = 'EMPLEADO', 
    CLIENTE = 'CLIENTE'
    }

    export interface PayloadToken {
        role: RoleType;
        sub: string;
        username: string;
        iat?: number;
        exp?: number;
    }

    export interface AuthResponse {
    accessToken: string;
    user: {
        idUser: number;
        usuario: string;
        role: RoleType;
        empleado?: any;
        cliente?: any;
    };
}