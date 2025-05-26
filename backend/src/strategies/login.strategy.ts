import { Strategy as LocalStrategy } from 'passport-local';
import { AuthService } from '../services/auth.service';
import { User } from '../entity/user';

export class LoginStrategy {
    private authService: AuthService;
    
    constructor() {
        this.authService = new AuthService();
    }

    async validate(
        username: string, 
        password: string, 
        done: (error: Error | null, user?: User | false) => void // Tipo explícito
    ): Promise<void> {
        try {
            const user = await this.authService.validateUser(username, password);
            user ? done(null, user) : done(null, false);
        } catch (error) {
            done(error as Error);
        }
    }

    get strategy() {
        return new LocalStrategy(
            {
                usernameField: 'usuario',
                passwordField: 'contraseña',
            },
            this.validate.bind(this)
        );
    }
}