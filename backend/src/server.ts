import 'reflect-metadata';
import express from 'express';
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

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get("/", (req, res) => {
    res.send("Servidor funcionando 🚀");
});
// Rutas
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
        console.log('Conexión a la base de datos establecida');
        app.listen(PORT, () => {
        console.log(`Servidor corriendo en el puerto ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Error al conectar a la base de datos:', error);
    });