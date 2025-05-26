import { createContext, useContext, useEffect, useState } from 'react';
import { LoginService } from '../services/LoginService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [authState, setAuthState] = useState({
        isAuthenticated: false,
        user: null,
        role: null,
        token: null,
        isLoading: true
    });

    useEffect(() => {
        const initializeAuth = async () => {
        const token = LoginService.getCurrentToken();
        
        if (token) {
            try {
            // Verificar token con el backend
            const response = await fetch('http://localhost:3000/api/auth/verify', {
                headers: {
                'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const userData = await fetch('http://localhost:3000/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
                }).then(res => res.json());
                
                setAuthState({
                isAuthenticated: true,
                user: userData,
                role: userData.role,
                token,
                isLoading: false
                });
            } else {
                throw new Error('Token inválido');
            }
            } catch (error) {
            console.error('Error verificando autenticación:', error);
            LoginService.logout();
            setAuthState({
                isAuthenticated: false,
                user: null,
                role: null,
                token: null,
                isLoading: false
            });
            }
        } else {
            setAuthState(prev => ({ ...prev, isLoading: false }));
        }
        };
        
        initializeAuth();
    }, []);

    const login = async (credentials) => {
        try {
        const authData = await LoginService.login(credentials);
        
        setAuthState({
            isAuthenticated: true,
            user: authData.user,
            role: authData.role,
            token: authData.token,
            isLoading: false
        });
        
        return authData;
        } catch (error) {
        throw error;
        }
    };

    const logout = async () => {
        await LoginService.logout();
        setAuthState({
        isAuthenticated: false,
        user: null,
        role: null,
        token: null,
        isLoading: false
        });
    };

    return (
        <AuthContext.Provider value={{ ...authState, login, logout }}>
        {!authState.isLoading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);