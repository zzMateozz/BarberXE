// src/services/LoginService.js
const API_BASE_URL = 'http://localhost:3000/api'; // Ajusta según tu configuración

export const LoginService = {
  async login(credentials) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/login`, {
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

      const data = await response.json();
      // Determinar el rol basado en las relaciones
      let role = 'cliente'; // Por defecto
      
      if (data.empleado) {
        role = 'empleado'; // Barbero o Cajero
      } else if (data.cliente) {
        role = 'cliente';
      } else {
        // Si no tiene ninguna relación, es admin
        role = 'admin';
      }

      return {
        ...data,
        role // Añadimos el rol determinado
      };
    } catch (error) {
      console.error('Error en LoginService:', error);
      throw error;
    }
  },

  async register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error en el registro');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en LoginService (register):', error);
      throw error;
    }
  },

  logout() {
    // Limpiar datos de autenticación
    localStorage.removeItem('authData');
  },

  getAuthData() {
    const authData = localStorage.getItem('authData');
    return authData ? JSON.parse(authData) : null;
  },

  isAuthenticated() {
    const authData = this.getAuthData();
    return authData ? authData.isAuthenticated : false;
  },

  getCurrentUser() {
    const authData = this.getAuthData();
    return authData ? authData.user : null;
  },

  getCurrentRole() {
    const authData = this.getAuthData();
    return authData ? authData.role : null;
  }
};