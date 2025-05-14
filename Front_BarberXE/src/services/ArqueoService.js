const API_BASE_URL = 'http://localhost:3000/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || 'Error en la solicitud';
    throw new Error(errorMessage);
  }
  return response.json();
};

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  // Si tenemos token de autenticación, lo añadimos
  const token = localStorage.getItem('authToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Funciones para arqueos
export const fetchArqueos = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/arqueos`, {
      headers: getHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error al obtener arqueos');
    }
    
    const data = await response.json();
    return data.data || []; // Asegurar array
  } catch (error) {
    console.error('Error en fetchArqueos:', error);
    throw error;
  }
};

export const getArqueoById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/arqueos/${id}`, {
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Arqueo no encontrado');
    }
    
    const data = await response.json();
    return data.data; // Asegúrate de retornar data.data
  } catch (error) {
    console.error('Error en getArqueoById:', error);
    throw error;
  }
};

export const getHistorial = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/arqueos`, {
      headers: getHeaders()
    });
    
    const data = await response.json();
    return data.data.map(arqueo => ({
      ...arqueo,
      ingresos: arqueo.ingresos || [],
      egresos: arqueo.egresos || []
    }));
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};



export const getOpenArqueo = async (empleadoId) => {
  if (!empleadoId || isNaN(empleadoId)) {
      console.error("ID de empleado inválido:", empleadoId);
      throw new Error("ID de empleado inválido");
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/arqueos/empleados/${empleadoId}/abierto`, {
      headers: getHeaders()
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return { exists: false, data: null };
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${response.status}`);
    }
    
    const data = await response.json();
    const arqueoData = data.data || data; // Manejar respuesta con/sin data wrapper
    
    if (arqueoData && (arqueoData.idArqueo || arqueoData.id)) {
      return { 
        exists: true, 
        data: {
          ...arqueoData,
          idArqueo: arqueoData.idArqueo || arqueoData.id
        }
      };
    }
      
      return { exists: false, data: null };
  } catch (error) {
      console.error("Error checking open arqueo:", error);
      throw error;
  }
};

export const createArqueo = async (arqueoData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/arqueos`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                empleadoId: Number(arqueoData.empleadoId),
                saldoInicial: Number(arqueoData.saldoInicial)
            })
        });
        return await handleResponse(response);
    } catch (error) {
        console.error('Error en createArqueo:', error);
        throw error;
    }
};

export const closeArqueo = async (id, { saldoFinal, observacion }) => {
  try {
      const response = await fetch(`${API_BASE_URL}/arqueos/${id}/close`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
              saldoFinal: Number(saldoFinal),
              observaciones: observacion || "Sin observaciones"
          })
      });
      
      // Better error handling
      if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Error al cerrar arqueo: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data;
  } catch (error) {
      console.error("Error en closeArqueo:", error);
      throw error;
  }
};
// Funciones para ingresos
export const addIngreso = async (ingresoData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/arqueos/${ingresoData.arqueoId}/ingresos`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        monto: ingresoData.monto,
        descripcion: ingresoData.descripcion,
        medioPago: ingresoData.medioPago,
        arqueoId: ingresoData.arqueoId // Asegurar que se envía
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error al crear ingreso');
    }
    
    return data;
  } catch (error) {
    console.error('Error adding ingreso:', error);
    throw new Error(error.message || "Error de conexión");
  }
};


export const fetchIngresosByArqueo = async (arqueoId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/arqueos/${arqueoId}/ingresos`, {
      headers: getHeaders()
    });
    
    if (!response.ok) throw new Error('Error al obtener ingresos');
    
    const data = await response.json();
    return Array.isArray(data) ? data : data.items || data.data?.items || [];
  } catch (error) {
    console.error('Error en fetchIngresosByArqueo:', error);
    return [];
  }
};

export const fetchAllIngresos = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/ingresos`, {
      headers: getHeaders() // Usando la función definida
    });
    
    if (!response.ok) throw new Error('Error al obtener ingresos');
    
    return await response.json();
  } catch (error) {
    console.error('Error en fetchAllIngresos:', error);
    throw error;
  }
};


// Funciones para egresos
export const addEgreso = async (egresoData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/egresos`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                monto: Number(egresoData.monto),
                descripcion: egresoData.descripcion,
                arqueoId: Number(egresoData.arqueoId),
                categoria: egresoData.categoria, // Añadir categoría
                justificacion: egresoData.justificacion // Añadir justificación
            })
        });
        return await handleResponse(response);
    } catch (error) {
        console.error('Error adding egreso:', error);
        throw error;
    }
};

export const fetchEgresosByArqueo = async (arqueoId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/arqueos/${arqueoId}/egresos`, {
            headers: getHeaders()
        });
        const data = await handleResponse(response);
        
        // Asegurar estructura correcta
        return data.data?.items || data.items || data || []; 
    } catch (error) {
        console.error('Error en fetchEgresosByArqueo:', error);
        return []; // Siempre retornar array
    }
};

// En ArqueoService.js
export const fetchEmpleados = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/empleados`, {
      headers: getHeaders() // Usando la función definida
    });
    
    if (!response.ok) throw new Error('Error al obtener empleados');
    
    const empleados = await response.json();
    return empleados.filter(e => e.cargo === 'Cajero');
  } catch (error) {
    console.error('Error en fetchEmpleados:', error);
    throw new Error('Error al obtener empleados');
  }
  
};

export const updateEgreso = async (id, egresoData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/egresos/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({
        monto: egresoData.monto,
        descripcion: egresoData.descripcion,
        categoria: egresoData.categoria, // Asegurar que está incluido
        justificacion: egresoData.justificacion // Asegurar que está incluido
      })
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error updating egreso:', error);
    throw error;
  }
};


