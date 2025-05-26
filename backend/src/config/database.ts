import { DataSource } from 'typeorm';
import { ArqueoCaja } from '../entity/arqueoCaja';
import { Cita } from '../entity/cita';
import { Cliente } from '../entity/cliente';
import { Corte } from '../entity/corte';
import { Egreso } from '../entity/egreso';
import { Empleado } from '../entity/empleado';
import { Ingreso } from '../entity/ingreso';
import { Servicio } from '../entity/servicio';
import { User } from '../entity/user';
import { TokenBlacklist } from '../entity/tokenBlacklist';

export const AppDataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'barberXE',
    logging: true,
    entities: [
        ArqueoCaja,
        Cita,
        Cliente,
        Corte,
        Egreso,
        Empleado,
        Ingreso,
        Servicio,
        User,
        TokenBlacklist
    ],
    synchronize: false, // Cambia esto a false
    migrationsRun: true,
});