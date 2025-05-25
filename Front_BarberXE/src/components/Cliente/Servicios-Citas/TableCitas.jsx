"use client"
import React, { useState, useEffect } from "react";
import { Pencil, Trash2, Search, Plus, Calendar, Clock, User, Users, Scissors, Check, X, Loader2 } from "lucide-react";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import {
    fetchCitas,
    createCita,
    updateCita,
    deleteCita,
    fetchClientes,
    fetchEmpleados,
    fetchServicios,
} from "../../../services/QuotesService.js";
import { toast } from "react-toastify";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimeSelect } from "../Hora-Calendario/Hour.jsx";
import { DatePicker } from "../Hora-Calendario/Calendar.jsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ValidationMessage = ({ message, isValid }) => {
    if (!message) return null;

    return (
        <div className={`flex items-center gap-1.5 text-xs mt-1 ${isValid ? "text-green-600" : "text-red-500"}`}>
            {isValid ? <Check size={12} /> : <X size={12} />}
            <span>{message}</span>
        </div>
    );
};

const TableCitasCliente = ({ isCollapsed, currentUser }) => {
    const [citas, setCitas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingCitaId, setEditingCitaId] = useState(null);
    const [currentStep, setCurrentStep] = useState("servicio");

    // Datos para el formulario
    const [clientes, setClientes] = useState([]);
    const [empleados, setEmpleados] = useState([]);
    const [servicios, setServicios] = useState([]);
    const [barberos, setBarberos] = useState([]);

    // Formulario
    const [formData, setFormData] = useState({
        fecha: "",
        hora: "",
        cliente: null,
        empleado: null,
        servicios: [],
    });

    // Errores
    const [fechaError, setFechaError] = useState("");
    const [horaError, setHoraError] = useState("");
    const [empleadoError, setEmpleadoError] = useState("");
    const [serviciosError, setServiciosError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = citas.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(citas.length / itemsPerPage);

    const nextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    // Función para crear una fecha local a partir de componentes
    const createLocalDate = (year, month, day, hours, minutes) => {
        // Crear fecha en zona horaria local
        const date = new Date(year, month - 1, day, hours, minutes);
        return date;
    };

    // Función para formatear fecha en el resumen
    const formatDateForSummary = (dateString) => {
        try {
            // Si ya es un objeto Date, usarlo directamente
            if (dateString instanceof Date) {
                return format(dateString, "EEEE d 'de' MMMM", { locale: es });
            }

            // Si es una cadena ISO (viene de la base de datos)
            if (typeof dateString === 'string' && dateString.includes('T')) {
                const date = parseISO(dateString);
                return format(date, "EEEE d 'de' MMMM", { locale: es });
            }

            // Si es una cadena en formato YYYY-MM-DD (del date picker)
            if (typeof dateString === 'string' && dateString.includes('-')) {
                const [year, month, day] = dateString.split('-').map(Number);
                const date = new Date(year, month - 1, day);
                return format(date, "EEEE d 'de' MMMM", { locale: es });
            }

            return "Fecha no válida";
        } catch (error) {
            console.error("Error al formatear fecha:", error);
            return "Fecha no válida";
        }
    };

    // Cargar datos iniciales
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
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
                    ]);

                // Filtrar citas para el cliente actual si es necesario
                const citasFiltradas = currentUser?.idCliente
                    ? citasData.filter(c => c.cliente?.idCliente === currentUser.idCliente)
                    : citasData;

                setCitas(citasFiltradas);
                setClientes(clientesData);
                setEmpleados(empleadosData);

                // Filtrar solo barberos activos
                const barberosActivos = empleadosData.filter(
                    e => e.cargo?.trim().toLowerCase() === "barbero" && e.estado?.trim().toLowerCase() === "activo"
                );
                setBarberos(barberosActivos);

                // Filtrar solo servicios activos
                const serviciosActivos = serviciosData.filter(
                    s => s.estado?.trim().toLowerCase() === "activo"
                );
                setServicios(serviciosActivos);

                // Establecer cliente actual si existe
                if (currentUser?.idCliente) {
                    const clienteActual = clientesData.find(c => c.idCliente === currentUser.idCliente);
                    if (clienteActual) {
                        setFormData(prev => ({ ...prev, cliente: clienteActual }));
                    }
                }

                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        loadData();
    }, [currentUser]);

    // Manejar búsqueda
    useEffect(() => {
        if (!currentUser?.idCliente && searchTerm) {
            const filtered = citas.filter(
                cita => cita.cliente?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    cita.cliente?.apellido?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setCitas(filtered);
            setCurrentPage(1);
        } else if (!searchTerm) {
            const reloadCitas = async () => {
                try {
                    const citasData = await fetchCitas();
                    const citasFiltradas = currentUser?.idCliente
                        ? citasData.filter(c => c.cliente?.idCliente === currentUser.idCliente)
                        : citasData;
                    setCitas(citasFiltradas);
                    setCurrentPage(1);
                } catch (err) {
                    setError(err.message);
                }
            };
            reloadCitas();
        }
    }, [searchTerm, currentUser]);

    // Abrir modal para nueva/editar cita
    const openModal = (citaId = null) => {
        setShowModal(true);
        setEditingCitaId(citaId);
        setCurrentStep("servicio");

        if (citaId) {
            const citaToEdit = citas.find(c => c.idCita === citaId);
            if (citaToEdit) {
                const fechaObj = new Date(citaToEdit.fecha);

                // Convertir a fecha local
                const year = fechaObj.getFullYear();
                const month = String(fechaObj.getMonth() + 1).padStart(2, '0');
                const day = String(fechaObj.getDate()).padStart(2, '0');
                const fecha = `${year}-${month}-${day}`;

                // Obtener hora local
                const hours = String(fechaObj.getHours()).padStart(2, '0');
                const minutes = String(fechaObj.getMinutes()).padStart(2, '0');
                const hora = `${hours}:${minutes}`;

                setFormData({
                    fecha,
                    hora,
                    cliente: citaToEdit.cliente,
                    empleado: citaToEdit.empleado,
                    servicios: citaToEdit.servicios,
                });
            }
        } else {
            setFormData({
                fecha: "",
                hora: "",
                cliente: currentUser?.idCliente ?
                    clientes.find(c => c.idCliente === currentUser.idCliente) : null,
                empleado: null,
                servicios: [],
            });
        }
    };

    // Cerrar modal
    const closeModal = () => {
        setShowModal(false);
        setEditingCitaId(null);
        setError(null);
    };

    const validateForm = () => {
        let isValid = true;

        if (formData.servicios.length === 0) {
            setServiciosError("Seleccione al menos un servicio");
            isValid = false;
        } else {
            setServiciosError("");
        }

        if (!formData.empleado) {
            setEmpleadoError("Seleccione un barbero");
            isValid = false;
        } else {
            setEmpleadoError("");
        }

        if (!formData.fecha) {
            setFechaError("Seleccione una fecha");
            isValid = false;
        } else {
            setFechaError("");
        }

        if (!formData.hora) {
            setHoraError("Seleccione una hora");
            isValid = false;
        } else {
            setHoraError("");
        }

        // Validación de fecha y hora si ambos están presentes
        if (formData.fecha && formData.hora) {
            const [year, month, day] = formData.fecha.split('-').map(Number);
            const [hours, minutes] = formData.hora.split(':').map(Number);

            // Crear objeto Date en hora local
            const fechaHoraCita = createLocalDate(year, month, day, hours, minutes);
            const ahora = new Date();

            // Validar que no sea en el pasado
            if (fechaHoraCita < ahora) {
                setFechaError("No puede agendar citas en el pasado");
                isValid = false;
            }

            // Validar anticipación mínima de 2 horas para citas el mismo día
            const dosHorasMs = 2 * 60 * 60 * 1000;
            const esMismoDia = (
                fechaHoraCita.getDate() === ahora.getDate() &&
                fechaHoraCita.getMonth() === ahora.getMonth() &&
                fechaHoraCita.getFullYear() === ahora.getFullYear()
            );

            if (esMismoDia && (fechaHoraCita - ahora) < dosHorasMs) {
                setFechaError("Debe agendar con al menos 2 horas de anticipación");
                isValid = false;
            }

            // Validar horario laboral (8:00 - 22:00)
            if (hours < 8 || hours >= 22 || (hours === 21 && minutes > 0)) {
                setHoraError("Horario laboral: 8:00 - 22:00");
                isValid = false;
            }
        }

        return isValid;
    };

    // Función para calcular la hora de finalización
    const calculateEndTime = (startTime, durationMinutes) => {
        const [hours, minutes] = startTime.split(':').map(Number);
        const endDate = new Date();
        endDate.setHours(hours, minutes + durationMinutes, 0, 0);
        return endDate.toTimeString().substring(0, 5);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        if (!validateForm()) {
            toast.error("Por favor complete todos los campos requeridos");
            setSubmitting(false);
            return;
        }

        try {
            const [year, month, day] = formData.fecha.split('-').map(Number);
            const [hour, minute] = formData.hora.split(':').map(Number);

            // Crear fecha en zona horaria local
            const fechaHoraLocal = createLocalDate(year, month, day, hour, minute);

            // Validar nuevamente que la fecha no sea en el pasado
            const ahora = new Date();
            if (fechaHoraLocal < ahora) {
                throw new Error("No se puede agendar una cita en el pasado");
            }

            const duracionTotal = formData.servicios.reduce(
                (total, servicio) => total + (parseInt(servicio.duracion) || 30),
                0
            );

            const citaData = {
                fecha: fechaHoraLocal.toISOString(),
                clienteId: formData.cliente.idCliente,
                empleadoId: formData.empleado.idEmpleado,
                servicioIds: formData.servicios.map(s => s.idServicio),
                duracionTotal,
            };

            if (editingCitaId) {
                await updateCita(editingCitaId, citaData);

                // Mostrar resumen en el toast
                toast.success(
                    <div>
                        <p>Cita actualizada correctamente</p>
                        <p>
                            Barbero: {formData.empleado.nombre} {formData.empleado.apellido}
                        </p>
                        <p>Servicios: {formData.servicios.map(s => s.nombre).join(', ')}</p>
                        <p>Duración: {duracionTotal} minutos</p>
                        <p>
                            Horario: {formData.hora} - {calculateEndTime(formData.hora, duracionTotal)}
                        </p>
                        <p>Fecha: {formatDateForSummary(formData.fecha)}</p>
                    </div>,
                    { autoClose: 8000 }
                );
            } else {
                await createCita(citaData);

                // Mostrar resumen en el toast
                toast.success(
                    <div>
                        <p>Cita creada correctamente</p>
                        <p>
                            Barbero: {formData.empleado.nombre} {formData.empleado.apellido}
                        </p>
                        <p>Servicios: {formData.servicios.map(s => s.nombre).join(', ')}</p>
                        <p>Duración: {duracionTotal} minutos</p>
                        <p>
                            Horario: {formData.hora} - {calculateEndTime(formData.hora, duracionTotal)}
                        </p>
                        <p>Fecha: {formatDateForSummary(formData.fecha)}</p>
                    </div>,
                    { autoClose: 8000 }
                );
            }

            // Recargar citas
            const citasData = await fetchCitas();
            const citasFiltradas = currentUser?.idCliente
                ? citasData.filter(c => c.cliente?.idCliente === currentUser.idCliente)
                : citasData;
            setCitas(citasFiltradas);

            closeModal();
        } catch (error) {
            console.error("Error al guardar cita:", error);

            // Manejar errores de conflicto de horario
            if (error.response?.status === 409 || error.message.includes("Conflicto")) {
                const duracionTotal = formData.servicios.reduce(
                    (total, servicio) => total + (parseInt(servicio.duracion) || 30),
                    0
                );

                toast.error(
                    <div>
                        <strong>No se puede agendar:</strong>
                        <p>
                            El barbero {formData.empleado.nombre} {formData.empleado.apellido} ya tiene una cita programada
                        </p>
                        <p>
                            Intento de reserva: {formData.hora} - {calculateEndTime(formData.hora, duracionTotal)}
                        </p>
                        <p>Fecha: {formatDateForSummary(formData.fecha)}</p>
                    </div>,
                    { autoClose: 10000 }
                );
            } else {
                toast.error(
                    <div>
                        <strong>
                            Error al {editingCitaId ? "actualizar" : "crear"} la cita:
                        </strong>
                        <p>{error.response?.data?.message || error.message}</p>
                    </div>,
                    { autoClose: 5000 }
                );
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Eliminar cita
    const handleDelete = async (citaId) => {
        if (window.confirm("¿Está seguro que desea eliminar esta cita?")) {
            try {
                await deleteCita(citaId);
                setCitas(prev => prev.filter(c => c.idCita !== citaId));
                toast.success("Cita eliminada con éxito");
            } catch (err) {
                toast.error(err.message || "Error al eliminar la cita");
            }
        }
    };

    // Formatear fecha para la tabla
    const formatFechaHora = (fechaString) => {
        try {
            const fecha = new Date(fechaString);
            return fecha.toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch (error) {
            console.error("Error al formatear fecha:", error);
            return "Fecha inválida";
        }
    };

    // Renderizar formulario con pestañas
    const renderFormWithTabs = () => (
        <Tabs value={currentStep} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger
                    value="servicio"
                    onClick={() => setCurrentStep("servicio")}
                    className="text-sm"
                >
                    Servicio
                </TabsTrigger>
                <TabsTrigger
                    value="barbero"
                    onClick={() => formData.servicios.length > 0 && setCurrentStep("barbero")}
                    className="text-sm"
                    disabled={formData.servicios.length === 0}
                >
                    Barbero
                </TabsTrigger>
                <TabsTrigger
                    value="fecha"
                    onClick={() => formData.empleado && setCurrentStep("fecha")}
                    className="text-sm"
                    disabled={!formData.empleado}
                >
                    Fecha y Hora
                </TabsTrigger>
            </TabsList>

            <TabsContent value="servicio" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {servicios.map((s) => (
                        <div
                            key={s.idServicio}
                            className={`border rounded-lg p-4 cursor-pointer transition-all hover:border-black ${formData.servicios.some(serv => serv.idServicio === s.idServicio)
                                ? "border-2 border-black" : ""
                                }`}
                            onClick={() => {
                                const isSelected = formData.servicios.some(serv => serv.idServicio === s.idServicio);
                                setFormData(prev => ({
                                    ...prev,
                                    servicios: isSelected
                                        ? prev.servicios.filter(serv => serv.idServicio !== s.idServicio)
                                        : [...prev.servicios, s]
                                }));
                            }}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-medium text-lg">{s.nombre}</h3>
                                    <p className="text-zinc-500 text-sm mt-1">{s.duracion} min</p>
                                    <p className="font-medium mt-3">${s.precio}</p>
                                </div>
                                {formData.servicios.some(serv => serv.idServicio === s.idServicio) && (
                                    <div className="bg-black text-white rounded-full p-1">
                                        <Check className="h-4 w-4" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                {serviciosError && <p className="text-red-500 text-sm mt-2">{serviciosError}</p>}
            </TabsContent>

            <TabsContent value="barbero" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {barberos.map((b) => (
                        <div
                            key={b.idEmpleado}
                            className={`border rounded-lg p-4 cursor-pointer transition-all hover:border-black ${formData.empleado?.idEmpleado === b.idEmpleado
                                ? "border-2 border-black" : ""
                                }`}
                            onClick={() => setFormData(prev => ({ ...prev, empleado: b }))}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-medium text-lg">{b.nombre} {b.apellido}</h3>
                                    <p className="text-zinc-500 text-sm mt-1">{b.especialidad || 'General'}</p>
                                </div>
                                {formData.empleado?.idEmpleado === b.idEmpleado && (
                                    <div className="bg-black text-white rounded-full p-1">
                                        <Check className="h-4 w-4" />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                {empleadoError && <p className="text-red-500 text-sm mt-2">{empleadoError}</p>}
            </TabsContent>

            <TabsContent value="fecha" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Calendar size={14} className="text-zinc-500" />
                            <h3 className="font-medium">Fecha</h3>
                        </div>
                        <div className="space-y-4">
                            <DatePicker
                                value={formData.fecha}
                                onChange={(date) => setFormData(prev => ({ ...prev, fecha: date }))}
                                error={fechaError}
                            />
                            <ValidationMessage message={fechaError} isValid={false} />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Clock size={14} className="text-zinc-500" />
                            <h3 className="font-medium">Hora</h3>
                        </div>
                        <div className="space-y-2">
                            <TimeSelect
                                value={formData.hora}
                                onChange={(hora) => setFormData(prev => ({ ...prev, hora }))}
                            />
                            <ValidationMessage message={horaError} isValid={false} />
                        </div>
                    </div>
                </div>
            </TabsContent>
        </Tabs>
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md mb-6">
                <div className="flex items-center">
                    <X className="h-5 w-5 text-red-500 mr-2" />
                    <span className="text-red-700">{error}</span>
                </div>
            </div>
        );
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

                    {!currentUser?.idCliente && (
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
                    )}
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
                                            <span>Barbero</span>
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
                                    currentItems.map((cita) => (
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
                                                {cita.empleado?.nombre} {cita.empleado?.apellido}
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
                                Mostrando{" "}
                                <span className="font-medium">
                                    {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, citas.length)}
                                </span>{" "}
                                de <span className="font-medium">{citas.length}</span> citas
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-3 text-xs border-zinc-300 text-zinc-700"
                                    onClick={prevPage}
                                    disabled={currentPage === 1}
                                >
                                    Anterior
                                </Button>
                                <span className="px-2 py-1 bg-red-500 text-white rounded-md">
                                    {currentPage} / {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-3 text-xs border-zinc-300 text-zinc-700"
                                    onClick={nextPage}
                                    disabled={currentPage === totalPages}
                                >
                                    Siguiente
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                        <div
                            className="w-full max-w-4xl bg-white rounded-lg shadow-xl overflow-hidden animate-in fade-in-90 zoom-in-90 duration-200"
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

                                {/* Información del cliente */}
                                <div className="mb-6 p-4 bg-zinc-50 rounded-lg">
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                                        Cliente
                                    </label>
                                    <div className="font-medium">
                                        {formData.cliente
                                            ? `${formData.cliente.nombre} ${formData.cliente.apellido}`
                                            : "No seleccionado"}
                                    </div>
                                </div>

                                {/* Formulario con pestañas */}
                                {renderFormWithTabs()}
                                {(formData.servicios.length > 0 || formData.empleado || formData.fecha || formData.hora) && (
                                    <div className="mt-6 p-4 bg-zinc-50 rounded-lg">
                                        <h3 className="font-medium mb-3">Resumen de la cita</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                            {formData.servicios.length > 0 && (
                                                <div>
                                                    <p className="text-zinc-500">Servicios</p>
                                                    <div className="font-medium">
                                                        {formData.servicios.map((s) => (
                                                            <div key={s.idServicio}>{s.nombre}</div>
                                                        ))}
                                                    </div>
                                                    <p className="text-zinc-500 mt-1">
                                                        Duración: {formData.servicios.reduce((total, s) => {
                                                            const duration = parseInt(s.duracion) || 0;
                                                            return total + duration;
                                                        }, 0)} min
                                                    </p>
                                                </div>
                                            )}

                                            {formData.empleado && (
                                                <div>
                                                    <p className="text-zinc-500">Barbero</p>
                                                    <p className="font-medium">
                                                        {formData.empleado.nombre} {formData.empleado.apellido}
                                                    </p>
                                                </div>
                                            )}

                                            {(formData.fecha || formData.hora) && (
                                                <div>
                                                    <p className="text-zinc-500">Fecha y hora</p>
                                                    <p className="font-medium">
                                                        {formData.fecha && formatDateForSummary(formData.fecha)}
                                                        {formData.hora && ` - ${formData.hora}`}
                                                    </p>
                                                    {formData.fecha && formData.hora && formData.servicios.length > 0 && (
                                                        <p className="text-zinc-500 mt-1">
                                                            Finaliza aproximadamente a las {' '}
                                                            {calculateEndTime(
                                                                formData.hora,
                                                                formData.servicios.reduce((total, s) => total + (parseInt(s.duracion) || 0), 0)
                                                            )}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
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
                                    disabled={
                                        submitting ||
                                        !formData.fecha ||
                                        !formData.hora ||
                                        !formData.empleado ||
                                        formData.servicios.length === 0
                                    }
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
    );
};

export default TableCitasCliente;