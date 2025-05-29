
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

export const fetchUsers = async () => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const loginUser = async (credentials) => {
  const response = await fetch(`${API_BASE_URL}/users/login`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(credentials),
  });
  return handleResponse(response);
};

// ClientService.js (createUser actualizado)
export const createUser = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: getHeaders(), // Incluye Authorization si es necesario
      body: JSON.stringify({
        usuario: userData.usuario,  // Cambiar email -> usuario
        contraseña: userData.contraseña,
        cliente: {  // Cambiar client -> cliente
          nombre: userData.cliente.nombre,  // Mantener nombres en español
          apellido: userData.cliente.apellido,
          telefono: userData.cliente.telefono
        }
      }),
    });

   
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error detallado del backend:', errorData);
      throw new Error(errorData.message || 'Error al crear usuario');
    }

    return await response.json();
  } catch (error) {
    console.error('Error completo en createUser:', error);
    throw error;
  }
};


export const fetchClients = async () => {
  const response = await fetch(`${API_BASE_URL}/clientes`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const fetchClientById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/clientes/${id}`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const createClient = async (clientData) => {
  const response = await fetch(`${API_BASE_URL}/clientes`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(clientData),
  });
  return handleResponse(response);
};

export const updateClient = async (id, clientData) => {
  const response = await fetch(`${API_BASE_URL}/clientes/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(clientData),
  });
  return handleResponse(response);
};



export const deleteClient = async (id) => {
  const response = await fetch(`${API_BASE_URL}/clientes/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (response.status === 204) {
    return {};
  }

  return handleResponse(response);
};

export const searchClientsByName = async (name) => {
  const response = await fetch(`${API_BASE_URL}/clientes/search?nombre=${encodeURIComponent(name)}`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const fetchClientsWithAppointments = async () => {
  const response = await fetch(`${API_BASE_URL}/clientes/with-citas`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};
