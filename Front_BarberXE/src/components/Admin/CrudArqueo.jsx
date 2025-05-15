import React, { useState, useEffect } from "react";
import { DollarSign, Clock } from "lucide-react";
import {
  getHistorial,
  getOpenArqueo,
  createArqueo,
  closeArqueo,
  fetchIngresosByArqueo,
  fetchEgresosByArqueo,
  getArqueoById,
} from "../../services/ArqueoService"; // Cambiado a nuevo nombre de servicio

const fetchEmpleados = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/empleados', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}` 
      }
    });
    if (!response.ok) throw new Error('Error al obtener empleados');
    const empleados = await response.json();
    
    // Filtrar solo cajeros activos (case insensitive)
    return empleados.filter(e => 
      e.cargo.toLowerCase() === 'cajero' && 
      e.estado.toLowerCase() === 'activo'
    );
  } catch (error) {
    console.error("Error fetching empleados:", error);
    return [];
  }
};

function ArqueoDeCaja() {
  // Estados principales
  const [arqueos, setArqueos] = useState([]);
  const [cajeros, setCajeros] = useState([]);
  const [cajeroSeleccionadoId, setCajeroSeleccionadoId] = useState("");
  const [saldoBase, setSaldoBase] = useState("");
  const [saldoFinal, setSaldoFinal] = useState("");
  const [observacion, setObservacion] = useState("");
  const [arqueoActual, setArqueoActual] = useState(null);
  const [ingresos, setIngresos] = useState([]);
  const [egresos, setEgresos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [arqueoSeleccionado, setArqueoSeleccionado] = useState(null);

  // Formatear fecha para mostrar
  const formatDateTime = (dateString) => {
    if (!dateString) return "En curso";
    const date = new Date(dateString);
    if (isNaN(date)) return "Fecha inválida";

    const options = { year: "numeric", month: "long", day: "numeric" };
    const fechaFormateada = date.toLocaleDateString(undefined, options);

    let horas = date.getHours();
    const minutos = date.getMinutes();
    const ampm = horas >= 12 ? "PM" : "AM";
    horas = horas % 12 || 12;
    const minutosStr = minutos < 10 ? "0" + minutos : minutos;

    return `${fechaFormateada}, ${horas}:${minutosStr} ${ampm}`;
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      if (arqueoActual?.idArqueo) {
        try {
          const [arqueoActualizado, nuevosIngresos, nuevosEgresos] = await Promise.all([
            getArqueoById(arqueoActual.idArqueo),
            fetchIngresosByArqueo(arqueoActual.idArqueo),
            fetchEgresosByArqueo(arqueoActual.idArqueo)
          ]);
          
          if (arqueoActualizado.fechaCierre) {
            setArqueoActual(null);
            localStorage.removeItem('currentArqueoId');
          } else {
            setArqueoActual(prev => ({...prev, ...arqueoActualizado}));
            setIngresos(nuevosIngresos);
            setEgresos(nuevosEgresos);
          }
        } catch (error) {
          console.error("Error al actualizar:", error);
        }
      }
    }, 10000); // Actualizar cada 10 segundos

    return () => clearInterval(interval);
  }, [arqueoActual]);

  // Cargar datos iniciales
  useEffect(() => {
    const inicializarDatos = async () => {
      try {
        setLoading(true);
        
        const [cajerosData, historialData] = await Promise.all([
          fetchEmpleados(),
          getHistorial()
        ]);
        
        setCajeros(cajerosData);
        setArqueos(historialData);

        const arqueoGuardadoId = localStorage.getItem('currentArqueoId');
        
        if (arqueoGuardadoId) {
          try {
            const [arqueoData, ingresosData, egresosData] = await Promise.all([
              getArqueoById(arqueoGuardadoId),
              fetchIngresosByArqueo(arqueoGuardadoId),
              fetchEgresosByArqueo(arqueoGuardadoId)
            ]);
            
            if (arqueoData && !arqueoData.fechaCierre) {
              setArqueoActual(arqueoData);
              setIngresos(ingresosData);
              setEgresos(egresosData);
            }
          } catch (error) {
            console.error("Error al cargar arqueo actual:", error);
            localStorage.removeItem('currentArqueoId');
          }
        }
        
      } catch (error) {
        console.error("Error:", error);
        setError("Error al cargar datos iniciales");
      } finally {
        setLoading(false);
      }
    };
    
    inicializarDatos();
  }, []);

  // Cargar movimientos para un arqueo específico
  const cargarMovimientos = async (arqueoId) => {
    if (!arqueoId) return;
    
    try {
      setLoading(true);
      const [ingresosData, egresosData] = await Promise.all([
        fetchIngresosByArqueo(arqueoId),
        fetchEgresosByArqueo(arqueoId)
      ]);
      
      setIngresos(ingresosData);
      setEgresos(egresosData);
      
    } catch (error) {
      console.error("Error cargando movimientos:", error);
      setError("Error al cargar movimientos");
    } finally {
      setLoading(false);
    }
  };

  // Actualizar arqueo seleccionado para ver detalles
  useEffect(() => {
    if (arqueoSeleccionado) {
      cargarMovimientos(arqueoSeleccionado.idArqueo);
    }
  }, [arqueoSeleccionado]);

  // Cálculos para totales
  const calcularTotalIngresos = (ingresos = []) => {
    return ingresos.reduce((total, ing) => total + (Number(ing.monto) || 0), 0);
  };

  const calcularTotalEgresos = (egresos = []) => {
    return egresos.reduce((total, eg) => total + (Number(eg.monto) || 0), 0);
  };

  const calcularSaldoPrevisto = (arqueo) => {
  if (!arqueo) return 0;
  
  // Usar los estados actualizados de ingresos y egresos en lugar de los del arqueo
  const totalIngresos = ingresos.reduce((sum, ing) => sum + (Number(ing.monto) || 0), 0);
  const totalEgresos = egresos.reduce((sum, eg) => sum + (Number(eg.monto) || 0), 0);
  
  return (Number(arqueo.saldoInicial) || 0) + totalIngresos - totalEgresos;
};

  // Handlers
  const handleCajeroChange = (e) => {
    setCajeroSeleccionadoId(e.target.value);
  };

  const abrirArqueo = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      if (!cajeroSeleccionadoId || !saldoBase) {
        throw new Error("Seleccione un cajero e ingrese el saldo base");
      }
  
      const response = await createArqueo({
        empleadoId: Number(cajeroSeleccionadoId),
        saldoInicial: Number(saldoBase)
      });
  
      if (!response.data || !response.data.idArqueo) {
        throw new Error("Error al crear arqueo: la respuesta del servidor no incluyó un ID válido.");
      }
  
      // Actualizar estado
      const nuevoArqueo = response.data;
      setArqueoActual(nuevoArqueo);
      setArqueoSeleccionado(nuevoArqueo);
      localStorage.setItem('currentArqueoId', nuevoArqueo.idArqueo);
      localStorage.setItem('currentEmpleadoIdForArqueo', cajeroSeleccionadoId);
  
      // Recargar historial
      const historialActualizado = await getHistorial();
      setArqueos(historialActualizado);
  
      setSuccess("Arqueo iniciado correctamente");
      setSaldoBase("");
      setTimeout(() => setSuccess(null), 3000);
  
    } catch (error) {
      console.error("Error al abrir arqueo:", error);
      setError(error.message || "Error al abrir arqueo");
    } finally {
      setLoading(false);
    }
  };

  
  const cerrarArqueo = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (!arqueoActual?.idArqueo) {
        throw new Error("No hay arqueo activo");
      }

      // Calcular saldo final automáticamente
      const saldoCalculado = calcularSaldoPrevisto(arqueoActual);
      
      await closeArqueo(arqueoActual.idArqueo, {
        saldoFinal: saldoCalculado, // Usar el cálculo automático
        observacion: observacion || ""
      });

      // Actualizar estados
      const historialActualizado = await getHistorial();
      setArqueos(historialActualizado);
      setArqueoActual(null);
      setIngresos([]);
      setEgresos([]);
      localStorage.removeItem('currentArqueoId');
      
      setSuccess("Arqueo cerrado correctamente");
      setTimeout(() => setSuccess(null), 3000);

    } catch (error) {
      console.error("Error al cerrar arqueo:", error);
      setError(error.message || "Error al cerrar arqueo");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectArqueo = (arqueo) => {
    setArqueoSeleccionado(arqueo.idArqueo === arqueoSeleccionado?.idArqueo ? null : arqueo);
  };

  // Render
  return (
    <div className="min-h-[70vh] bg-gray-50 p-3">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-md">
            {success}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Historial de Arqueos */}
          <div className="w-full lg:w-2/3 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Historial de Arqueos
            </h2>

            {loading && arqueos.length === 0 ? (
              <div className="text-center py-8">Cargando...</div>
            ) : (
              <div className="space-y-4 overflow-y-auto" style={{ maxHeight: "600px" }}>
                {arqueos.map((arqueo) => (
                  <div 
                    key={arqueo.idArqueo} 
                    className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      arqueoSeleccionado?.idArqueo === arqueo.idArqueo ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => handleSelectArqueo(arqueo)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-lg">
                          {arqueo.empleado?.nombre || "Cajero no especificado"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDateTime(arqueo.fechaInicio)} -{" "}
                          {formatDateTime(arqueo.fechaCierre)}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        !arqueo.fechaCierre ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}>
                        {!arqueo.fechaCierre ? "Abierto" : "Cerrado"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-600">Saldo Inicial</p>
                        <p className="font-medium">
                          {arqueo?.saldoInicial != null
                              ? `$${Number(arqueo.saldoInicial).toFixed(2)}`
                              : 'Cargando...'}   
                        </p>
                      </div>

                      {arqueo.fechaCierre && (
                        <>
                          <div>
                            <p className="text-sm text-gray-600">Saldo Final</p>
                            <p className="font-medium">
                              ${Number(arqueo.saldoFinal || 0).toLocaleString()}
                            </p>
                          </div>
                        </>
                      )}
                      
                      {/* Mostrar detalles si el arqueo está seleccionado */}
                      {arqueoSeleccionado?.idArqueo === arqueo.idArqueo && arqueo.fechaCierre && (
                        <>
                          <div>
                            <p className="text-sm text-gray-600">Total Ingresos</p>
                            <p className="font-medium text-green-600">
                              ${calcularTotalIngresos(arqueo.ingresos).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Total Egresos</p>
                            <p className="font-medium text-red-600">
                              ${calcularTotalEgresos(arqueo.egresos).toLocaleString()}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-sm text-gray-600">Observaciones</p>
                            <p className="font-medium">
                              {arqueo.observacion || arqueo.observaciones || "Ninguna"}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {arqueos.length === 0 && !loading && (
                  <p className="text-gray-500 text-center py-8">
                    No hay arqueos registrados
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Panel de control */}
          <div className="w-full lg:w-1/3 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              {arqueoActual ? "Arqueo en Curso" : "Iniciar Arqueo"}
            </h2>
            
            {arqueoActual && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="font-medium">Cajero: {arqueoActual.empleado?.nombre}</p>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <p className="text-sm text-gray-600">Saldo Inicial</p>
                  <p className="font-medium">
                    ${Number(arqueoActual.saldoInicial).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Saldo Actual</p>
                  <p className="font-medium">
                    ${calcularSaldoPrevisto(arqueoActual).toLocaleString()}
                  </p>
                </div>
                
              </div>
            </div>
            )}
            
            {arqueoActual && (
              <div className="mb-6 space-y-4">
                <h3 className="text-lg font-semibold">Movimientos</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="text-green-700 font-medium mb-2">Ingresos</h4>
                    <p className="font-medium text-green-600 text-2xl">
                      ${calcularTotalIngresos(ingresos).toLocaleString()}
                    </p>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="text-red-700 font-medium mb-2">Egresos</h4>
                    <p className="font-medium text-red-600 text-2xl">
                      ${calcularTotalEgresos(egresos).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {!arqueoActual ? (
              <form onSubmit={abrirArqueo} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seleccionar Cajero
                  </label>
                  <select
                    value={cajeroSeleccionadoId}
                    onChange={handleCajeroChange}
                    className="w-full p-2 border rounded-md"
                    required
                    disabled={loading}
                  >
                    <option value="">Seleccionar cajero</option>
                    {cajeros.map((cajero) => (
                      <option key={`cajero-${cajero.idEmpleado}`} value={cajero.idEmpleado}>
                        {cajero.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Saldo Base
                  </label>
                  <input
                    type="number"
                    value={saldoBase}
                    onChange={(e) => setSaldoBase(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    placeholder="0"
                    step="0.01"
                    min="0"
                    required
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? "Procesando..." : "Iniciar Arqueo"}
                </button>
              </form>
            ) : (
              <form onSubmit={cerrarArqueo} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Saldo Final
                  </label>
                  <input
                    type="number"
                    value={saldoFinal}
                    onChange={(e) => setSaldoFinal(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    placeholder="0"
                    step="0.01"
                    min="0"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observaciones
                  </label>
                  <textarea
                    value={observacion}
                    onChange={(e) => setObservacion(e.target.value)}
                    rows={3}
                    className="w-full p-2 border rounded-md"
                    placeholder="Observaciones"
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? "Procesando..." : "Cerrar Arqueo"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ArqueoDeCaja;