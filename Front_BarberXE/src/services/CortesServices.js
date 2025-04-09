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
        const headers = {};
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
    
    export const createCut = async (formData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/cortes`, {
                method: 'POST',
                headers: {
                    // No incluyas 'Content-Type' para FormData
                    ...(localStorage.getItem('authToken') && {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    })
                },
                body: formData
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al crear corte');
            }
    
            const result = await response.json();
            // Asegurar que la URL de la imagen sea completa
            if (result.imagenUrl) {
                result.imagenUrl = `http://localhost:3000${result.imagenUrl}`;
            }
            return result;
        } catch (error) {
            console.error("Error en createCut:", error);
            throw error;
        }
    };

    export const updateCut = async (id, formData) => {
        try {
            const response = await fetch(`${API_BASE_URL}/cortes/${id}`, {
                method: 'PUT',
                headers: {
                    // No incluir 'Content-Type' para FormData, el navegador lo hará automáticamente
                    ...(localStorage.getItem('authToken') && {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    })
                },
                body: formData,
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al actualizar corte');
            }
    
            return await response.json();
        } catch (error) {
            console.error('Error en updateCut:', error);
            throw new Error(error.message || 'Error de conexión al actualizar corte');
        }
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