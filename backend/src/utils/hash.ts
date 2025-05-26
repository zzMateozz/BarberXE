// utils/hash.ts
import * as bcrypt from 'bcryptjs';

export const createHashValue = async (password: string): Promise<string> => {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
    };

    export const isValidPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
    return await bcrypt.compare(password, hashedPassword);
};