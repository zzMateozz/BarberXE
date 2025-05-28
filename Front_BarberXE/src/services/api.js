const API_BASE_URL = 'http://localhost:3000/api';

export const api = {
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('authToken');
        
        const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
        };
        
        const config = {
        ...options,
        headers
        };
        
        try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        
        // Si el token expiró, intentar refrescarlo
        if (response.status === 401 && !options._retry) {
            const newToken = await LoginService.refreshToken();
            
            if (newToken) {
            // Reintentar la solicitud con el nuevo token
            return this.request(endpoint, {
                ...options,
                headers: {
                ...headers,
                'Authorization': `Bearer ${newToken}`
                },
                _retry: true
            });
            } else {
            // No se pudo refrescar el token, hacer logout
            await LoginService.logout();
            window.location.href = '/login';
            return;
            }
        }
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Error en la solicitud');
        }
        
        return response.json();
        } catch (error) {
        console.error('Error en la solicitud:', error);
        throw error;
        }
    },
    
    get(endpoint) {
        return this.request(endpoint);
    },
    
    post(endpoint, body) {
        return this.request(endpoint, {
        method: 'POST',
        body: JSON.stringify(body)
        });
    },
    
    put(endpoint, body) {
        return this.request(endpoint, {
        method: 'PUT',
        body: JSON.stringify(body)
        });
    },
    
    delete(endpoint) {
        return this.request(endpoint, {
        method: 'DELETE'
        });
    },
    
    upload(endpoint, formData) {
        const token = localStorage.getItem('authToken');
        const headers = {};
        
        if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        }
        
        return fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData
        });
    }
};