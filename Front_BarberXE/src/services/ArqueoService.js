const API_BASE_URL = 'http://localhost:3000/api';

// Manejo centralizado de respuestas
const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = `Error ${response.status}: ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (parseError) {
      console.warn('No se pudo parsear el error del servidor');
    }
    
    throw new Error(errorMessage);
  }
  
  const data = await response.json();
  return data;
};

// Headers centralizados con autenticación
const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// ============= FUNCIONES DE ARQUEOS =============

export const getHistorial = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/arqueos`, {
      method: 'GET',
      headers: getHeaders()
    });

    const data = await handleResponse(response);
    
    // Normalizar respuesta - puede venir como data.data o directamente
    const arqueosData = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];

    // Mapeo seguro con valores por defecto
    return arqueosData.map(arqueo => ({
       empleado: {
        idEmpleado: arqueo.empleado?.idEmpleado || arqueo.idEmpleado || 0,
        nombre: arqueo.empleado?.nombre || 'Cajero no especificado'
      },
      fechaInicio: arqueo.fechaInicio || new Date().toISOString(),
      fechaCierre: arqueo.fechaCierre || null,
      saldoInicial: Number(arqueo.saldoInicial) || 0,
      saldoFinal: arqueo.saldoFinal ? Number(arqueo.saldoFinal) : null,
      observacion: arqueo.observacion || arqueo.observaciones || '',

      // Incluir arrays vacíos por defecto
      ingresos: Array.isArray(arqueo.ingresos) ? arqueo.ingresos : [],
      egresos: Array.isArray(arqueo.egresos) ? arqueo.egresos : []
    }));
  } catch (error) {
    console.error("Error en getHistorial:", error);
    throw new Error(`No se pudo obtener el historial: ${error.message}`);
  }
};

export const cargarHistorial = async () => {
  try {
    const response = await getArqueoById(); // Llama al endpoint GET /api/arqueos
    if (response.data) {
      setHistorial(response.data); // Actualiza el estado con los datos
    }
  } catch (error) {
    console.error("Error al cargar historial:", error);
  }
};

