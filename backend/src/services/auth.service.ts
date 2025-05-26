// services/auth.service.ts
import { JWT_SECRET } from '../config/jwt.config';
import { User } from '../entity/user';
import { UserService } from './userService';
import { isValidPassword } from '../utils/hash';
import { PayloadToken, RoleType, AuthResponse } from '../types/auth.types';
import { AppDataSource } from '../config/database';
import * as jwt from 'jsonwebtoken';
import { TokenBlacklist } from '../entity/tokenBlacklist';

export class AuthService {
    private userService: UserService;

    constructor() {
        this.userService = new UserService(AppDataSource);
    }

    /**
     * Valida las credenciales del usuario
     */
    public async validateUser(usuario: string, contraseña: string): Promise<User | null> {
        try {
        const user = await this.userService.findByUsername(usuario);
        
        if (user && await isValidPassword(contraseña, user.contraseña)) {
            return user;
        }
        
        return null;
        } catch (error) {
        console.error('Error validating user:', error);
        return null;
        }
    }

    /**
     * Determina el rol del usuario basado en sus relaciones
     */
    private determineUserRole(user: User): RoleType {
        if (user.empleado) {
        return RoleType.EMPLEADO;
        } else if (user.cliente) {
        return RoleType.CLIENTE;
        } else {
        return RoleType.ADMIN; // No tiene relaciones
        }
    }

    /**
     * Genera la firma JWT
     */
    public signature(payload: PayloadToken, secret: string): string {
        return jwt.sign(payload, secret, { expiresIn: '24h' });
    }

    /**
     * Genera el JWT para el usuario autenticado
     */
    public async generateJwt(user: User): Promise<AuthResponse> {
        const role = this.determineUserRole(user);
        
        const payload: PayloadToken = {
            role,
            sub: user.idUser.toString(),
            username: user.usuario
        };

        const accessToken = this.signature(payload, JWT_SECRET);
        
        return {
            accessToken,
            user: {
                idUser: user.idUser,
                usuario: user.usuario,
                role
            }
        };
    }

    /**
     * Verifica y decodifica un JWT
     */
    public verifyToken(token: string): PayloadToken | null {
        try {
        return jwt.verify(token, JWT_SECRET) as PayloadToken;
        } catch (error) {
        console.error('Error verifying token:', error);
        return null;
        }
    }

    /**
     * Encuentra un usuario por ID con rol
     */
    public async findUserWithRole(userId: string, role: RoleType): Promise<User | null> {
        try {
        const user = await this.userService.findById(parseInt(userId));
        const userRole = this.determineUserRole(user);
        
        return userRole === role ? user : null;
        } catch (error) {
        console.error('Error finding user with role:', error);
        return null;
        }
    }

    /**
   * Invalida un token añadiéndolo a la blacklist
   */
    public async addToBlacklist(token: string): Promise<void> {
        const tokenRepo = AppDataSource.getRepository(TokenBlacklist);
        
        // Decodificar token para obtener fecha de expiración
        const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
        const expiresAt = new Date(decoded.exp! * 1000);

        await tokenRepo.save({ token, expiresAt });
    }

    public async isTokenBlacklisted(token: string): Promise<boolean> {
        const tokenRepo = AppDataSource.getRepository(TokenBlacklist);
        const exists = await tokenRepo.findOneBy({ token });
        return !!exists;
    }
}