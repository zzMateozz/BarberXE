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


export const fetchCuts = async () => {
    const response = await fetch(`${API_BASE_URL}/cortes`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  };
  
  export const fetchCutById = async (id) => {
    const response = await fetch(`${API_BASE_URL}/cortes/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  };
  
  export const createCut = async (cutData) => {
    const response = await fetch(`${API_BASE_URL}/cortes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(cutData),
    });
    return handleResponse(response);
  };
  
  export const updateCut = async (id, cutData) => {
    const response = await fetch(`${API_BASE_URL}/cortes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(cutData),
    });
    return handleResponse(response);
  };
  
   export const deleteCut = async (id) => {
     const response = await fetch(`${API_BASE_URL}/cortes/${id}`, {
       method: 'DELETE',
       headers: getHeaders(),
     });
     
     // Si la respuesta está vacía (204 No Content), devolvemos un objeto vacío
     if (response.status === 204) {
       return {};
     }
   
     return handleResponse(response);
   };
  
  export const searchCutsByStyle = async (style) => {
    const response = await fetch(`${API_BASE_URL}/cortes/estilo/${encodeURIComponent(style)}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  };
  