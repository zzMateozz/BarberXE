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
    const headers = {};
    const token = localStorage.getItem('authToken');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

export const fetchAllCuts = async () => {
    const response = await fetch(`${API_BASE_URL}/cortes`, {
        headers: getHeaders(),
    });
    return handleResponse(response);
};

export const fetchServices = async () => {
    const response = await fetch(`${API_BASE_URL}/servicios`, {
        headers: getHeaders(),
    });
    return handleResponse(response);
};

export const fetchServiceById = async (id) => {
    const response = await fetch(`${API_BASE_URL}/servicios/${id}`, {
        headers: getHeaders(),
    });
    return handleResponse(response);
};


// ServiceService.js
export const createService = async (formDataToSend) => { // Recibir FormData directamente
  try {
    // Eliminar validación aquí (se hará en el componente)
    const response = await fetch(`${API_BASE_URL}/servicios`, {
      method: 'POST',
      headers: {
        ...(localStorage.getItem('authToken') && {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        })
      },
      body: formDataToSend // Usar FormData directamente
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al crear servicio');
    }

    return await response.json();
  } catch (error) {
    console.error("Error en createService:", error);
    throw error;
  }
};
export const updateService = async (id, formData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/servicios/${id}`, {
            method: 'PUT',
            headers: {

                ...(localStorage.getItem('authToken') && {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                })
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al actualizar servicio');
        }

        return await response.json();
    } catch (error) {
        console.error('Error en updateService:', error);
        throw new Error(error.message || 'Error de conexión al actualizar servicio');
    }
};

export const deleteService = async (id) => {
    const response = await fetch(`${API_BASE_URL}/servicios/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });
    
    if (response.status === 204) {
        return {};
    }

    return handleResponse(response);
};

export const searchServicesByName = async (name) => {
    const response = await fetch(`${API_BASE_URL}/servicios/nombre/${encodeURIComponent(name)}`, {
        headers: getHeaders(),
    });
    return handleResponse(response);
};