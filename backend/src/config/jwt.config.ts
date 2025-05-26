// config/jwt.config.ts
import { config } from 'dotenv';

config();

export const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';