const API_BASE_URL = 'http://localhost:3000/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorData = {};
    try {
      errorData = await response.json();
    } catch (e) {
      console.error("Error parsing error response:", e);
    }
    
    const errorMessage = errorData.message || 
                        errorData.error?.message || 
                        `Error ${response.status}: ${response.statusText}`;
    
    throw new Error(errorMessage);
  }
  return response.json();
};

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };

  // Añadir token JWT si está disponible
  const token = localStorage.getItem('authToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

export const decodeToken = () => {
  const token = localStorage.getItem('authToken');
  if (!token) return null;
  
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

export const getCurrentEmpleadoId = () => {
  const payload = decodeToken();
  return payload?.empleadoId || null;
};

// ============= FUNCIONES DE ARQUEOS =============

export const getHistorial = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/arqueos`, {
      method: 'GET',
      headers: getHeaders()
    });

    const data = await handleResponse(response);
  
    // Normalizar respuesta - verificar diferentes estructuras posibles
    let arqueosData;
    
    if (Array.isArray(data)) {
      // Si data es directamente un array
      arqueosData = data;
    } else if (data && data.data && Array.isArray(data.data.data)) {
      // Si data tiene estructura: data.data.data (como en tu caso)
      arqueosData = data.data.data;
    } else if (data && Array.isArray(data.data)) {
      // Si data tiene una propiedad 'data' que es un array
      arqueosData = data.data;
    } else if (data && Array.isArray(data.arqueos)) {
      // Si data tiene una propiedad 'arqueos' que es un array
      arqueosData = data.arqueos;
    } else {
      // Si no encontramos un array válido, retornar array vacío
      console.warn('Respuesta del servidor no contiene un array válido:', data);
      arqueosData = [];
    }

    // Verificar que arqueosData sea un array antes de hacer map
    if (!Array.isArray(arqueosData)) {
      console.error('arqueosData no es un array:', arqueosData);
      return [];
    }



    const arqueosProcessed = arqueosData.map(arqueo => {
      return {
        idArqueo: arqueo.idArqueo || arqueo.id,
        fechaInicio: arqueo.fechaInicio,
        fechaCierre: arqueo.fechaCierre || null,
        saldoInicial: arqueo.saldoInicial ? parseFloat(String(arqueo.saldoInicial)) : 0,
        saldoFinal: arqueo.saldoFinal ? Number(arqueo.saldoFinal) : null,
        observacion: arqueo.observacion || arqueo.observaciones || 'Sin Observacion',
        empleado: {
          idEmpleado: arqueo.empleado?.idEmpleado || arqueo.empleadoId,
          nombre: arqueo.empleado?.nombre || 'Cajero no especificado'
        },
        // Mantén datos originales
        ...arqueo
      };
    });

    return arqueosProcessed;

  } catch (error) {
    console.error('Error en getHistorial:', error);
    return []; // Retornar array vacío en caso de error
  }
};

// CORREGIR LA FUNCIÓN cargarHistorial - ESTABA MAL IMPLEMENTADA
export const cargarHistorial = async () => {
  try {
    const historialData = await getHistorial();
    return historialData; // Retornar los datos en lugar de usar setHistorial (que no existe aquí)
  } catch (error) {
    console.error('Error en cargarHistorial:', error);
    return [];
  }
};

export const getArqueoById = async (id) => {
  try {
    if (!id) {
      throw new Error('ID de arqueo requerido');
    }

  
    
    const response = await fetch(`${API_BASE_URL}/arqueos/${id}`, {
      method: "GET",
      headers: getHeaders()
    });

    const raw = await handleResponse(response);


    const arqueo = raw?.data?.data || raw?.data || raw;

    // Procesar y validar datos
    const arqueoProcessed = {
      idArqueo: arqueo.idArqueo || arqueo.id,
      fechaInicio: arqueo.fechaInicio,
      fechaCierre: arqueo.fechaCierre,
      saldoInicial: arqueo.saldoInicial != null ? parseFloat(arqueo.saldoInicial) : null,
      saldoFinal: arqueo.saldoFinal != null ? parseFloat(arqueo.saldoFinal) : null,
      observaciones: arqueo.observaciones || arqueo.observacion || '',
      empleado: arqueo.empleado || {},
      diferencia: arqueo.diferencia != null ? parseFloat(arqueo.diferencia) : null,
      estado: arqueo.estado || 'abierto'
    };

   

    return arqueoProcessed;

  } catch (error) {
    console.error(`❌ Error al obtener arqueo ${id}:`, error.message);
    throw new Error(`No se pudo obtener el arqueo: ${error.message}`);
  }
};


export const createArqueo = async (arqueoData) => {
  try {
    if (!arqueoData.empleadoId || !arqueoData.saldoInicial) {
      throw new Error("Faltan campos requeridos");
    }

    const body = {
      empleadoId: Number(arqueoData.empleadoId),
      saldoInicial: Number(arqueoData.saldoInicial)
    };
    
  

    const response = await fetch(`${API_BASE_URL}/arqueos`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });

    return handleResponse(response);
  } catch (error) {
    console.error("Error completo:", error);
    
    // Manejo específico de errores de conexión
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error("Error de conexión con el servidor");
    }
    
    throw new Error(`Error al crear arqueo: ${error.message}`);
  }
};

// CORREGIR LA FUNCIÓN closeArqueo - CAMBIAR EL CAMPO DE observaciones A observacion
// ============= FUNCIÓN CORREGIDA PARA CERRAR ARQUEO =============


export const closeArqueo = async (id, { saldoFinal, observacion }) => {
  try {

    
    // Validación básica de parámetros
    if (!id) throw new Error("ID de arqueo es requerido.");
    if (isNaN(saldoFinal)) throw new Error("El saldo final debe ser un número válido.");

    const saldoFinalNum = Number(saldoFinal);
    
    const detallesCierre = await getDetallesCierre(id, saldoFinalNum);
    const { arqueo, resumen } = detallesCierre;

    const saldoCalculadoNum = Number(resumen.saldoCalculado);
    
 

    // Calcular diferencia
    const diferencia = saldoFinalNum - saldoCalculadoNum;
   
    
    // 🚨 VERIFICACIÓN ESPECÍFICA para tu caso
    if (resumen.saldoInicial === 0) {
      console.error("🚨 ERROR: El saldo inicial es 0, esto es incorrecto!");
      console.error("🚨 Revisa la función getArqueoById o el endpoint del backend");
    }
    
    const validacion = validarCierreArqueo(saldoCalculadoNum, saldoFinalNum);

    //... resto del código permanece igual
    
    let observacionFinal = observacion?.trim() || "";
    
    if (validacion.diferenciaAbsoluta > 0) {
      const diferenciaInfo = `Diferencia al cierre: $${Math.abs(diferencia).toLocaleString()} ${
        validacion.requiereAtencion ? "(DIFERENCIA SIGNIFICATIVA)" : "(diferencia menor)"
      }`;
      
      if (observacionFinal && observacionFinal !== "Sin observaciones") {
        observacionFinal = `${observacionFinal} - ${diferenciaInfo}`;
      } else {
        observacionFinal = diferenciaInfo;
      }
    } else {
      if (!observacionFinal || observacionFinal === "Sin observaciones") {
        observacionFinal = "Arqueo cuadrado - Sin diferencias";
      }
    }

    const payload = {
      saldoFinal: saldoFinalNum,
      observacion: observacionFinal
    };



    const response = await fetch(`${API_BASE_URL}/arqueos/${id}/close`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });

    const data = await handleResponse(response);


    // ... resto del código de respuesta
    
    const arqueoData = data.data || data;
    
    const result = {
      success: data.success !== undefined ? data.success : true,
      message: data.message || "Arqueo cerrado exitosamente",
      arqueo: {
        id: arqueoData.id || arqueoData.idArqueo || id,
        fechaInicio: arqueoData.fechaInicio,
        fechaCierre: arqueoData.fechaCierre,
        saldoInicial: resumen.saldoInicial,
        saldoFinal: saldoFinalNum,
        saldoCalculado: saldoCalculadoNum,
        diferencia: diferencia,
        observacion: observacionFinal,
        empleado: arqueoData.empleado || {},
        resumen: {
          ...resumen,
          saldoFinal: saldoFinalNum,
          diferencia: diferencia
        },
        estado: arqueoData.estado || {}
      },
      alertas: {
        hayDiferencia: validacion.diferenciaAbsoluta > 0,
        diferenciaSignificativa: validacion.requiereAtencion,
        dentroDeToleranacia: validacion.dentroDeToleranacia,
        tipoAlerta: validacion.tipoAlerta,
        mensajeAlerta: validacion.mensaje
      }
    };
    return result;

  } catch (error) {
    console.error("❌ Error en closeArqueo:", error);
    throw new Error(error.message || "Ocurrió un error al cerrar el arqueo. Intenta nuevamente.");
  }
};

export const getOpenArqueo = async (empleadoId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/arqueos/empleados/${empleadoId}/abierto`, {
      headers: getHeaders()
    });
    
    if (response.status === 404) {
      return { exists: false, data: null };
    }
    
    const data = await handleResponse(response);
    const arqueoData = data.data || data;
    
    if (arqueoData && (arqueoData.idArqueo || arqueoData.id)) {
      return { 
        exists: true, 
        data: {
          ...arqueoData,
          idArqueo: arqueoData.idArqueo || arqueoData.id,
          empleado: {
            idEmpleado: arqueoData.empleado?.idEmpleado || arqueoData.empleadoId || arqueoData.idEmpleado,
            nombre: arqueoData.empleado?.nombre || 'Cajero no especificado'
          }
        }
      };
    }
      
    return { exists: false, data: null };
  } catch (error) {
    console.error('Error en getOpenArqueo:', error);
    throw error;
  }
};

