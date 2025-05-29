import 'reflect-metadata';
import bodyParser from 'body-parser';
import express from 'express';
import path from 'path';
import cors from 'cors';
import { config } from 'dotenv';
import { AppDataSource } from './config/database';
import clienteRoutes from './routes/clienteRoutes';
import arqueoCajaRoutes from './routes/arqueoCajaRoutes';
import citaRoutes from './routes/citaRoutes';
import corteRoutes from './routes/corteRoutes';
import egresoRoutes from './routes/egresoRoutes';
import empleadoRoutes from './routes/empleadoRoutes';
import ingresoRoutes from './routes/ingresoRoutes';
import servicioRoutes from './routes/servicioRoutes';
import userRoutes from './routes/userRoutes';
import authRoutes from './routes/auth.routes';
import passport from 'passport';
import { configurePassport } from './config/auth';


config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
configurePassport();
app.use(passport.initialize()); 
app.use(cors({
    origin: 'http://localhost:5173', // or your frontend URL
    credentials: true
}));
app.use(express.json());

// Ruta de prueba
app.get("/", (req, res) => {
    res.send("Servidor funcionando 🚀");
});

// Rutas
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')), (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use('/api/auth', authRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/arqueos', arqueoCajaRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/cortes', corteRoutes);
app.use('/api/egresos', egresoRoutes);
app.use('/api/empleados', empleadoRoutes);
app.use('/api/ingresos', ingresoRoutes);
app.use('/api/servicios', servicioRoutes);
app.use('/api/users', userRoutes);

// Registrar otras rutas aquí

// Iniciar la conexión a la base de datos y el servidor
AppDataSource.initialize()
    .then(() => {
        app.listen(PORT, () => {
        });
    })
    .catch((error) => {
        console.error('Error al conectar a la base de datos:', error);
    });