export const getArqueoById = async (id) => {
  if (!id || isNaN(Number(id))) {
    throw new Error('ID de arqueo inválido');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/arqueos/${id}`, {
      method: 'GET',
      headers: getHeaders()
    });
    
    const data = await handleResponse(response);
    
    // Normalizar datos del arqueo
    const arqueo = data.data || data;
    return {
      idArqueo: arqueo.idArqueo || arqueo.id,
      fechaInicio: arqueo.fechaInicio,
      fechaCierre: arqueo.fechaCierre || null,
      saldoInicial: Number(arqueo.saldoInicial) || 0,
      saldoFinal: arqueo.saldoFinal ? Number(arqueo.saldoFinal) : null,
      observacion: arqueo.observacion || arqueo.observaciones || '',
      empleado: {
        idEmpleado: arqueo.empleado?.idEmpleado || arqueo.empleadoId,
        nombre: arqueo.empleado?.nombre || 'Cajero no especificado'
      }
    };
  } catch (error) {
    console.error('Error en getArqueoById:', error);
    throw new Error(`No se pudo obtener el arqueo: ${error.message}`);
  }
};

export const createArqueo = async (arqueoData) => {
  try {
    // Validación adicional
    if (!arqueoData.empleadoId || !arqueoData.saldoInicial) {
      throw new Error("Faltan campos requeridos");
    }

    const body = {
      empleadoId: Number(arqueoData.empleadoId),
      saldoInicial: Number(arqueoData.saldoInicial),
      fechaInicio: new Date().toISOString()
    };
    
    console.log("Enviando al servidor:", JSON.stringify(body));

    const response = await fetch(`${API_BASE_URL}/arqueos`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("Detalle del error:", data);
      
      // Manejo de errores más específico
      let errorMessage = "Error en la creación";
      if (data.message) {
        errorMessage = data.message;
      } else if (data.error) {
        errorMessage = data.error;
      } else if (data.data?.message) {
        errorMessage = data.data.message;
      }
      
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error("Error completo:", error);
    
    // Si es un error de red o parsing, manejarlo apropiadamente
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error("Error de conexión con el servidor");
    }
    
    throw new Error(`Error al crear arqueo: ${error.message}`);
  }
};

export const closeArqueo = async (id, { saldoFinal, observacion }) => {
  if (!id || isNaN(Number(id))) {
    throw new Error('ID de arqueo inválido');
  }

  const saldoFinalNum = Number(saldoFinal);
  if (isNaN(saldoFinalNum) || saldoFinalNum < 0) {
    throw new Error('Saldo final inválido');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/arqueos/${id}/close`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        saldoFinal: saldoFinalNum,
        observaciones: observacion || "Sin observaciones"
      })
    });
    
    const data = await handleResponse(response);
    return data.data || data;
  } catch (error) {
    console.error("Error en closeArqueo:", error);
    throw new Error(`No se pudo cerrar el arqueo: ${error.message}`);
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
// ============= FUNCIONES DE INGRESOS =============

export const fetchIngresosByArqueo = async (arqueoId) => {
  if (!arqueoId || isNaN(Number(arqueoId))) {
    console.warn('ID de arqueo inválido para ingresos');
    return [];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/arqueos/${arqueoId}/ingresos`, {
      method: 'GET',
      headers: getHeaders()
    });
    
    // Si no hay ingresos, devolver array vacío
    if (response.status === 404) {
      return [];
    }
    
    const data = await handleResponse(response);
    
    // Normalizar estructura de respuesta
    const ingresos = data.data?.items || data.items || data.data || data || [];
    
    return Array.isArray(ingresos) ? ingresos.map(ingreso => ({
      id: ingreso.id || ingreso.idIngreso,
      monto: Number(ingreso.monto) || 0,
      descripcion: ingreso.descripcion || '',
      medioPago: ingreso.medioPago || 'efectivo',
      fecha: ingreso.fecha || ingreso.createdAt,
      arqueoId: Number(arqueoId)
    })) : [];
  } catch (error) {
    console.error('Error en fetchIngresosByArqueo:', error);
    return []; // Siempre devolver array para evitar errores en el componente
  }
};

export const addIngreso = async (ingresoData) => {
  // Validación
  if (!ingresoData.arqueoId || !ingresoData.monto || !ingresoData.descripcion) {
    throw new Error("Datos de ingreso incompletos");
  }

  const monto = Number(ingresoData.monto);
  if (isNaN(monto) || monto <= 0) {
    throw new Error("Monto inválido");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/arqueos/${ingresoData.arqueoId}/ingresos`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        monto: monto,
        descripcion: ingresoData.descripcion.trim(),
        medioPago: ingresoData.medioPago || 'efectivo',
        arqueoId: Number(ingresoData.arqueoId)
      })
    });

    const data = await handleResponse(response);
    return data.data || data;
  } catch (error) {
    console.error('Error en addIngreso:', error);
    throw new Error(`No se pudo agregar el ingreso: ${error.message}`);
  }
};

// ============= FUNCIONES DE EGRESOS =============

