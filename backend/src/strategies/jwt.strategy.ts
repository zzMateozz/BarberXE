// jwt.strategy.ts
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { JWT_SECRET } from '../config/jwt.config';
import { PayloadToken } from '../types/auth.types';

export class JWTAuthStrategy {
    get strategy() {
        return new JwtStrategy(
            {
                jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
                secretOrKey: JWT_SECRET,
            },
            async (payload: PayloadToken, done) => {
                try {
                    // Asegúrate de retornar el payload completo
                    return done(null, payload);
                } catch (error) {
                    return done(error, false);
                }
            }
        );
    }
}