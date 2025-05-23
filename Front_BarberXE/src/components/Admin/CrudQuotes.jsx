"use client"
import React, { useState, useEffect } from "react"
import { Pencil, Trash2, Search, Plus, Calendar, Clock, User, Users, Scissors, Check, X, Loader2 } from "lucide-react"
import {
  fetchCitas,
  createCita,
  updateCita,
  deleteCita,
  fetchClientes,
  fetchEmpleados,
  fetchServicios,
} from "../../services/QuotesService.js"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { toast } from "react-toastify"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DatePicker } from "../Cliente/Calendar.jsx"
import { getDate } from "date-fns"

const ValidationMessage = ({ message, isValid }) => {
  if (!message) return null

  return (
    <div className={`flex items-center gap-1.5 text-xs mt-1 ${isValid ? "text-green-600" : "text-red-500"}`}>
      {isValid ? <Check size={12} /> : <X size={12} />}
      <span>{message}</span>
    </div>
  )
}

const TableCitas = ({ isCollapsed }) => {
  const [citas, setCitas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editingCitaId, setEditingCitaId] = useState(null)

  // Datos para combobox
  const [clientes, setClientes] = useState([])
  const [empleados, setEmpleados] = useState([])
  const [servicios, setServicios] = useState([])
  const [barberos, setBarberos] = useState([])

  // Formulario
  const [formData, setFormData] = useState({
    fecha: "",
    hora: "",
    cliente: null,
    empleado: null,
    servicios: [],
  })

  // Errores de validación
  const [fechaError, setFechaError] = useState("")
  const [horaError, setHoraError] = useState("")
  const [clienteError, setClienteError] = useState("")
  const [empleadoError, setEmpleadoError] = useState("")
  const [serviciosError, setServiciosError] = useState("")
  const [setDisponibilidadError] = useState("")
  const [submitting, setSubmitting] = useState(false)



  // Generar horas disponibles (8:00 AM - 10:00 PM cada 30 minutos)
  const horasDisponibles = Array.from({ length: 28 }, (_, i) => {
    const hour = 8 + Math.floor(i / 2)
    const minute = i % 2 === 0 ? "00" : "30"
    return `${hour.toString().padStart(2, "0")}:${minute}`
  })

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [citasData, clientesData, empleadosData, serviciosData] =
          await Promise.all([
            fetchCitas(),
            fetchClientes(),
            fetchEmpleados(),
            fetchServicios().then((servicios) =>
              servicios.map((s) => ({
                ...s,
                duracion: parseInt(s.duracion) || 0,
              }))
            ),
          ])

        setCitas(citasData)
        setClientes(clientesData)
        setEmpleados(empleadosData)
        setBarberos(
          empleadosData.filter(
            (e) =>
              e.cargo.trim().toLowerCase() === "barbero" &&
              e.estado?.trim().toLowerCase() === "activo"
          )
        )
        setServicios(
          serviciosData.filter(
            (s) => s.estado?.trim().toLowerCase() === "activo"
          )
        )
        setLoading(false)
      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Buscar citas por cliente
  useEffect(() => {
    if (searchTerm) {
      const filtered = citas.filter(
        (cita) =>
          cita.cliente.nombre
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          cita.cliente.apellido.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setCitas(filtered)
    } else {
      const reloadCitas = async () => {
        try {
          const citasData = await fetchCitas()
          setCitas(citasData)
        } catch (err) {
          setError(err.message)
        }
      }
      reloadCitas()
    }
  }, [searchTerm])

  const openModal = (citaId = null) => {
    setShowModal(true)
    setEditingCitaId(citaId)

    if (citaId !== null) {
      const citaToEdit = citas.find((c) => c.idCita === citaId)
      if (citaToEdit) {
        const fechaObj = new Date(citaToEdit.fecha)
        const fecha = fechaObj.toISOString().split("T")[0]
        const hora = fechaObj.toTimeString().substring(0, 5)

        setFormData({
          fecha,
          hora,
          cliente: citaToEdit.cliente,
          empleado: citaToEdit.empleado,
          servicios: citaToEdit.servicios,
        })
      }
    } else {
      setFormData({
        fecha: "",
        hora: "",
        cliente: null,
        empleado: null,
        servicios: [],
      })
    }

    setFechaError("")
    setHoraError("")
    setClienteError("")
    setEmpleadoError("")
    setServiciosError("")
    setDisponibilidadError("")
  }


  const closeModal = () => {
    setShowModal(false)
    setEditingCitaId(null)
    setError(null)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validateForm = () => {
    let isValid = true

    if (!formData.fecha) {
      setFechaError("La fecha es requerida")
      isValid = false
    } else {
      setFechaError("")
    }

    if (!formData.hora) {
      setHoraError("La hora es requerida")
      isValid = false
    } else {
      setHoraError("")
    }

    if (!formData.cliente) {
      setClienteError("Seleccione un cliente")
      isValid = false
    } else {
      setClienteError("")
    }

    if (!formData.empleado) {
      setEmpleadoError("Seleccione un empleado")
      isValid = false
    } else {
      setEmpleadoError("")
    }

    if (formData.servicios.length === 0) {
      setServiciosError("Seleccione al menos un servicio")
      isValid = false
    } else {
      setServiciosError("")
    }

    if (formData.fecha && formData.hora) {
      const fechaSeleccionada = new Date(`${formData.fecha}T${formData.hora}`)
      const ahora = new Date()

      const margenAnticipacion = 2 * 60 * 60 * 1000
      const fechaMinima = new Date(ahora.getTime() + margenAnticipacion)

      const esMismoDia =
        fechaSeleccionada.toDateString() === ahora.toDateString()

      if (esMismoDia && fechaSeleccionada < fechaMinima) {
        setFechaError(
          "Para citas hoy, debe agendar con al menos 2 horas de anticipación"
        )
        isValid = false
      } else if (fechaSeleccionada < ahora) {
        setFechaError("No puede agendar citas en el pasado")
        isValid = false
      } else {
        setFechaError("")
      }

      const [horas, minutos] = formData.hora.split(":").map(Number)
      if (horas < 8 || horas >= 22 || (horas === 21 && minutos > 0)) {
        setHoraError("Horario laboral: 8:00 - 22:00")
        isValid = false
      } else {
        setHoraError("")
      }
    }

    return isValid
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    if (!validateForm()) {
      toast.error("Por favor complete todos los campos requeridos")
      setSubmitting(false)
      return
    }

    try {
      const fechaSolo = formData.fecha?.split("T")[0]; // obtiene solo "YYYY-MM-DD"
      const hora = formData.hora; // "HH:mm"

      if (!fechaSolo || !hora) throw new Error("Fecha u hora incompleta");

      const [year, month, day] = fechaSolo.split("-").map(Number);
      const [hour, minute] = hora.split(":").map(Number);

      const fechaHora = new Date(year, month - 1, day, hour, minute);

      if (isNaN(fechaHora.getTime())) {
        throw new Error("Fecha y hora inválidas");
      }


      const duracionTotal = formData.servicios.reduce(
        (total, servicio) => total + (parseInt(servicio?.duracion) || 30),
        0
      )

      const citaData = {
        fecha: fechaHora.toISOString(),
        clienteId: formData.cliente.idCliente,
        empleadoId: formData.empleado.idEmpleado,
        servicioIds: formData.servicios.map((s) => s.idServicio),
        duracionTotal,
      }

      if (editingCitaId) {
        await updateCita(editingCitaId, citaData)
        toast.success(
          <div>
            <p>Cita actualizada correctamente</p>
            <p>
              Empleado: {formData.empleado.nombre} {formData.empleado.apellido}
            </p>
            <p>Duración: {duracionTotal} minutos</p>
            <p>
              Horario: {formData.hora} -{" "}
              {calculateEndTime(formData.hora, duracionTotal)}
            </p>
          </div>,
          { autoClose: 8000 }
        )
      } else {
        const nuevaCita = await createCita(citaData)
        toast.success(
          <div>
            <p>Cita creada correctamente</p>
            <p>
              Empleado: {formData.empleado.nombre} {formData.empleado.apellido}
            </p>
            <p>Duración: {duracionTotal} minutos</p>
            <p>
              Horario: {formData.hora} -{" "}
              {calculateEndTime(formData.hora, duracionTotal)}
            </p>
          </div>,
          { autoClose: 8000 }
        )
      }

      const citasActualizadas = await fetchCitas()
      setCitas(citasActualizadas)
      closeModal()
    } catch (error) {
      console.error("Error al guardar cita:", error)

      const duracionTotal = formData.servicios.reduce(
        (total, servicio) => total + (parseInt(servicio?.duracion) || 30),
        0
      )

      if (error.response?.status === 409 || error.message.includes("Conflicto")) {
        const rawMessage = error.response?.data?.error || error.message
        const horarioOcupado = extractTimeRange(rawMessage) || "Horario no disponible"
        const duracionOcupada = extractDuration(rawMessage) || "No especificada"

        toast.error(
          <div>
            <strong>No se puede agendar:</strong>
            <p>
              El empleado {formData.empleado.nombre}{" "}
              {formData.empleado.apellido} ya tiene:
            </p>
            <p>• Cita programada: {horarioOcupado}</p>
            <p>
              • Duración ocupada: {duracionOcupada || "No especificada"} minutos
            </p>
            <p>
              • Intento de reserva: {formData.hora} -{" "}
              {calculateEndTime(formData.hora, duracionTotal)}
            </p>
          </div>,
          { autoClose: 10000 }
        )
      } else {
        toast.error(
          <div>
            <strong>
              Error al {editingCitaId ? "actualizar" : "crear"} la cita:
            </strong>
            <p>{error.response?.data?.message || error.message}</p>
          </div>,
          { autoClose: 5000 }
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  const extractTimeRange = (message) => {
    const timeRegex =
      /(\d{1,2}:\d{2})(:\d{2})?\s*(a\. m\.|p\. m\.)?\s*[-a]\s*(\d{1,2}:\d{2})(:\d{2})?\s*(a\. m\.|p\. m\.)?/i
    const match = message.match(timeRegex)
    if (!match) return null

    const start = match[1]
    const end = match[4]

    return `${cleanTime(start, match[3])} - ${cleanTime(end, match[6])}`
  }

  const cleanTime = (timeStr, ampm) => {
    const [hour, minute] = timeStr.split(":").map(Number)

    let adjustedHour = hour

    if (ampm) {
      if (ampm.toLowerCase().includes("a\. m\.") && hour === 12) {
        adjustedHour = 0
      } else if (ampm.toLowerCase().includes("p\. m\.") && hour !== 12) {
        adjustedHour += 12
      }
    }

    if (adjustedHour >= 22) {
      adjustedHour = 22
    }

    return `${adjustedHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  }

  const extractDuration = (message) => {
    const durationRegex = /una cita de (\d+) minutos/i
    const match = message.match(durationRegex)
    return match ? match[1] : null
  }

  const calculateEndTime = (startTime, durationMinutes) => {
    const [hours, minutes] = startTime.split(":").map(Number)
    const startDate = new Date()
    startDate.setHours(hours, minutes, 0, 0)

    const endDate = new Date(startDate.getTime() + durationMinutes * 60000)
    return endDate.toTimeString().substring(0, 5)
  }

  const handleDelete = async (citaId) => {
    if (window.confirm("¿Está seguro que desea eliminar esta cita?")) {
      try {
        await deleteCita(citaId)
        setCitas((prev) => prev.filter((c) => c.idCita !== citaId))
        toast.success("Cita eliminada con éxito")
      } catch (err) {
        toast.error(err.message || "Error al eliminar la cita")
      }
    }
  }

  const formatFechaHora = (fechaString) => {
    const fecha = new Date(fechaString)
    return fecha.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md mb-6">
        <div className="flex items-center">
          <X className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    )
  }

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-800 mb-2">Gestión de Citas</h1>
          <p className="text-zinc-500 text-sm">Administra las citas de tus clientes</p>
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <Button
            onClick={() => openModal()}
            className="bg-gradient-to-r from-zinc-800 to-black hover:from-black hover:to-zinc-900 text-white font-medium py-2 px-4 rounded-md flex items-center gap-2 transition-colors"
          >
            <Plus size={18} /> Nueva Cita
          </Button>

          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-zinc-400" />
            </div>
            <Input
              type="text"
              placeholder="Buscar por cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full bg-white border border-zinc-300 text-zinc-900 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors placeholder-zinc-400"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-zinc-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-zinc-50">
                  <th className="py-3 px-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider border-b border-zinc-200">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-zinc-400" />
                      <span>Fecha y Hora</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider border-b border-zinc-200">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-zinc-400" />
                      <span>Cliente</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider border-b border-zinc-200">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-zinc-400" />
                      <span>Empleado</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider border-b border-zinc-200">
                    <div className="flex items-center gap-2">
                      <Scissors size={14} className="text-zinc-400" />
                      <span>Servicios</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider border-b border-zinc-200">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {citas.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-zinc-500">
                      <div className="flex flex-col items-center gap-2">
                        <Calendar size={24} className="text-zinc-300" />
                        <p>No se encontraron citas</p>
                        <Button
                          variant="link"
                          onClick={() => openModal()}
                          className="text-red-500 hover:text-red-600 text-sm"
                        >
                          Agregar una cita
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  citas.map((cita) => (
                    <tr key={cita.idCita} className="hover:bg-zinc-50 transition-colors">
                      <td className="py-3 px-4 text-sm text-zinc-700">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-zinc-400" />
                          {formatFechaHora(cita.fecha)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-zinc-700">
                        {cita.cliente
                          ? `${cita.cliente.nombre} ${cita.cliente.apellido}`
                          : "Cliente no asignado"}
                      </td>
                      <td className="py-3 px-4 text-sm text-zinc-700">
                        {cita.empleado.nombre} {cita.empleado.apellido}
                      </td>
                      <td className="py-3 px-4 text-sm text-zinc-700">
                        <div className="flex flex-wrap gap-1">
                          {cita.servicios.map((s) => (
                            <Button key={s.idServicio} variant="outline" className="text-xs">
                              {s.nombre}
                            </Button>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => openModal(cita.idCita)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"
                            title="Editar"
                          >
                            <Pencil size={15} />
                          </Button>
                          <Button
                            onClick={() => handleDelete(cita.idCita)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="Eliminar"
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {citas.length > 0 && (
            <div className="py-3 px-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500">
              <div>
                Mostrando <span className="font-medium">{citas.length}</span> citas
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-3 text-xs border-zinc-300 text-zinc-700"
                  disabled
                >
                  Anterior
                </Button>
                <span className="px-2 py-1 bg-red-500 text-white rounded-md">1</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-3 text-xs border-zinc-300 text-zinc-700"
                  disabled
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div
              className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden animate-in fade-in-90 zoom-in-90 duration-200"
              style={{ maxHeight: "90vh" }}
            >
              <div className="bg-gradient-to-r from-zinc-800 to-black px-6 py-5 relative">
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-zinc-600 to-zinc-800"></div>
                <div className="flex items-center gap-3">
                  {editingCitaId !== null ? (
                    <div className="p-2 bg-white/10 rounded-lg">
                      <Pencil className="text-white h-6 w-6" />
                    </div>
                  ) : (
                    <div className="p-2 bg-white/10 rounded-lg">
                      <Plus className="text-white h-6 w-6" />
                    </div>
                  )}
                  <h2 className="text-xl font-bold text-white">
                    {editingCitaId !== null ? "Editar Cita" : "Nueva Cita"}
                  </h2>
                </div>
                <p className="text-white/80 text-sm mt-1">
                  {editingCitaId !== null
                    ? "Actualiza la información de la cita"
                    : "Complete el formulario para registrar una nueva cita"}
                </p>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto" style={{ maxHeight: "calc(90vh - 180px)" }}>
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r-md">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <X className="h-5 w-5 text-red-500" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-zinc-500" />
                        <span>Fecha <span className="text-red-500">*</span></span>
                      </div>
                    </label>
                    <DatePicker
                      value={formData.fecha}
                      onChange={(newDate) => handleChange({ target: { name: "fecha", value: newDate } })}
                      error={fechaError}
                    />
                    <ValidationMessage message={fechaError} isValid={false} />
                  </div>


                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-zinc-500" />
                        <span>Hora <span className="text-red-500">*</span></span>
                      </div>
                    </label>
                    <Select
                      value={formData.hora}
                      onValueChange={(value) => handleSelectChange("hora", value)}
                    >
                      <SelectTrigger className={`w-full ${horaError ? "border-red-300 focus:ring-red-500" : ""}`}>
                        <SelectValue placeholder="Seleccione hora" />
                      </SelectTrigger>
                      <SelectContent>
                        {horasDisponibles.map((hora) => (
                          <SelectItem key={hora} value={hora}>
                            {hora}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <ValidationMessage message={horaError} isValid={false} />
                  </div>
                </div>

                {/* Select de Cliente */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-zinc-500" />
                      <span>Cliente <span className="text-red-500">*</span></span>
                    </div>
                  </label>
                  <Select
                    value={formData.cliente?.idCliente || ""}
                    onValueChange={(value) =>
                      handleSelectChange(
                        "cliente",
                        clientes.find((c) => c.idCliente === value)
                      )
                    }
                  >
                    <SelectTrigger className={`w-full ${clienteError ? "border-red-300 focus:ring-red-500" : ""}`}>
                      <SelectValue placeholder="Seleccione un cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.length > 0 ? (
                        clientes.map((cliente) => (
                          <SelectItem key={cliente.idCliente} value={cliente.idCliente}>
                            {`${cliente.nombre} ${cliente.apellido}`}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem disabled value="none">
                          No hay clientes disponibles
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <ValidationMessage message={clienteError} isValid={false} />
                </div>

                {/* Select de Barbero */}
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-zinc-500" />
                      <span>Barbero <span className="text-red-500">*</span></span>
                    </div>
                  </label>
                  <Select
                    value={formData.empleado?.idEmpleado || ""}
                    onValueChange={(value) =>
                      handleSelectChange(
                        "empleado",
                        empleados.find((e) => e.idEmpleado === value)
                      )
                    }
                  >
                    <SelectTrigger className={`w-full ${empleadoError ? "border-red-300 focus:ring-red-500" : ""}`}>
                      <SelectValue placeholder="Seleccione un barbero" />
                    </SelectTrigger>
                    <SelectContent>
                      {barberos.length > 0 ? (
                        barberos.map((barbero) => (
                          <SelectItem key={barbero.idEmpleado} value={barbero.idEmpleado}>
                            {`${barbero.nombre} ${barbero.apellido}`}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem disabled value="none">
                          No hay barberos disponibles
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <ValidationMessage message={empleadoError} isValid={false} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">
                    <div className="flex items-center gap-2">
                      <Scissors size={14} className="text-zinc-500" />
                      <span>Servicios <span className="text-red-500">*</span></span>
                    </div>
                  </label>

                  <div className={`border rounded-md p-2 max-h-48 overflow-y-auto ${serviciosError ? "border-red-300" : "border-zinc-300"}`}>
                    {servicios.length > 0 ? (
                      servicios.map(servicio => {
                        const isChecked = formData.servicios.some(s => s.idServicio === servicio.idServicio);

                        return (
                          <label key={servicio.idServicio} className="flex items-center gap-2 mb-1 cursor-pointer">
                            <input
                              type="checkbox"
                              className="form-checkbox accent-blue-600"
                              checked={isChecked}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setFormData(prev => {
                                  const nuevosServicios = checked
                                    ? [...prev.servicios, servicio]
                                    : prev.servicios.filter(s => s.idServicio !== servicio.idServicio);
                                  return { ...prev, servicios: nuevosServicios };
                                });
                              }}
                            />
                            <span>{`${servicio.nombre} (${servicio.duracion} min)`}</span>
                          </label>
                        );
                      })
                    ) : (
                      <p className="text-sm text-zinc-500">No hay servicios disponibles</p>
                    )}
                  </div>

                  <ValidationMessage message={serviciosError} isValid={false} />

                  {formData.servicios.length > 0 && (
                    <div className="mt-2 text-sm text-zinc-600">
                      Duración total:{" "}
                      {formData.servicios.reduce((total, s) => total + parseInt(s.duracion || 0), 0)} minutos
                    </div>
                  )}
                </div>

              </div>
              <div className="bg-zinc-50 px-6 py-4 flex justify-end gap-3 border-t border-zinc-200">
                <Button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  variant="outline"
                  className="text-zinc-700 border-zinc-300 hover:bg-zinc-100"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={submitting || !formData.fecha || !formData.hora || !formData.cliente || !formData.empleado || formData.servicios.length === 0}
                  className="bg-gradient-to-r from-zinc-800 to-black hover:from-black hover:to-zinc-900 text-white"
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      <span>{editingCitaId !== null ? "Actualizando..." : "Guardando..."}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {editingCitaId !== null ? (
                        <>
                          <Check size={16} />
                          <span>Actualizar</span>
                        </>
                      ) : (
                        <>
                          <Plus size={16} />
                          <span>Guardar</span>
                        </>
                      )}
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default TableCitas;