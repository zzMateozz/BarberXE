

const API_BASE_URL = 'http://localhost:3000/api'; // Ajusta según tu configuración

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || 'Error en la solicitud';
    throw new Error(errorMessage);
  }
  return response.json();
};



// Headers comunes
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



export const createUser = async (userData) => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(userData),
  });
  return handleResponse(response);
};

export const updateUser = async (id, userData) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  };

export const fetchEmployees = async () => {
    const response = await fetch(`${API_BASE_URL}/empleados`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  };
  
  export const fetchEmployeeById = async (id) => {
    const response = await fetch(`${API_BASE_URL}/empleados/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  };
  
  export const createEmployee = async (employeeData) => {
    const response = await fetch(`${API_BASE_URL}/empleados`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(employeeData),
    });
    return handleResponse(response);
  };
  
  export const updateEmployee = async (id, employeeData) => {
    const response = await fetch(`${API_BASE_URL}/empleados/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(employeeData),
    });
    return handleResponse(response);
  };
  
  export const deleteEmployee = async (id) => {
    const response = await fetch(`${API_BASE_URL}/empleados/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    
    // Si la respuesta está vacía (204 No Content), devolvemos un objeto vacío
    if (response.status === 204) {
      return {};
    }
  
    return handleResponse(response);
  };
  
  
  export const searchEmployeesByName = async (name) => {
    const response = await fetch(`${API_BASE_URL}/empleados/search?nombre=${encodeURIComponent(name)}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  };
  
  export const fetchEmployeesWithAppointments = async () => {
    const response = await fetch(`${API_BASE_URL}/empleados/with-citas`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  };
  
  export const fetchEmployeesWithArqueos = async () => {
    const response = await fetch(`${API_BASE_URL}/empleados/with-arqueos`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  };
  