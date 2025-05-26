const API_BASE_URL = 'http://localhost:3000/api'; 

export const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || data.error || 'Error en la respuesta del servidor');
    // Estructura manualmente el response para simular axios-like handling
    error.response = {
      status: response.status,
      data: data
    };
    throw error;
  }

  return data;
};

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('authToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// ------------------ Citas ------------------
export const fetchCitas = async () => {
  const response = await fetch(`${API_BASE_URL}/citas`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const fetchCitasByClienteId = async (clienteId) => {
  const response = await fetch(`${API_BASE_URL}/citas/cliente/${clienteId}`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const createCita = async (citaData) => {
  const response = await fetch(`${API_BASE_URL}/citas`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(citaData),
  });
  return handleResponse(response);
};

export const updateCita = async (id, citaData) => {
  const response = await fetch(`${API_BASE_URL}/citas/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(citaData),
  });
  return handleResponse(response);
};

export const deleteCita = async (id) => {
  const response = await fetch(`${API_BASE_URL}/citas/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  
  if (response.status === 204) {
    return {};
  }

  return handleResponse(response);
};

// ------------------ Clientes ------------------
export const fetchClientes = async () => {
  const response = await fetch(`${API_BASE_URL}/clientes`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// ------------------ Empleados ------------------
export const fetchEmpleados = async () => {
  const response = await fetch(`${API_BASE_URL}/empleados`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// ------------------ Servicios ------------------
export const fetchServicios = async () => {
  const response = await fetch(`${API_BASE_URL}/servicios`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const checkDisponibilidadEmpleado = async (idEmpleado, fechaHora, duracion, excludeCitaId = null) => {
  try {
      // Validación de parámetros
      if (!idEmpleado || !fechaHora || isNaN(new Date(fechaHora).getTime())) {
          throw new Error('Parámetros inválidos para verificar disponibilidad');
      }

      const response = await fetch(`${API_BASE_URL}/citas/disponibilidad`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
          },
          body: JSON.stringify({ 
              idEmpleado: Number(idEmpleado),
              fechaHora: new Date(fechaHora).toISOString(),
              duracion: Number(duracion) || 30,
              excludeCitaId: excludeCitaId ? Number(excludeCitaId) : null
          }),
      });

      // Verificar estado de la respuesta
      if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      // Validar estructura de la respuesta
      const data = await response.json();
      if (typeof data.disponible !== 'boolean') {
          throw new Error('Formato de respuesta inválido desde el servidor');
      }

      return data.disponible;
  } catch (error) {
      console.error('Error en checkDisponibilidadEmpleado:', {
          error: error.message,
          idEmpleado,
          fechaHora,
          duracion,
          excludeCitaId
      });
      throw new Error(error.message || 'No se pudo verificar la disponibilidad. Por favor intente nuevamente.');
  }
};