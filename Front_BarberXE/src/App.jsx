import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './pages/Login';
import AdminPage from './pages/Admin';
import CajeroPage from './pages/Cajero';
import ClientePage from './pages/Cliente'; // Asegúrate de tener esta página
import ProtectedRoute from './pages/ProtectedRoute'; // Componente para proteger rutas

function App() {
    return (
        <Router>
        <div className="App">
            <Routes>
            {/* Ruta pública de login */}
            <Route path="/login" element={<Login />} />
            
            {/* Rutas protegidas */}
            <Route 
                path="/admin/*" 
                element={
                <ProtectedRoute allowedRoles={['admin']}>
                    <AdminPage />
                </ProtectedRoute>
                } 
            />
            
            <Route 
                path="/cajero/*" 
                element={
                <ProtectedRoute allowedRoles={['empleado', 'cajero']}>
                    <CajeroPage />
                </ProtectedRoute>
                } 
            />
            
            <Route 
                path="/cliente/*" 
                element={
                <ProtectedRoute allowedRoles={['cliente']}>
                    <ClientePage />
                </ProtectedRoute>
                } 
            />
            
            {/* Redirección por defecto */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Ruta para páginas no encontradas */}
            <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
            
            <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            />
        </div>
        </Router>
    );
}

export default App;