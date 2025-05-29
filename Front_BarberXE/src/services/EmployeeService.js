const API_BASE_URL = 'http://localhost:3000/api';

const handleResponse = async (response) => {

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('API Error:', errorData);
    const errorMessage = errorData.message || 'Error en la solicitud';
    throw new Error(errorMessage);
  }
  return response.json();
};

const getHeaders = (includeContentType = true) => {
  const headers = {};

  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }

  // Si tenemos token de autenticación, lo añadimos
  const token = localStorage.getItem('authToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

const getFormDataHeaders = () => {
  const headers = {};

  // Solo Authorization para FormData, no Content-Type
  const token = localStorage.getItem('authToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// Función para crear usuario (para cajeros que necesitan cuenta)
export const createUser = async (userData) => {
  try {

    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        usuario: userData.usuario,
        contraseña: userData.contraseña,
        empleado: {
          nombre: userData.nombre,
          apellido: userData.apellido,
          telefono: userData.telefono,
          cargo: 'Cajero'
        }
      }),
    });


    return await handleResponse(response);

  } catch (error) {
    console.error('Error completo en createUser:', error);
    throw error;
  }
};

// Función createEmployee - Corregir nombres de campos
export const createEmployee = async (employeeData) => {
  try {
    const formData = new FormData();
    
    // Usar los nombres EXACTOS de la base de datos
    formData.append('nombre', employeeData.nombre); // Singular
    formData.append('apellido', employeeData.apellido); // Singular
    formData.append('telefono', employeeData.telefono);
    formData.append('imagenPerfil', employeeData.imagen); // Nombre correcto
    formData.append('cargo', 'Barbero');
    formData.append('estado', 'activo'); // Si es requerido

    const response = await fetch(`${API_BASE_URL}/empleados`, {
      method: 'POST',
      headers: getFormDataHeaders(),
      body: formData
    });

    return await handleResponse(response);
  } catch (err) {
    throw new Error("Error al crear barbero");
  }
};

// Función para actualizar empleados
export const updateEmployee = async (id, employeeData, hasImage = false) => {
  try {
  
    // Si hay imagen, usar FormData
    if (hasImage || employeeData.imagen) {

      
      const formData = new FormData();
      
      // Agregar campos básicos
      if (employeeData.nombre) formData.append('nombre', employeeData.nombre);
      if (employeeData.apellido) formData.append('apellido', employeeData.apellido);
      if (employeeData.telefono) formData.append('telefono', employeeData.telefono);
      if (employeeData.estado) formData.append('estado', employeeData.estado);
      
      // Agregar imagen si existe
      if (employeeData.imagen) {
        formData.append('imagenPerfil', employeeData.imagen);
      }
      
    
      const response = await fetch(`${API_BASE_URL}/empleados/${id}`, {
        method: 'PUT',
        headers: getFormDataHeaders(), // IMPORTANTE: Usar headers que incluyen Authorization pero NO Content-Type
        body: formData
      });
      
      return await handleResponse(response);
      
    } else {
     
      
      const response = await fetch(`${API_BASE_URL}/empleados/${id}`, {
        method: 'PUT',
        headers: getHeaders(), // Headers con Content-Type y Authorization
        body: JSON.stringify(employeeData)
      });
      
      return await handleResponse(response);
    }
    
  } catch (err) {
    console.error('Error actualizando empleado:', err);
    throw new Error(err.message || 'Error al actualizar empleado');
  }
};

// Otras funciones
export const fetchEmployees = async () => {
  const response = await fetch(`${API_BASE_URL}/empleados`, {
    headers: getHeaders(false)
  });
  return handleResponse(response);
};

export const deleteEmployee = async (id) => {
  const response = await fetch(`${API_BASE_URL}/empleados/${id}`, {
    method: 'DELETE',
    headers: getHeaders(false)
  });

  if (response.status === 204) {
    return {};
  }

  return handleResponse(response);
};

export const searchEmployeesByName = async (name) => {
  const response = await fetch(`${API_BASE_URL}/empleados/search?nombre=${encodeURIComponent(name)}`, {
    headers: getHeaders(false)
  });
  return handleResponse(response);
};

export const fetchEmployeeById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/empleados/${id}`, {
    headers: getHeaders(false)
  });
  return handleResponse(response);
};

export const fetchEmployeesWithCitas = async () => {
  const response = await fetch(`${API_BASE_URL}/empleados/with-citas`, {
    headers: getHeaders(false)
  });
  return handleResponse(response);
};

export const fetchEmployeesWithArqueos = async () => {
  const response = await fetch(`${API_BASE_URL}/empleados/with-arqueos`, {
    headers: getHeaders(false)
  });
  return handleResponse(response);
};