// ============= FUNCIONES DE INGRESOS =============

export const fetchIngresosByArqueo = async (arqueoId) => {
  try {
   
    
    const response = await fetch(`${API_BASE_URL}/ingresos/arqueo/${arqueoId}`, {
      method: 'GET',
      headers: getHeaders()
    });
    
    if (response.status === 404) {
      return [];
    }
    
    const data = await handleResponse(response);
 
    
    // 🔧 CORRECCIÓN: Normalizar estructura de respuesta
    const ingresos = data.data?.items || data.items || data.data || data || [];
    
    const ingresosNormalizados = Array.isArray(ingresos) ? ingresos.map(ingreso => {
      const ingresoNormalizado = {
        id: ingreso.id || ingreso.idIngreso,
        monto: Number(ingreso.monto) || 0, // 🔧 Asegurar conversión a número
        descripcion: ingreso.descripcion || '',
        medioPago: ingreso.medioPago || 'efectivo',
        fecha: ingreso.fecha || ingreso.createdAt,
        arqueoId: Number(arqueoId)
      };
   
      return ingresoNormalizado;
    }) : [];
    

    return ingresosNormalizados;
    
  } catch (error) {
    console.error('❌ Error en fetchIngresosByArqueo:', error);
    if (error.message.includes('Token')) {
      throw error;
    }
    return [];
  }
};

