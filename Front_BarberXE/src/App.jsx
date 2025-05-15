import '../src/App.css';
import { Routes, Route } from 'react-router-dom';
import AdminPage from "./pages/Admin";
import Login from './pages/Login';
import { ToastContainer } from 'react-toastify';
import EmpleadoPage from './pages/Cajero'; // Asegúrate de crear este componente
import ClientePage from './pages/Cliente'; // Asegúrate de crear este componente

function App() {
    return (
        <>
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
            
            <Routes>
                {/* Ruta pública (login) */}
                <Route path="/login" element={<Login />} />
                
                {/* Ruta protegida para admin */}
                <Route 
                    path="/admin/*" 
                    element={
                
                            <AdminPage />
                    
                    } 
                />
                
                {/* Ruta protegida para empleado */}
                <Route 
                    path="/empleado/*" 
                    element={ 
                            <EmpleadoPage />
                    } 
                />
                
                {/* Ruta protegida para cliente */}
                <Route 
                    path="/cliente/*" 
                    element={
           
                            <ClientePage />
                      
                    } 
                />
                
                {/* Ruta por defecto redirige a login */}
                <Route path="/" element={<Login />} />
                
            </Routes>
        </>
    );
}

export default App;