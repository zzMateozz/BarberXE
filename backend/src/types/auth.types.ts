export enum RoleType {
    ADMIN = 'ADMIN',
    EMPLEADO = 'EMPLEADO', 
    CLIENTE = 'CLIENTE'
}

export interface PayloadToken {
    sub: string;
    role: RoleType;
    username: string;
    iat?: number;
    exp?: number;
}

export interface AuthUser {
    idUser: number;
    role: RoleType;
    username: string;
}

export interface AuthResponse {
    accessToken: string;
    user: AuthUser & {
        empleado?: any;
        cliente?: any;
    };
}


