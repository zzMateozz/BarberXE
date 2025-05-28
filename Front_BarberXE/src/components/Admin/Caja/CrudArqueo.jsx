import { useState, useEffect } from "react"
import {
  DollarSign,
  Clock,
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  FileText,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  X,
} from "lucide-react"
import {
  getHistorial,
  cargarHistorial,
  createArqueo,
  closeArqueo,
  fetchIngresosByArqueo,
  fetchEgresosByArqueo,
  getArqueoById,
  fetchEmpleados,
  getOpenArqueo,
} from "../../../services/ArqueoService"

function ArqueoDeCaja() {
  // Estados principales
  const [arqueos, setArqueos] = useState([])
  const [cajeros, setCajeros] = useState([])
  const [cajeroSeleccionadoId, setCajeroSeleccionadoId] = useState("")
  const [saldoBase, setSaldoBase] = useState("")
  const [saldoFinal, setSaldoFinal] = useState("")
  const [observacion, setObservacion] = useState("")
  const [historial, setHistorial] = useState([]); // Inicializa como array vacío
  const [arqueoActual, setArqueoActual] = useState(null)
  const [ingresos, setIngresos] = useState([])
  const [egresos, setEgresos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [arqueoSeleccionado, setArqueoSeleccionado] = useState(null)
  const [actualizando, setActualizando] = useState(false)

  // Formatear fecha para mostrar
  const formatDateTime = (dateString) => {
    if (!dateString) return "En curso"

    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "Fecha inválida"

      const options = {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: 'America/Mexico_City'
      }
      const fechaFormateada = date.toLocaleDateString('es-ES', options)

      let horas = date.getHours()
      const minutos = date.getMinutes()
      const ampm = horas >= 12 ? "PM" : "AM"
      horas = horas % 12 || 12
      const minutosStr = minutos < 10 ? "0" + minutos : minutos

      return `${fechaFormateada}, ${horas}:${minutosStr} ${ampm}`
    } catch (error) {
      console.error('Error formateando fecha:', error)
      return "Fecha inválida"
    }
  }

  // Limpiar mensajes después de un tiempo
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // Función para cargar movimientos de un arqueo
  const cargarMovimientosArqueo = async (arqueoId) => {
    if (!arqueoId) {
      setIngresos([])
      setEgresos([])
      return
    }

    try {
      const [ingresosData, egresosData] = await Promise.all([
        fetchIngresosByArqueo(arqueoId),
        fetchEgresosByArqueo(arqueoId),
      ])

      setIngresos(ingresosData || [])
      setEgresos(egresosData || [])
    } catch (error) {
      console.error("Error cargando movimientos:", error)
      setIngresos([])
      setEgresos([])
    }
  }

  // Función para verificar si un empleado tiene arqueo abierto
  const verificarArqueoAbierto = async (empleadoId) => {
    try {
      const result = await getOpenArqueo(empleadoId)
      return result
    } catch (error) {
      console.error("Error verificando arqueo abierto:", error)
      return { exists: false, data: null }
    }
  }

  // Actualización automática del arqueo activo
  useEffect(() => {
    if (!arqueoActual?.idArqueo) return

    const interval = setInterval(async () => {
      try {
        setActualizando(true)

        const arqueoActualizado = await getArqueoById(arqueoActual.idArqueo)

        // Si el arqueo fue cerrado externamente
        if (arqueoActualizado.fechaCierre) {
          setArqueoActual(null)
          setIngresos([])
          setEgresos([])
          if (typeof window !== 'undefined') {
            localStorage.removeItem("currentArqueoId")
          }
          setSuccess("El arqueo ha sido cerrado")

          // Actualizar historial
          const historialActualizado = await getHistorial()
          setArqueos(historialActualizado)
        } else {
          // Actualizar datos del arqueo activo
          setArqueoActual(prev => ({ ...prev, ...arqueoActualizado }))
          // Cargar movimientos actualizados
          await cargarMovimientosArqueo(arqueoActualizado.idArqueo)
        }
      } catch (error) {
        console.error("Error en actualización automática:", error)
      } finally {
        setActualizando(false)
      }
    }, 15000) // Actualizar cada 15 segundos

    return () => clearInterval(interval)
  }, [arqueoActual?.idArqueo])

  // Inicialización de datos mejorada
  useEffect(() => {
    const inicializarDatos = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log("Iniciando carga de datos...")

        // Cargar cajeros primero
        const cajerosData = await fetchEmpleados().catch(error => {
          console.error('Error cargando cajeros:', error)
          return []
        })
        setCajeros(cajerosData)
        console.log("Cajeros cargados:", cajerosData)

        // Cargar historial
        const historialData = await getHistorial().catch(error => {
          console.error('Error cargando historial:', error)
          return []
        })
        setArqueos(historialData)
        console.log("Historial cargado:", historialData)

        // Buscar arqueos abiertos en el historial
        const arqueoAbiertoEnHistorial = historialData.find(arqueo => !arqueo.fechaCierre)

        // Verificar si hay un arqueo activo guardado en localStorage
        let arqueoActivo = null

        if (typeof window !== 'undefined') {
          const savedArqueoId = localStorage.getItem("currentArqueoId")

          if (savedArqueoId && !isNaN(Number(savedArqueoId))) {
            try {
              const arqueoGuardado = await getArqueoById(savedArqueoId)

              // Solo restaurar si no está cerrado
              if (!arqueoGuardado.fechaCierre) {
                arqueoActivo = arqueoGuardado
                console.log("Arqueo activo restaurado desde localStorage:", arqueoGuardado)
              } else {
                localStorage.removeItem("currentArqueoId")
                console.log("Arqueo guardado ya estaba cerrado, removido del localStorage")
              }
            } catch (error) {
              console.warn('No se pudo restaurar el arqueo guardado:', error)
              localStorage.removeItem("currentArqueoId")
            }
          }
        }

        // Si no hay arqueo en localStorage pero sí en el historial, usar ese
        if (!arqueoActivo && arqueoAbiertoEnHistorial) {
          arqueoActivo = arqueoAbiertoEnHistorial
          console.log("Usando arqueo abierto del historial:", arqueoAbiertoEnHistorial)

          // Guardar en localStorage para futuras sesiones
          if (typeof window !== 'undefined') {
            localStorage.setItem("currentArqueoId", arqueoAbiertoEnHistorial.idArqueo.toString())
          }
        }

        // Si encontramos un arqueo activo, establecerlo y cargar sus movimientos
        if (arqueoActivo) {
          setArqueoActual(arqueoActivo)
          await cargarMovimientosArqueo(arqueoActivo.idArqueo)
        }

      } catch (error) {
        console.error("Error en inicialización:", error)
        setError(`Error al inicializar: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    inicializarDatos()
  }, [])

  // Cargar movimientos para arqueo seleccionado en el historial
  useEffect(() => {
    if (arqueoSeleccionado && arqueoSeleccionado.idArqueo !== arqueoActual?.idArqueo) {
      cargarMovimientosArqueo(arqueoSeleccionado.idArqueo)
    }
  }, [arqueoSeleccionado, arqueoActual])

  // Cálculos para totales
  const calcularTotalIngresos = (ingresosData = ingresos) => {
    return ingresosData.reduce((total, ing) => total + (Number(ing.monto) || 0), 0)
  }

  const calcularTotalEgresos = (egresosData = egresos) => {
    return egresosData.reduce((total, eg) => total + (Number(eg.monto) || 0), 0)
  }

  const calcularSaldoPrevisto = (arqueo = arqueoActual) => {
    if (!arqueo) return 0

    const totalIngresos = calcularTotalIngresos()
    const totalEgresos = calcularTotalEgresos()
    const saldoInicial = Number(arqueo.saldoInicial) || 0

    return saldoInicial + totalIngresos - totalEgresos
  }

  // Handlers
  const handleCajeroChange = async (e) => {
    const empleadoId = e.target.value;
    setCajeroSeleccionadoId(empleadoId);

    // Verificar si el valor es válido antes de continuar
    if (!empleadoId || isNaN(Number(empleadoId))) {
      return; // No mostrar error aquí, es normal cuando se deselecciona
    }

    try {
      const result = await verificarArqueoAbierto(empleadoId);

      if (result.exists && result.data) {
        // Validar que el arqueo tiene ID
        if (!result.data.idArqueo && !result.data.id) {
          throw new Error("El arqueo no tiene un ID válido");
        }

        const arqueoId = result.data.idArqueo || result.data.id;
        setArqueoActual(result.data);
        await cargarMovimientosArqueo(arqueoId);

        // Guardar en localStorage con verificación
        if (typeof window !== 'undefined') {
          localStorage.setItem("currentArqueoId", arqueoId.toString());
        }

        setSuccess(`Arqueo existente #${arqueoId} cargado`);
      }
    } catch (error) {
      console.error("Error verificando arqueo:", error);
      setError(error.message || "Error al verificar arqueo abierto");
    }
  };

  const abrirArqueo = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      // Validación mejorada
      const empleadoId = Number(cajeroSeleccionadoId);
      const saldoInicial = Number(saldoBase.replace(/,/g, ''));

      if (isNaN(empleadoId) || empleadoId <= 0) {
        throw new Error("Seleccione un cajero válido");
      }

      if (isNaN(saldoInicial) || saldoInicial < 0) {
        throw new Error("El saldo debe ser un número positivo");
      }

      // Verificar nuevamente si hay arqueo abierto antes de crear uno nuevo
      const verificacion = await verificarArqueoAbierto(empleadoId)
      if (verificacion.exists) {
        // En lugar de mostrar error, usar el arqueo existente
        setArqueoActual(verificacion.data)
        await cargarMovimientosArqueo(verificacion.data.idArqueo)

        if (typeof window !== 'undefined') {
          localStorage.setItem("currentArqueoId", (result.data.idArqueo || "").toString());
        }

        setSuccess(`Se ha restaurado el arqueo existente #${verificacion.data.idArqueo}`)

        // Limpiar formulario
        setCajeroSeleccionadoId("");
        setSaldoBase("");

        return;
      }

      console.log("Datos a enviar:", { empleadoId, saldoInicial });

      // Crear arqueo nuevo
      const nuevoArqueo = await createArqueo({
        empleadoId: empleadoId,
        saldoInicial: saldoInicial,
      });

      console.log("Respuesta del servidor:", nuevoArqueo);

      // Actualización del estado con validación
      if (nuevoArqueo && (nuevoArqueo.idArqueo || nuevoArqueo.id)) {
        const arqueoId = nuevoArqueo.idArqueo || nuevoArqueo.id;

        const arqueoCompleto = {
          ...nuevoArqueo,
          idArqueo: arqueoId,
          empleado: cajeros.find(c => c.idEmpleado === empleadoId) || {
            idEmpleado: empleadoId,
            nombre: "Cajero"
          }
        };

        setArqueoActual(arqueoCompleto);

        // Guardar en localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem("currentArqueoId", arqueoId.toString());
        }
      }

      // Limpiar campos del formulario
      setCajeroSeleccionadoId("");
      setSaldoBase("");

      // Recargar historial
      try {
        const historialActualizado = await cargarHistorial();
        setArqueos(historialActualizado);
      } catch (historialError) {
        console.warn("Error recargando historial:", historialError);
      }

      setSuccess(`Arqueo #${nuevoArqueo.idArqueo || nuevoArqueo.id} creado exitosamente`);

    } catch (error) {
      console.error("Error completo:", error);

      let errorMessage = "Error al crear arqueo";

      if (error.message) {
        errorMessage = error.message
          .replace("Error al crear arqueo: ", "")
          .replace("Error en la creación", "Error en la creación del arqueo");
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const cerrarArqueo = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      if (!arqueoActual?.idArqueo) {
        throw new Error("No hay arqueo activo para cerrar")
      }

      // Usar saldo final ingresado o calcular automáticamente
      let saldoFinalNum
      if (saldoFinal && saldoFinal.trim() !== "") {
        saldoFinalNum = Number(saldoFinal)
        if (isNaN(saldoFinalNum) || saldoFinalNum < 0) {
          throw new Error("El saldo final debe ser un número válido mayor o igual a cero")
        }
      } else {
        // Calcular saldo final automáticamente
        saldoFinalNum = calcularSaldoPrevisto(arqueoActual)
      }

      await closeArqueo(arqueoActual.idArqueo, {
        saldoFinal: saldoFinalNum,
        observacion: observacion.trim() || "Sin observaciones",
      })

      // Limpiar estados
      setArqueoActual(null)
      setIngresos([])
      setEgresos([])
      setObservacion("")
      setSaldoFinal("")

      if (typeof window !== 'undefined') {
        localStorage.removeItem("currentArqueoId")
      }

      // Actualizar historial
      const historialActualizado = await getHistorial()
      setArqueos(historialActualizado)

      setSuccess("Arqueo cerrado correctamente")

    } catch (error) {
      console.error("Error al cerrar arqueo:", error)
      setError(error.message || "Error al cerrar arqueo")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectArqueo = (arqueo) => {
    const isSelected = arqueoSeleccionado?.idArqueo === arqueo.idArqueo
    setArqueoSeleccionado(isSelected ? null : arqueo)
  }

  // Efecto para actualizar saldo final sugerido cuando cambian los movimientos
  useEffect(() => {
    if (arqueoActual) {
      const saldoCalculado = calcularSaldoPrevisto(arqueoActual)
      setSaldoFinal(saldoCalculado.toString())
    }
  }, [arqueoActual, ingresos, egresos])

  // Render
  return (
    <div className="min-h-screen bg-zinc-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-800 mb-2">Arqueo de Caja</h1>
          <p className="text-zinc-600">Gestiona y controla los arqueos de caja de tu barbería</p>
          {arqueoActual && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-lg border border-green-200">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Arqueo #{arqueoActual.idArqueo} en curso</span>
            </div>
          )}
        </div>

        {/* Alertas */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                <p className="text-red-700 font-medium">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <p className="text-green-700 font-medium">{success}</p>
              </div>
              <button
                onClick={() => setSuccess(null)}
                className="text-green-500 hover:text-green-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Indicador de actualización */}
        {actualizando && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center text-blue-700">
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              <span className="text-sm">Actualizando datos...</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Historial de Arqueos */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="bg-gradient-to-r from-zinc-50 to-zinc-100 px-6 py-4 border-b border-zinc-200">
              <h2 className="text-xl font-semibold text-zinc-800 flex items-center gap-3">
                <div className="p-2 bg-zinc-200 rounded-lg">
                  <Clock className="w-5 h-5 text-zinc-700" />
                </div>
                Historial de Arqueos
                {historial?.length > 0 && (
                  <span className="bg-zinc-200 text-zinc-700 px-2 py-1 rounded-full text-sm">
                    {historial.length}
                  </span>
                )}
              </h2>
            </div>

            <div className="p-6">
              {loading && arqueos.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-800"></div>
                  <span className="ml-3 text-zinc-600">Cargando arqueos...</span>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {arqueos.map((arqueo) => (
                    <div
                      key={arqueo.idArqueo}
                      className={`border rounded-xl p-5 transition-all duration-200 cursor-pointer hover:shadow-md ${arqueoSeleccionado?.idArqueo === arqueo.idArqueo
                        ? "border-zinc-800 bg-zinc-50 shadow-md"
                        : !arqueo.fechaCierre
                          ? "border-green-300 bg-green-50 shadow-sm"
                          : "border-zinc-200 hover:border-zinc-300"
                        }`}
                      onClick={() => handleSelectArqueo(arqueo)}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${!arqueo.fechaCierre ? 'bg-green-200' : 'bg-zinc-100'}`}>
                            <User className={`w-4 h-4 ${!arqueo.fechaCierre ? 'text-green-700' : 'text-zinc-600'}`} />
                          </div>
                          <div>
                            <p className="font-semibold text-lg text-zinc-800">
                              {arqueo.empleado?.nombre || "Cajero no especificado"}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-zinc-500">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {formatDateTime(arqueo.fechaInicio)} - {formatDateTime(arqueo.fechaCierre)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${!arqueo.fechaCierre
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : "bg-zinc-100 text-zinc-700 border border-zinc-200"
                              }`}
                          >
                            {!arqueo.fechaCierre ? "Abierto" : "Cerrado"}
                          </span>
                          {arqueoSeleccionado?.idArqueo === arqueo.idArqueo && (
                            <Eye className="w-4 h-4 text-zinc-600" />
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-50 p-3 rounded-lg">
                          <p className="text-sm text-zinc-600 mb-1">Saldo Inicial</p>
                          <p className="font-semibold text-zinc-800">
                            {arqueo?.saldoInicial != null
                              ? `$${Number(arqueo.saldoInicial).toLocaleString()}`
                              : "Cargando..."}
                          </p>
                        </div>

                        {arqueo.fechaCierre && (
                          <div className="bg-zinc-50 p-3 rounded-lg">
                            <p className="text-sm text-zinc-600 mb-1">Saldo Final</p>
                            <p className="font-semibold text-zinc-800">
                              ${Number(arqueo.saldoFinal || 0).toLocaleString()}
                            </p>
                          </div>
                        )}

                        {/* Mostrar detalles si el arqueo está seleccionado */}
                        {arqueoSeleccionado?.idArqueo === arqueo.idArqueo && (
                          <>
                            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                              <p className="text-sm text-green-700 mb-1 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                Total Ingresos
                              </p>
                              <p className="font-semibold text-green-800">
                                ${calcularTotalIngresos().toLocaleString()}
                              </p>
                            </div>
                            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                              <p className="text-sm text-red-700 mb-1 flex items-center gap-1">
                                <TrendingDown className="w-3 h-3" />
                                Total Egresos
                              </p>
                              <p className="font-semibold text-red-800">
                                ${calcularTotalEgresos().toLocaleString()}
                              </p>
                            </div>
                            <div className="col-span-2 bg-zinc-50 p-3 rounded-lg">
                              <p className="text-sm text-zinc-600 mb-1 flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                Observaciones
                              </p>
                              <p className="font-medium text-zinc-800">
                                {arqueo.observacion || arqueo.observaciones || "Ninguna"}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {arqueos.length === 0 && !loading && (
                    <div className="text-center py-12">
                      <Clock className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                      <p className="text-zinc-500 text-lg">No hay arqueos registrados</p>
                      <p className="text-zinc-400 text-sm">Los arqueos aparecerán aquí una vez que los crees</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Panel de control */}
          <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className={`px-6 py-4 ${arqueoActual ? 'bg-gradient-to-r from-green-600 to-green-700' : 'bg-gradient-to-r from-zinc-800 to-black'}`}>
              <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                {arqueoActual ? "Arqueo en Curso" : "Iniciar Arqueo"}
              </h2>
            </div>
            <div className="p-6">
              {arqueoActual && (
                <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 p-5 rounded-xl mb-6 border border-zinc-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-zinc-200 rounded-lg">
                      <User className="w-4 h-4 text-zinc-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-zinc-800">
                        Cajero: {arqueoActual.empleado?.nombre || "Sin especificar"}
                      </p>
                      <p className="text-sm text-zinc-600">
                        Arqueo #{arqueoActual.idArqueo}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-lg border border-zinc-200">
                      <p className="text-sm text-zinc-600 mb-1">Saldo Inicial</p>
                      <p className="font-semibold text-zinc-800">
                        ${Number(arqueoActual.saldoInicial || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-zinc-200">
                      <p className="text-sm text-zinc-600 mb-1">Saldo Actual</p>
                      <p className="font-semibold text-zinc-800">
                        ${calcularSaldoPrevisto(arqueoActual).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {arqueoActual && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-zinc-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Movimientos del Día
                  </h3>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-200 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-green-700" />
                          </div>
                          <div>
                            <h4 className="text-green-800 font-semibold">Ingresos</h4>
                            <p className="text-green-600 text-sm">Total del día</p>
                          </div>
                        </div>
                        <p className="font-bold text-green-800 text-xl">
                          ${calcularTotalIngresos().toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-200 rounded-lg">
                            <TrendingDown className="w-5 h-5 text-red-700" />
                          </div>
                          <div>
                            <h4 className="text-red-800 font-semibold">Egresos</h4>
                            <p className="text-red-600 text-sm">Total del día</p>
                          </div>
                        </div>
                        <p className="font-bold text-red-800 text-xl">
                          ${calcularTotalEgresos().toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {arqueoActual && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-zinc-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Movimientos del Día
                  </h3>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-200 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-green-700" />
                          </div>
                          <div>
                            <h4 className="text-green-800 font-semibold">Ingresos</h4>
                            <p className="text-green-600 text-sm">Total del día</p>
                          </div>
                        </div>
                        <p className="font-bold text-green-800 text-xl">
                          ${calcularTotalIngresos(ingresos).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-200 rounded-lg">
                            <TrendingDown className="w-5 h-5 text-red-700" />
                          </div>
                          <div>
                            <h4 className="text-red-800 font-semibold">Egresos</h4>
                            <p className="text-red-600 text-sm">Total del día</p>
                          </div>
                        </div>
                        <p className="font-bold text-red-800 text-xl">
                          ${calcularTotalEgresos(egresos).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {arqueoActual && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-zinc-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Movimientos del Día
                  </h3>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-200 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-green-700" />
                          </div>
                          <div>
                            <h4 className="text-green-800 font-semibold">Ingresos</h4>
                            <p className="text-green-600 text-sm">Total del día</p>
                          </div>
                        </div>
                        <p className="font-bold text-green-800 text-xl">
                          ${calcularTotalIngresos(ingresos).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-200 rounded-lg">
                            <TrendingDown className="w-5 h-5 text-red-700" />
                          </div>
                          <div>
                            <h4 className="text-red-800 font-semibold">Egresos</h4>
                            <p className="text-red-600 text-sm">Total del día</p>
                          </div>
                        </div>
                        <p className="font-bold text-red-800 text-xl">
                          ${calcularTotalEgresos(egresos).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!arqueoActual ? (
                <form onSubmit={abrirArqueo} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-700 mb-2">Seleccionar Cajero</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <select
                        value={cajeroSeleccionadoId}
                        onChange={handleCajeroChange}
                        className="w-full pl-10 pr-4 py-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-800 focus:border-zinc-800 transition-colors"
                        required
                        disabled={loading}
                      >
                        <option value="">Seleccionar cajero</option>
                        {cajeros.map((cajero) => (
                          <option
                            key={`cajero-${cajero.idEmpleado}`}
                            value={cajero.idEmpleado ?? ''} // Forzar string vacío si es undefined
                          >
                            {cajero.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-zinc-700 mb-2">Saldo Base</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input
                        type="number"
                        value={saldoBase}
                        onChange={(e) => setSaldoBase(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-800 focus:border-zinc-800 transition-colors"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-zinc-800 to-black hover:from-black hover:to-zinc-900 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Procesando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        <span>Iniciar Arqueo</span>
                      </div>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={cerrarArqueo} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-700 mb-2">Saldo Final</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input
                        type="number"
                        value={saldoFinal}
                        onChange={(e) => setSaldoFinal(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-800 focus:border-zinc-800 transition-colors"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-zinc-700 mb-2">Observaciones</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                      <textarea
                        value={observacion}
                        onChange={(e) => setObservacion(e.target.value)}
                        rows={4}
                        className="w-full pl-10 pr-4 py-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-800 focus:border-zinc-800 transition-colors resize-none"
                        placeholder="Agregar observaciones sobre el arqueo..."
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-zinc-800 to-black hover:from-black hover:to-zinc-900 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Procesando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        <span>Cerrar Arqueo</span>
                      </div>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ArqueoDeCaja
