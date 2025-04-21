import React, { useState, useEffect } from "react";
import { DollarSign, Clock, Trash2 } from "lucide-react";
import {
  fetchEmpleados,
  getHistorial,
  getArqueoById,
  createArqueo,
  closeArqueo,
  fetchIngresosByArqueo,
  fetchEgresosByArqueo,
  deleteIngreso,
  deleteEgreso,
} from "../../services/ArqueoService";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    const cargarDatosIniciales = async () => {
      try {
        setLoading(true);
        
        // 1. Cargar datos básicos
        await obtenerCajeros();
        await obtenerHistorialArqueos();
        
        // 2. Verificar si hay arqueo abierto en localStorage
        const arqueoLocal = localStorage.getItem('arqueoAbierto');
        if (arqueoLocal) {
          const arqueo = JSON.parse(arqueoLocal);
          
          // 3. Verificar con el backend que sigue abierto
          try {
            const arqueoBackend = await getArqueoById(arqueo.idArqueo);
            if (arqueoBackend && !arqueoBackend.fechaCierre) {
              setArqueoActual({
                ...arqueoBackend,
                empleado: arqueo.empleado // Mantener datos de relación
              });
              return;
            }
          } catch (e) {
            console.log("Error verificando arqueo en backend:", e);
          }
          
          // Si no es válido, limpiar
          localStorage.removeItem('arqueoAbierto');
        }
        
      } catch (error) {
        console.error("Error al cargar datos:", error);
        setError("Error al cargar datos iniciales");
      } finally {
        setLoading(false);
      }
    };
    
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (arqueoActual?.idArqueo) {
      const cargarDatosArqueo = async () => {
        try {
          setLoading(true);
          const [ingresosData, egresosData] = await Promise.all([
            fetchIngresosByArqueo(arqueoActual.idArqueo),
            fetchEgresosByArqueo(arqueoActual.idArqueo),
          ]);

          setIngresos(ingresosData || []);
          setEgresos(egresosData || []);
        } catch (error) {
          console.error("Error cargando movimientos:", error);
        } finally {
          setLoading(false);
        }
      };

      cargarDatosArqueo();
    }
  }, [arqueoActual]);

  // Métodos para obtener datos
  const obtenerCajeros = async () => {
    try {
      const data = await fetchEmpleados();
      setCajeros(data);
    } catch (error) {
      console.error("Error al obtener cajeros:", error);
      setError(error.message || "Error al obtener cajeros");
    }
  };

  const obtenerHistorialArqueos = async () => {
    try {
      const response = await getHistorial();
      setArqueos(response);
    } catch (err) {
      console.error("Error obteniendo historial:", err);
      setError(err.message || "Error al cargar arqueos");
    }
  };

  const obtenerIngresos = async () => {
    try {
      const response = await fetchIngresosByArqueo(arqueoActual.id);
      setIngresos(response);
    } catch (error) {
      console.error("Error al obtener ingresos:", error);
      setError("Error al cargar ingresos");
    }
  };

  const obtenerEgresos = async () => {
    try {
      const response = await fetchEgresosByArqueo(arqueoActual.id);
      setEgresos(response);
    } catch (error) {
      console.error("Error al obtener egresos:", error);
      setError("Error al cargar egresos");
    }
  };

  // Cálculos
  const calcularTotalIngresos = () => {
    return ingresos.reduce((total, ing) => total + parseFloat(ing.monto), 0);
  };

  const calcularTotalEgresos = () => {
    return egresos.reduce((total, eg) => total + parseFloat(eg.monto), 0);
  };

  const calcularSaldoPrevisto = () => {
    if (!arqueoActual) return 0;
    return (
      parseFloat(arqueoActual.saldoBase) +
      calcularTotalIngresos() -
      calcularTotalEgresos()
    );
  };

  // Handlers
  const handleCajeroChange = (e) => {
    setCajeroSeleccionadoId(e.target.value);
  };

  const abrirArqueo = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const datosArqueo = {
        empleadoId: Number(cajeroSeleccionadoId),
        saldoBase: Number(saldoBase),
        fechaInicio: new Date().toISOString()
      };
  
      const arqueoCreado = await createArqueo(datosArqueo);
      
      // Guardar en estado Y en localStorage
      setArqueoActual({
        ...arqueoCreado,
        empleado: cajeros.find(c => c.idEmpleado === Number(cajeroSeleccionadoId))
      });
      localStorage.setItem('arqueoAbierto', JSON.stringify(arqueoCreado));
      
      setCajeroSeleccionadoId("");
      setSaldoBase("");
      
    } catch (error) {
      console.error("Error al abrir arqueo:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const cerrarArqueo = async (e) => {
    e.preventDefault();
    
    if (!arqueoActual?.idArqueo) {
      setError("No hay arqueo activo para cerrar");
      return;
    }
  
    try {
      setLoading(true);
      
      // Asegúrate que los datos incluyan la observación
      const datosCierre = {
        saldoFinal: Number(saldoFinal),
        observacion: observacion || "Sin observaciones", // Valor por defecto
        fechaCierre: new Date().toISOString()
      };
  
      console.log("Datos a enviar:", datosCierre); // Para depuración
      
      const arqueoCerrado = await closeArqueo(arqueoActual.idArqueo, datosCierre);
      console.log("Respuesta del cierre:", arqueoCerrado); // Verifica que incluya la observación
      
      // Actualizar el estado con la respuesta del servidor
      setArqueos(prev => [arqueoCerrado, ...prev.filter(a => a.idArqueo !== arqueoCerrado.idArqueo)]);
      setArqueoActual(null);
      setSaldoFinal("");
      setObservacion("");
      
    } catch (error) {
      console.error("Error completo:", error); // Depuración detallada
      setError(error.message || "Error al cerrar arqueo");
    } finally {
      setLoading(false);
    }
  };

  // Eliminar ingresos/egresos
  const handleDeleteIngreso = async (id) => {
    try {
      await deleteIngreso(id);
      await obtenerIngresos();
    } catch (error) {
      console.error("Error al eliminar ingreso:", error);
      setError("Error al eliminar ingreso");
    }
  };

  const handleDeleteEgreso = async (id) => {
    try {
      await deleteEgreso(id);
      await obtenerEgresos();
    } catch (error) {
      console.error("Error al eliminar egreso:", error);
      setError("Error al eliminar egreso");
    }
  };

  // Render
  return (
    <div className="min-h-[70vh] bg-white-100 p-3">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="flex gap-8">
          {/* Historial de Arqueos */}
          <div className="w-[70%] bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Historial de Arqueos
            </h2>

            {loading ? (
              <div className="text-center py-8">Cargando...</div>
            ) : (
              <div
                className="space-y-4 overflow-y-auto"
                style={{ maxHeight: "350px" }}
              >
                {arqueos.map((arqueo) => (
                  <div
                    key={arqueo.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
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
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          !arqueo.fechaCierre
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {!arqueo.fechaCierre ? "Abierto" : "Cerrado"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-600">Saldo Inicial</p>
                        <p className="font-medium">
                          ${arqueo.saldoBase?.toLocaleString() || "0"}
                        </p>
                      </div>

                      {arqueo.fechaCierre && (
                        <>
                          <div>
                            <p className="text-sm text-gray-600">Saldo Final</p>
                            <p className="font-medium">
                              ${arqueo.saldoFinal?.toLocaleString() || "0"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Diferencia</p>
                            <p
                              className={`font-medium ${
                                arqueo.saldoFinal -
                                  (arqueo.saldoBase +
                                    calcularTotalIngresos() -
                                    calcularTotalEgresos()) <
                                0
                                  ? "text-red-600"
                                  : "text-green-600"
                              }`}
                            >
                              $
                              {(
                                arqueo.saldoFinal -
                                (arqueo.saldoBase +
                                  calcularTotalIngresos() -
                                  calcularTotalEgresos())
                              ).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              Total Ingresos
                            </p>
                            <p className="font-medium text-green-600">
                              ${calcularTotalIngresos().toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              Total Egresos
                            </p>
                            <p className="font-medium text-red-600">
                              ${calcularTotalEgresos().toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              Observaciones
                            </p>
                            <p className="font-medium">
                              {arqueo.observacion || "Ninguna"}
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
          <div className="w-[30%] bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              {arqueoActual ? "Cerrar Arqueo" : "Iniciar Arqueo"}
            </h2>

            {!arqueoActual ? (
              <form onSubmit={abrirArqueo} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seleccionar Cajero
                  </label>
                  <select
                    value={cajeroSeleccionadoId}
                    onChange={(e) => setCajeroSeleccionadoId(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    required
                    disabled={loading}
                  >
                    <option value="">Seleccionar cajero</option>
                    {cajeros.map((cajero) => (
                      <option
                        key={`cajero-${cajero.idEmpleado}`} // Key más explícita
                        value={cajero.idEmpleado}
                      >
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
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                  className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? "Procesando..." : "Iniciar Arqueo"}
                </button>
              </form>
            ) : (
              <>
                <form onSubmit={cerrarArqueo} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Saldo Inicial</p>
                      <p className="font-medium">
                        ${arqueoActual.saldoBase?.toLocaleString() || "0"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Saldo Previsto</p>
                      <p className="font-medium">
                        ${calcularSaldoPrevisto().toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Ingresos</p>
                      <p className="font-medium text-green-600">
                        ${calcularTotalIngresos().toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Egresos</p>
                      <p className="font-medium text-red-600">
                        ${calcularTotalEgresos().toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Saldo Final
                    </label>
                    <input
                      type="number"
                      value={saldoFinal}
                      onChange={(e) => setSaldoFinal(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Observaciones"
                      disabled={loading}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {loading ? "Procesando..." : "Cerrar Arqueo"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ArqueoDeCaja;