export const fetchEgresosByArqueo = async (arqueoId) => {
  if (!arqueoId || isNaN(Number(arqueoId))) {
    console.warn('ID de arqueo inválido para egresos');
    return [];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/arqueos/${arqueoId}/egresos`, {
      method: 'GET',
      headers: getHeaders()
    });
    
    // Si no hay egresos, devolver array vacío
    if (response.status === 404) {
      return [];
    }
    
    const data = await handleResponse(response);
    
    // Normalizar estructura de respuesta
    const egresos = data.data?.items || data.items || data.data || data || [];
    
    return Array.isArray(egresos) ? egresos.map(egreso => ({
      id: egreso.id || egreso.idEgreso,
      monto: Number(egreso.monto) || 0,
      descripcion: egreso.descripcion || '',
      categoria: egreso.categoria || 'otros',
      justificacion: egreso.justificacion || '',
      fecha: egreso.fecha || egreso.createdAt,
      arqueoId: Number(arqueoId)
    })) : [];
  } catch (error) {
    console.error('Error en fetchEgresosByArqueo:', error);
    return []; // Siempre devolver array
  }
};

export const addEgreso = async (egresoData) => {
  // Validación
  if (!egresoData.arqueoId || !egresoData.monto || !egresoData.descripcion) {
    throw new Error("Datos de egreso incompletos");
  }

  const monto = Number(egresoData.monto);
  if (isNaN(monto) || monto <= 0) {
    throw new Error("Monto inválido");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/egresos`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        monto: monto,
        descripcion: egresoData.descripcion.trim(),
        arqueoId: Number(egresoData.arqueoId),
        categoria: egresoData.categoria || 'otros',
        justificacion: egresoData.justificacion || ''
      })
    });

    const data = await handleResponse(response);
    return data.data || data;
  } catch (error) {
    console.error('Error en addEgreso:', error);
    throw new Error(`No se pudo agregar el egreso: ${error.message}`);
  }
};

export const updateEgreso = async (id, egresoData) => {
  if (!id || isNaN(Number(id))) {
    throw new Error('ID de egreso inválido');
  }

  const monto = Number(egresoData.monto);
  if (isNaN(monto) || monto <= 0) {
    throw new Error("Monto inválido");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/egresos/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({
        monto: monto,
        descripcion: egresoData.descripcion?.trim() || '',
        categoria: egresoData.categoria || 'otros',
        justificacion: egresoData.justificacion || ''
      })
    });

    const data = await handleResponse(response);
    return data.data || data;
  } catch (error) {
    console.error('Error en updateEgreso:', error);
    throw new Error(`No se pudo actualizar el egreso: ${error.message}`);
  }
};

// ============= FUNCIONES DE EMPLEADOS =============

export const fetchEmpleados = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/empleados`, {
      method: 'GET',
      headers: getHeaders()
    });
    
    const data = await handleResponse(response);
    
    // Normalizar respuesta
    const empleados = data.data || data || [];
    
    if (!Array.isArray(empleados)) {
      throw new Error('Respuesta de empleados no es un array válido');
    }
    
    // Filtrar cajeros activos con validación case-insensitive
    return empleados.filter(empleado => 
      empleado && 
      empleado.cargo && 
      empleado.estado &&
      empleado.cargo.toLowerCase().trim() === 'cajero' && 
      empleado.estado.toLowerCase().trim() === 'activo'
    ).map(empleado => ({
      idEmpleado: empleado.idEmpleado || empleado.id,
      nombre: empleado.nombre || 'Sin nombre',
      cargo: empleado.cargo,
      estado: empleado.estado
    }));
  } catch (error) {
    console.error('Error en fetchEmpleados:', error);
    throw new Error(`Error al obtener cajeros: ${error.message}`);
  }
};

// ============= FUNCIONES AUXILIARES =============

export const fetchAllIngresos = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/ingresos`, {
      method: 'GET',
      headers: getHeaders()
    });
    
    const data = await handleResponse(response);
    return data.data || data || [];
  } catch (error) {
    console.error('Error en fetchAllIngresos:', error);
    throw new Error(`Error al obtener todos los ingresos: ${error.message}`);
  }
};

export const fetchAllegresos = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/egresos`, {
      method: 'GET',
      headers: getHeaders()
    });
    
    const data = await handleResponse(response);
    return data.data || data || [];
  } catch (error) {
    console.error('Error en fetchAllEgresos:', error);
    throw new Error(`Error al obtener todos los egresos: ${error.message}`);
  }
};

export const deleteIngreso = async (id) => {
  const response = await fetch(`${API_BASE_URL}/ingresos/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (response.status === 204) {
    return {};
  }

  return handleResponse(response);
};

export const deleteEgreso = async (id) => {
  const response = await fetch(`${API_BASE_URL}/egresos/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (response.status === 204) {
    return {};
  }

  return handleResponse(response);
};

export const updateIngreso = async (id, egresoData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ingresos/${id}`, {
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