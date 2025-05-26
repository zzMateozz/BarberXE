import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const [authData, setAuthData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = () => {
        try {
            const storedAuthData = localStorage.getItem('authData');
            if (storedAuthData) {
            const parsedAuthData = JSON.parse(storedAuthData);
            setAuthData(parsedAuthData);
            }
        } catch (error) {
            console.error('Error al verificar autenticación:', error);
            setAuthData(null);
        } finally {
            setLoading(false);
        }
        };

        checkAuth();
    }, []);

    if (loading) {
        return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        );
    }

    // Si no está autenticado, redirigir al login
    if (!authData || !authData.isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Si hay roles permitidos y el usuario no tiene el rol correcto
    if (allowedRoles.length > 0 && !allowedRoles.includes(authData.role?.toLowerCase())) {
        // Redirigir según su rol actual
        const roleRoutes = {
        admin: '/admin',
        empleado: '/cajero',
        cajero: '/cajero',
        cliente: '/cliente'
        };
        
        const userRole = authData.role?.toLowerCase();
        const redirectPath = roleRoutes[userRole] || '/login';
        
        return <Navigate to={redirectPath} replace />;
    }

    return children;
};

export default ProtectedRoute;