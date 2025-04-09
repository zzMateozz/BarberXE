const API_BASE_URL = 'http://localhost:3000/api'; 

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
        const headers = {};
        const token = localStorage.getItem('authToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
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
  
export const createService = async (formData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/servicios`, {
                method: 'POST',
                headers: getHeaders(),
                body: formData
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al crear servicio');
            }
            const result = await response.json();
            if (result.imagenUrl) {
                result.imagenUrl = `http://localhost:3000${result.imagenUrl}`;
            }
            return result;
        } catch (error) {
            console.error("Error en createCut:", error);
            throw error;
        }
    };

    export const updateService = async (id, serviceData) => {
        const formData = new FormData();
    
        // Agregamos los campos al formData
        formData.append('nombre', serviceData.nombre);
        formData.append('precio', serviceData.precio);
        formData.append('duracion', serviceData.duracion);
        formData.append('estado', serviceData.estado);
    
        // Verificamos si se subió una nueva imagen
        if (serviceData.imagen instanceof File) {
            formData.append('imagen', serviceData.imagen);
        }
    
        const response = await fetch(`${API_BASE_URL}/servicios/${id}`, {
            method: 'PUT',
            headers: {
                ...(localStorage.getItem('authToken') && {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                })
            },
            body: formData,
        });
    
        return handleResponse(response);
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
  
  