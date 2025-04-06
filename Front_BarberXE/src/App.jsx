import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import '../src/app.css';
import AdminPage from './pages/Admin';
import ClientPage from './pages/Cliente';
import CajeroPage from './pages/Cajero';

function App() {
  // Función mejorada para verificar autenticación
  const isAuthenticated = () => {
    try {
      const authData = JSON.parse(localStorage.getItem('authData') || '{}');
      return !!authData.isAuthenticated;
    } catch (error) {
      console.error("Error reading auth data:", error);
      return false;
    }
  };

  // Componente de ruta protegida mejorado
  const ProtectedRoute = ({ children, allowedRole }) => {
    const authData = JSON.parse(localStorage.getItem('authData') || '{}');
    
    if (!isAuthenticated()) {
      return <Navigate to="/" replace />;
    }
    
    // Comparación de roles insensible a mayúsculas/minúsculas
    if (allowedRole && authData.role.toLowerCase() !== allowedRole.toLowerCase()) {
      return <Navigate to="/" replace />;
    }

    return children;
  };

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      
      {/* Ruta para admin - nota la consistencia en minúsculas */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminPage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/cliente" 
        element={
          <ProtectedRoute allowedRole="cliente">
            <ClientPage />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/cajero" 
        element={
          <ProtectedRoute allowedRole="cajero">
            <CajeroPage />
          </ProtectedRoute>
        } 
      />
      
      {/* Ruta para manejar cualquier otra dirección */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;