export const addIngreso = async (ingresoData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ingresos`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        monto: Number(ingresoData.monto),
        descripcion: ingresoData.descripcion.trim(),
        medioPago: ingresoData.medioPago || 'efectivo',
        arqueoId: Number(ingresoData.arqueoId)
      })
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Error en addIngreso:', error);
    throw error;
  }
};

// ============= FUNCIONES DE EGRESOS =============

export const fetchEgresosByArqueo = async (arqueoId) => {
  try {

    
    const response = await fetch(`${API_BASE_URL}/egresos/arqueo/${arqueoId}`, {
      method: 'GET',
      headers: getHeaders()
    });
    
    if (response.status === 404) {
     
      return [];
    }
    
    const data = await handleResponse(response);

    
    // 🔧 CORRECCIÓN: Normalizar estructura de respuesta
    const egresos = data.data?.items || data.items || data.data || data || [];
    
    const egresosNormalizados = Array.isArray(egresos) ? egresos.map(egreso => {
      const egresoNormalizado = {
        id: egreso.id || egreso.idEgreso,
        monto: Number(egreso.monto) || 0, // 🔧 Asegurar conversión a número
        descripcion: egreso.descripcion || '',
        categoria: egreso.categoria || 'otros',
        justificacion: egreso.justificacion || '',
        fecha: egreso.fecha || egreso.createdAt,
        arqueoId: Number(arqueoId)
      };
     
      return egresoNormalizado;
    }) : [];
    
    return egresosNormalizados;
    
  } catch (error) {
    console.error('❌ Error en fetchEgresosByArqueo:', error);
    if (error.message.includes('Token')) {
      throw error;
    }
    return [];
  }
};

export const addEgreso = async (egresoData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/egresos`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        monto: Number(egresoData.monto),
        descripcion: egresoData.descripcion.trim(),
        arqueoId: Number(egresoData.arqueoId),
        categoria: egresoData.categoria || 'otros',
        justificacion: egresoData.justificacion || ''
      })
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Error en addEgreso:', error);
    throw error;
  }
};

export const updateEgreso = async (id, egresoData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/egresos/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({
        monto: Number(egresoData.monto),
        descripcion: egresoData.descripcion?.trim() || '',
        categoria: egresoData.categoria || 'otros',
        justificacion: egresoData.justificacion || ''
      })
    });

    return handleResponse(response);
  } catch (error) {
    console.error('Error en updateEgreso:', error);
    throw error;
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
    
    // Filtrar cajeros activos
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
    return [];
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
    if (error.message.includes('Token')) {
      throw error;
    }
    return [];
  }
};

