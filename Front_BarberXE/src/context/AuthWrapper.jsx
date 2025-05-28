import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const AuthWrapper = ({ children, roles }) => {
    const { isAuthenticated, role, isLoading } = useAuth();
    const navigate = useNavigate();
    
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
        navigate('/login');
        }
        
        if (!isLoading && isAuthenticated && roles && !roles.includes(role)) {
        navigate('/');
        }
    }, [isAuthenticated, role, isLoading, navigate, roles]);
    
    if (isLoading) {
        return <div>Cargando...</div>;
    }
    
    if (!isAuthenticated || (roles && !roles.includes(role))) {
        return null;
    }
    
    return children;
};