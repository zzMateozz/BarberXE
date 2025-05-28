"use client"

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
} from "lucide-react"
import {
  getHistorial,
  createArqueo,
  closeArqueo,
  fetchIngresosByArqueo,
  fetchEgresosByArqueo,
  getArqueoById,
} from "../../../services/ArqueoService"

const fetchCurrentUser = async () => {
  try {
    const response = await fetch("http://localhost:3000/api/auth/me", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("authToken")}`,
      },
    })
    if (!response.ok) throw new Error("Error al obtener usuario actual")
    return await response.json()
  } catch (error) {
    console.error("Error fetching current user:", error)
    return null
  }
}

function ArqueoDeCaja() {
  // Estados principales
  const [arqueos, setArqueos] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [saldoBase, setSaldoBase] = useState("")
  const [saldoFinal, setSaldoFinal] = useState("")
  const [observacion, setObservacion] = useState("")
  const [arqueoActual, setArqueoActual] = useState(null)
  const [ingresos, setIngresos] = useState([])
  const [egresos, setEgresos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [arqueoSeleccionado, setArqueoSeleccionado] = useState(null)

  // Formatear fecha para mostrar
  const formatDateTime = (dateString) => {
    if (!dateString) return "En curso"
    const date = new Date(dateString)
    if (isNaN(date)) return "Fecha inválida"

    const options = { year: "numeric", month: "long", day: "numeric" }
    const fechaFormateada = date.toLocaleDateString(undefined, options)

    let horas = date.getHours()
    const minutos = date.getMinutes()
    const ampm = horas >= 12 ? "PM" : "AM"
    horas = horas % 12 || 12
    const minutosStr = minutos < 10 ? "0" + minutos : minutos

    return `${fechaFormateada}, ${horas}:${minutosStr} ${ampm}`
  }

  useEffect(() => {
    const interval = setInterval(async () => {
      if (arqueoActual?.idArqueo) {
        try {
          const [arqueoActualizado, nuevosIngresos, nuevosEgresos] = await Promise.all([
            getArqueoById(arqueoActual.idArqueo),
            fetchIngresosByArqueo(arqueoActual.idArqueo),
            fetchEgresosByArqueo(arqueoActual.idArqueo),
          ])

          if (arqueoActualizado.fechaCierre) {
            setArqueoActual(null)
            localStorage.removeItem("currentArqueoId")
          } else {
            setArqueoActual((prev) => ({ ...prev, ...arqueoActualizado }))
            setIngresos(nuevosIngresos)
            setEgresos(nuevosEgresos)
          }
        } catch (error) {
          console.error("Error al actualizar:", error)
        }
      }
    }, 10000) // Actualizar cada 10 segundos

    return () => clearInterval(interval)
  }, [arqueoActual])

  // Cargar datos iniciales
  useEffect(() => {
    const inicializarDatos = async () => {
      try {
        setLoading(true)

        // Obtener usuario actual
        const userData = await fetchCurrentUser()
        if (!userData) {
          throw new Error("No se pudo obtener la información del usuario actual")
        }
        
        // Verificar si el usuario es cajero
        if (userData.cargo.toLowerCase() !== "cajero" || userData.estado.toLowerCase() !== "activo") {
          throw new Error("Solo los cajeros activos pueden realizar arqueos de caja")
        }

        setCurrentUser(userData)

        // Cargar historial
        const historialData = await getHistorial()
        setArqueos(historialData)

        const arqueoGuardadoId = localStorage.getItem("currentArqueoId")

        if (arqueoGuardadoId) {
          try {
            const [arqueoData, ingresosData, egresosData] = await Promise.all([
              getArqueoById(arqueoGuardadoId),
              fetchIngresosByArqueo(arqueoGuardadoId),
              fetchEgresosByArqueo(arqueoGuardadoId),
            ])

            if (arqueoData && !arqueoData.fechaCierre && arqueoData.empleado?.idEmpleado === userData.idEmpleado) {
              setArqueoActual(arqueoData)
              setIngresos(ingresosData)
              setEgresos(egresosData)
            } else {
              localStorage.removeItem("currentArqueoId")
            }
          } catch (error) {
            console.error("Error al cargar arqueo actual:", error)
            localStorage.removeItem("currentArqueoId")
          }
        }
      } catch (error) {
        console.error("Error:", error)
        setError(error.message || "Error al cargar datos iniciales")
      } finally {
        setLoading(false)
      }
    }

    inicializarDatos()
  }, [])

  // Cargar movimientos para un arqueo específico
  const cargarMovimientos = async (arqueoId) => {
    if (!arqueoId) return

    try {
      setLoading(true)
      const [ingresosData, egresosData] = await Promise.all([
        fetchIngresosByArqueo(arqueoId),
        fetchEgresosByArqueo(arqueoId),
      ])

      setIngresos(ingresosData)
      setEgresos(egresosData)
    } catch (error) {
      console.error("Error cargando movimientos:", error)
      setError("Error al cargar movimientos")
    } finally {
      setLoading(false)
    }
  }

  // Actualizar arqueo seleccionado para ver detalles
  useEffect(() => {
    if (arqueoSeleccionado) {
      cargarMovimientos(arqueoSeleccionado.idArqueo)
    }
  }, [arqueoSeleccionado])

  // Cálculos para totales
  const calcularTotalIngresos = (ingresos = []) => {
    return ingresos.reduce((total, ing) => total + (Number(ing.monto) || 0), 0)
  }

  const calcularTotalEgresos = (egresos = []) => {
    return egresos.reduce((total, eg) => total + (Number(eg.monto) || 0), 0)
  }

  const calcularSaldoPrevisto = (arqueo) => {
    if (!arqueo) return 0

    // Usar los estados actualizados de ingresos y egresos en lugar de los del arqueo
    const totalIngresos = ingresos.reduce((sum, ing) => sum + (Number(ing.monto) || 0), 0)
    const totalEgresos = egresos.reduce((sum, eg) => sum + (Number(eg.monto) || 0), 0)

    return (Number(arqueo.saldoInicial) || 0) + totalIngresos - totalEgresos
  }

  const abrirArqueo = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      
      if (!currentUser) {
        throw new Error("No se ha identificado al cajero actual")
      }
      
      if (!saldoBase) {
        throw new Error("Ingrese el saldo base para iniciar el arqueo")
      }

      const response = await createArqueo({
        empleadoId: Number(currentUser.idEmpleado),
        saldoInicial: Number(saldoBase),
      })

      if (!response.data || !response.data.idArqueo) {
        throw new Error("Error al crear arqueo: la respuesta del servidor no incluyó un ID válido.")
      }

      // Actualizar estado
      const nuevoArqueo = response.data
      setArqueoActual(nuevoArqueo)
      setArqueoSeleccionado(nuevoArqueo)
      localStorage.setItem("currentArqueoId", nuevoArqueo.idArqueo)

      // Recargar historial
      const historialActualizado = await getHistorial()
      setArqueos(historialActualizado)

      setSuccess("Arqueo iniciado correctamente")
      setSaldoBase("")
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error("Error al abrir arqueo:", error)
      setError(error.message || "Error al abrir arqueo")
    } finally {
      setLoading(false)
    }
  }

  const cerrarArqueo = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      if (!arqueoActual?.idArqueo) {
        throw new Error("No hay arqueo activo")
      }

      // Calcular saldo final automáticamente
      const saldoCalculado = calcularSaldoPrevisto(arqueoActual)

      await closeArqueo(arqueoActual.idArqueo, {
        saldoFinal: saldoCalculado, // Usar el cálculo automático
        observacion: observacion || "",
      })

      // Actualizar estados
      const historialActualizado = await getHistorial()
      setArqueos(historialActualizado)
      setArqueoActual(null)
      setIngresos([])
      setEgresos([])
      localStorage.removeItem("currentArqueoId")

      setSuccess("Arqueo cerrado correctamente")
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error("Error al cerrar arqueo:", error)
      setError(error.message || "Error al cerrar arqueo")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectArqueo = (arqueo) => {
    setArqueoSeleccionado(arqueo.idArqueo === arqueoSeleccionado?.idArqueo ? null : arqueo)
  }

  // Render
  return (
    <div className="min-h-screen bg-zinc-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-800 mb-2">Arqueo de Caja</h1>
          <p className="text-zinc-600">Gestiona y controla los arqueos de caja de tu barbería</p>
        </div>

        {/* Alertas */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-sm">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg shadow-sm">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
              <p className="text-green-700 font-medium">{success}</p>
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
                      className={`border rounded-xl p-5 transition-all duration-200 cursor-pointer hover:shadow-md ${
                        arqueoSeleccionado?.idArqueo === arqueo.idArqueo
                          ? "border-zinc-800 bg-zinc-50 shadow-md"
                          : "border-zinc-200 hover:border-zinc-300"
                      }`}
                      onClick={() => handleSelectArqueo(arqueo)}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-zinc-100 rounded-lg">
                            <User className="w-4 h-4 text-zinc-600" />
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
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            !arqueo.fechaCierre
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : "bg-zinc-100 text-zinc-700 border border-zinc-200"
                          }`}
                        >
                          {!arqueo.fechaCierre ? "Abierto" : "Cerrado"}
                        </span>
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
                        {arqueoSeleccionado?.idArqueo === arqueo.idArqueo && arqueo.fechaCierre && (
                          <>
                            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                              <p className="text-sm text-green-700 mb-1 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                Total Ingresos
                              </p>
                              <p className="font-semibold text-green-800">
                                ${calcularTotalIngresos(arqueo.ingresos).toLocaleString()}
                              </p>
                            </div>
                            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                              <p className="text-sm text-red-700 mb-1 flex items-center gap-1">
                                <TrendingDown className="w-3 h-3" />
                                Total Egresos
                              </p>
                              <p className="font-semibold text-red-800">
                                ${calcularTotalEgresos(arqueo.egresos).toLocaleString()}
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
            <div className="bg-gradient-to-r from-zinc-800 to-black px-6 py-4">
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
                    <p className="font-semibold text-zinc-800">Cajero: {arqueoActual.empleado?.nombre}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-lg border border-zinc-200">
                      <p className="text-sm text-zinc-600 mb-1">Saldo Inicial</p>
                      <p className="font-semibold text-zinc-800">
                        ${Number(arqueoActual.saldoInicial).toLocaleString()}
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
                    <label className="block text-sm font-semibold text-zinc-700 mb-2">Cajero Actual</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input
                        type="text"
                        value={currentUser?.nombre || "Cargando..."}
                        className="w-full pl-10 pr-4 py-3 border border-zinc-300 rounded-lg bg-zinc-50 cursor-not-allowed"
                        disabled
                      />
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
                        disabled={loading || !currentUser}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !currentUser}
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