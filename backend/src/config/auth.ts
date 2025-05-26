import passport from 'passport';
import { LoginStrategy } from '../strategies/login.strategy';
import { JWTAuthStrategy } from '../strategies/jwt.strategy';

export const configurePassport = () => {
    // Configura estrategia Local (Login)
    const loginStrategy = new LoginStrategy();
    passport.use('login', loginStrategy.strategy);

    // Configura estrategia JWT
    const jwtStrategy = new JWTAuthStrategy();
    passport.use('jwt', jwtStrategy.strategy);
};