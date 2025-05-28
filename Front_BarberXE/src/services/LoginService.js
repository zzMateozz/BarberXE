const API_BASE_URL = 'http://localhost:3000/api';

export const LoginService = {
   async login(credentials) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error en el inicio de sesión');
      }

      const { data } = await response.json(); // Destructure the nested data
      
      // Verify the response structure
      if (!data.token || !data.user || !data.role) {
        console.error('Invalid response structure:', data);
        throw new Error('Estructura de respuesta inválida del servidor');
      }
      
      return data; // Return just the data part
    } catch (error) {
      console.error('Error en LoginService:', error);
      throw error;
    }
  },

  async logout() {
    try {
      const token = localStorage.getItem('authToken');
      
      if (token) {
        // Llamar al endpoint de logout en el backend
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      // Limpiar almacenamiento local
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('authData');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  },

  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        throw new Error('No hay refresh token disponible');
      }
      
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });
      
      if (!response.ok) {
        throw new Error('Error al refrescar el token');
      }
      
      const data = await response.json();
      localStorage.setItem('authToken', data.token);
      return data.token;
    } catch (error) {
      console.error('Error al refrescar token:', error);
      throw error;
    }
  },

  getCurrentToken() {
    return localStorage.getItem('authToken');
  },

  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  }
};