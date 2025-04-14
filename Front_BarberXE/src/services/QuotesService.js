
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

export const fetchCitas = async () => {
  const response = await fetch(`${API_BASE_URL}/citas`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Error al obtener citas');
  }
  return await response.json();
};

export const createCita = async (citaData) => {
  const response = await fetch(`${API_BASE_URL}/citas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(citaData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Error al crear cita');
  }
  return await response.json();
};

export const updateCita = async (id, citaData) => {
  const response = await fetch(`${API_BASE_URL}/citas/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(citaData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Error al actualizar cita');
  }
  return await response.json();
};

export const deleteCita = async (id) => {
  const response = await fetch(`${API_BASE_URL}/citas/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Error al eliminar cita');
  }
  return await response.json();
};

export const fetchClientes = async () => {
  const response = await fetch(`${API_BASE_URL}/clientes`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Error al obtener clientes');
  }
  return await response.json();
};

export const fetchEmpleados = async () => {
  const response = await fetch(`${API_BASE_URL}/empleados`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Error al obtener empleados');
  }
  return await response.json();
};

export const fetchServicios = async () => {
  const response = await fetch(`${API_BASE_URL}/servicios`);
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Error al obtener servicios');
  }
  return await response.json();
};

export const checkDisponibilidadEmpleado = async (idEmpleado, fechaHora, duracion, excludeCitaId = null) => {
  const response = await fetch(`${API_BASE_URL}/citas/disponibilidad`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      idEmpleado, 
      fechaHora: fechaHora.toISOString(), 
      duracion, 
      excludeCitaId 
    }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Error al verificar disponibilidad');
  }
  return await response.json();
};