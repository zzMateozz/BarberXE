const API_BASE_URL = 'http://localhost:3000/api';

const handleResponse = async (response) => {
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error en la solicitud');
    }
    return response.json();
  };

export const getHeaders = () => {
    const headers = {
        'Content-Type': 'application/json',
    };
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

// Funciones para arqueos
export const fetchArqueos = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/arqueos`);
      return await handleResponse(response);
    } catch (error) {
      console.error('Error fetching arqueos:', error);
      throw new Error('Error al obtener los arqueos');
    }
  };

  
  export const getOpenArqueo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/arqueos/open`);
      
      if (response.status === 404) {
        return { exists: false, data: null }; // No hay arqueo abierto
      }
      
      if (!response.ok) {
        throw new Error('Error al verificar arqueo abierto');
      }
      
      const data = await response.json();
      return { exists: true, data };
      
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  };

  export const createArqueo = async (arqueoData) => {
    try {
      // Validación robusta de los datos de entrada
      if (!arqueoData) {
        throw new Error('Datos de arqueo no proporcionados');
      }
  
      // Convertir empleadoId a número y validar
      const empleadoId = Number(arqueoData.empleadoId);
      if (isNaN(empleadoId)) {
        throw new Error('El ID del empleado debe ser un número válido');
      }
  
      // Convertir saldoBase a número y validar
      const saldoBase = Number(arqueoData.saldoBase);
      if (isNaN(saldoBase)) {
        throw new Error('El saldo base debe ser un número válido');
      }
  
      // Validar que saldoBase sea positivo
      if (saldoBase < 0) {
        throw new Error('El saldo base no puede ser negativo');
      }
  
      const payload = {
        empleadoId: empleadoId,
        saldoBase: saldoBase,
        fechaInicio: arqueoData.fechaInicio || new Date().toISOString()
      };
  
      const response = await fetch(`${API_BASE_URL}/arqueos/open`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Asumiendo autenticación
        },
        body: JSON.stringify(payload)
      });
  
      // Manejo detallado de la respuesta
      if (!response.ok) {
        let errorMessage = `Error ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          const text = await response.text();
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }
  
      return await response.json();
    } catch (error) {
      console.error('Error en createArqueo:', error);
      throw error; // Re-lanzamos el error para manejo en el componente
    }
  };
  
  
export const getHistorial = fetchArqueos;


export const fetchArqueoById = async (id) => {
    if (!id || isNaN(Number(id))) throw new Error('ID de arqueo inválido');
    const response = await fetch(`${API_BASE_URL}/arqueos/${id}`, {
        headers: getHeaders(),
    });
    return await handleResponse(response);
};

export const closeArqueo = async (id, { saldoFinal, observacion, fechaCierre }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/arqueos/${id}/close`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        saldoFinal: Number(saldoFinal),
        observacion, // Asegúrate que se envíe
        fechaCierre
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error al cerrar arqueo");
    }

    return await response.json();
  } catch (error) {
    console.error("Error en closeArqueo:", {
      idArqueo,
      saldoFinal,
      observacion, // Verifica este valor
      error: error.message
    });
    throw error;
  }
};

export const updateArqueo = async (id, arqueoData) => {
    if (!id || isNaN(Number(id))) throw new Error('ID de arqueo inválido');
    const response = await fetch(`${API_BASE_URL}/arqueos/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(arqueoData),
    });
    return await handleResponse(response);
};

export const deleteArqueo = async (id) => {
    if (!id || isNaN(Number(id))) throw new Error('ID de arqueo inválido');
    const response = await fetch(`${API_BASE_URL}/arqueos/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });
    if (response.status === 204) return {};
    return await handleResponse(response);
};

// Funciones de empleados
export const fetchEmpleados = async () => {
    const response = await fetch(`${API_BASE_URL}/empleados`, {
        headers: getHeaders(),
    });
    const empleados = await handleResponse(response);
    return empleados.filter(empleado => empleado.cargo === 'Cajero');
};


// Agregar nuevo ingreso
export const addIngreso = async (ingresoData) => {
  try {
      const response = await fetch(`${API_BASE_URL}/ingresos`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(ingresoData)
      });
      return await handleResponse(response);
  } catch (error) {
      console.error('Error adding ingreso:', error);
      throw error;
  }
};


// Agregar nuevo Egreso
export const addEgreso = async (ingresoData) => {
  try {
      const response = await fetch(`${API_BASE_URL}/egresos`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(ingresoData)
      });
      return await handleResponse(response);
  } catch (error) {
      console.error('Error adding ingreso:', error);
      throw error;
  }
};

export const fetchIngresosByArqueo = async (arqueoId) => {
  try {
      const response = await fetch(`${API_BASE_URL}/ingresos/arqueo/${arqueoId}`, {
          headers: getHeaders()
      });

      if (!response.ok) {
          // Intentar obtener el mensaje de error del backend
          let errorMessage = `Error ${response.status}`;
          try {
              const errorData = await response.json();
              errorMessage = errorData.message || errorMessage;
          } catch (e) {
              console.error('Error parsing error response:', e);
          }
          throw new Error(errorMessage);
      }

      return await response.json();
  } catch (error) {
      console.error('Error en fetchIngresosByArqueo:', {
          arqueoId,
          error: error.message
      });
      throw new Error(error.message || 'Error al obtener ingresos');
  }
};

export const fetchEgresosByArqueo = async (arqueoId) => {
  try {
      const response = await fetch(`${API_BASE_URL}/egresos/arqueo/${arqueoId}`, {
          headers: getHeaders()
      });

      if (!response.ok) {
          let errorMessage = `Error ${response.status}`;
          try {
              const errorData = await response.json();
              errorMessage = errorData.message || errorMessage;
          } catch (e) {
              console.error('Error parsing error response:', e);
          }
          throw new Error(errorMessage);
      }

      return await response.json();
  } catch (error) {
      console.error('Error en fetchEgresosByArqueo:', {
          arqueoId,
          error: error.message
      });
      throw new Error(error.message || 'Error al obtener egresos');
  }
};

export const deleteIngreso = async (ingresoId) => {
    const response = await fetch(`${API_BASE_URL}/ingresos/${ingresoId}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });
    return await handleResponse(response);
};

export const getArqueoById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/arqueos/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) throw new Error('Error al obtener arqueo');
    return await response.json();
  } catch (error) {
    console.error('Error en getArqueoById:', error);
    throw error;
  }
};

export const deleteEgreso = async (egresoId) => {
    const response = await fetch(`${API_BASE_URL}/egresos/${egresoId}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });
    return await handleResponse(response);
};