export const fetchAllEgresos = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/egresos`, {
      method: 'GET',
      headers: getHeaders()
    });
    
    const data = await handleResponse(response);
    return data.data || data || [];
  } catch (error) {
    console.error('Error en fetchAllEgresos:', error);
    if (error.message.includes('Token')) {
      throw error;
    }
    return [];
  }
};

export const deleteIngreso = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ingresos/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (response.status === 204) {
      return {};
    }

    return handleResponse(response);
  } catch (error) {
    console.error('Error en deleteIngreso:', error);
    throw error;
  }
};

export const deleteEgreso = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/egresos/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (response.status === 204) {
      return {};
    }

    return handleResponse(response);
  } catch (error) {
    console.error('Error en deleteEgreso:', error);
    throw error;
  }
};

export const updateIngreso = async (id, ingresoData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/ingresos/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({
        monto: Number(ingresoData.monto),
        descripcion: ingresoData.descripcion?.trim() || '',
        medioPago: ingresoData.medioPago || 'efectivo'
      })
    });
    
    return handleResponse(response);
  } catch (error) {
    console.error('Error en updateIngreso:', error);
    throw error;
  }
};


// ============= FUNCIÓN AUXILIAR PARA VALIDAR CIERRE =============

export const validarCierreArqueo = (saldoCalculado, saldoFinal, tolerancia = 1000) => {
  // Asegurar que los valores sean números
  const saldoFinalNum = Number(saldoFinal);
  const saldoCalculadoNum = Number(saldoCalculado);
  

  
  // Diferencia = Saldo Final - Saldo Calculado
  const diferencia = saldoFinalNum - saldoCalculadoNum;
  const diferenciaAbsoluta = Math.abs(diferencia);
  
  
  
  const resultado = {
    diferencia: Number(diferencia.toFixed(2)),
    diferenciaAbsoluta: Number(diferenciaAbsoluta.toFixed(2)),
    dentroDeToleranacia: diferenciaAbsoluta <= tolerancia,
    requiereAtencion: diferenciaAbsoluta > tolerancia,
    tipoAlerta: diferenciaAbsoluta > tolerancia ? 'error' : 
               diferenciaAbsoluta > 0 ? 'warning' : 'success',
    mensaje: diferenciaAbsoluta > tolerancia 
      ? `Diferencia significativa de $${diferencia.toFixed(2)} - Requiere justificación`
      : diferenciaAbsoluta > 0 
        ? `Diferencia menor de $${diferencia.toFixed(2)} - Dentro de tolerancia`
        : 'Arqueo cuadrado perfectamente'
  };
  
 
  return resultado;
};

// ============= FUNCIÓN PARA OBTENER DETALLES DE CIERRE =============

export const getDetallesCierre = async (arqueoId, saldoFinal = null) => {
  try {
 
    
    const [arqueo, ingresos, egresos] = await Promise.all([
      getArqueoById(arqueoId),
      fetchIngresosByArqueo(arqueoId),
      fetchEgresosByArqueo(arqueoId)
    ]);
    
   
    // Calcular totales correctamente
    const totalIngresos = ingresos.reduce((sum, ingreso) => {
      const monto = Number(ingreso.monto) || 0;
      return sum + monto;
    }, 0);
    
    const totalEgresos = egresos.reduce((sum, egreso) => {
      const monto = Number(egreso.monto) || 0;
      return sum + monto;
    }, 0);
    
    // 🔧 CORRECCIÓN CRÍTICA: Asegurar que el saldo inicial sea un número válido
    const saldoInicial = Number(arqueo.saldoInicial) || 0;
    
    // 🚨 ALERTA si el saldo inicial es 0 cuando no debería serlo
    if (saldoInicial === 0 && arqueo.saldoInicial !== 0 && arqueo.saldoInicial !== '0') {
      console.warn("⚠️ ADVERTENCIA: El saldo inicial es 0, esto podría ser un error de parseo");
      console.warn("⚠️ Valor original:", arqueo.saldoInicial);
    }
    
    const saldoCalculado = saldoInicial + totalIngresos - totalEgresos;
    
    // Calcular diferencia solo si se proporciona saldoFinal
    let diferencia = null;
    if (saldoFinal !== null && saldoFinal !== undefined) {
      const saldoFinalNum = Number(saldoFinal);
      diferencia = saldoFinalNum - saldoCalculado;
     
    }
    

    if (diferencia !== null) {
      
    }
    
    const resultado = {
      arqueo,
      ingresos,
      egresos,
      resumen: {
        saldoInicial,
        totalIngresos,
        totalEgresos,
        saldoCalculado,
        ...(diferencia !== null && { diferencia }),
        cantidadMovimientos: ingresos.length + egresos.length
      }
    };
    

    return resultado;
    
  } catch (error) {
    console.error('❌ Error al obtener detalles del cierre:', error);
    throw error;
  }
};
