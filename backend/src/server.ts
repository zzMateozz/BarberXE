import "reflect-metadata";
import express from "express";
import cors from "cors";
import { AppDataSource } from "./config/database";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get("/", (req, res) => {
    res.send("Servidor funcionando 🚀");
});

// Iniciar la conexión a la base de datos y el servidor
AppDataSource.initialize()
    .then(() => {
        console.log("📦 Base de datos conectada correctamente.");

        const PORT = process.env.PORT || 3000; // Usa el puerto de .env o 3000 por defecto
        app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
        });
    })
    .catch((error) => console.error("❌ Error en la conexión:", error));
