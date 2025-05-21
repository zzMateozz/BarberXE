"use client"
import React, { useState, useEffect } from "react";
import { Pencil, Trash2, CalendarIcon, Clock, Check } from "lucide-react";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import {
    fetchCitas,
    createCita,
    updateCita,
    deleteCita,
    fetchClientes,
    fetchEmpleados,
    fetchServicios,
} from "../../services/QuotesService.js";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimeSelect } from "./Hour.jsx";
import { DatePicker } from "./Calendar.jsx";


const TableCitas = ({ isCollapsed, currentUser }) => {
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
                        fetchServicios(),
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
                    e => e.cargo?.toLowerCase() === "barbero" && e.estado?.toLowerCase() === "activo"
                );
                setBarberos(barberosActivos);

                // Filtrar solo servicios activos
                const serviciosActivos = serviciosData.filter(
                    s => s.estado?.toLowerCase() === "activo"
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
        } else if (!searchTerm) {
            const reloadCitas = async () => {
                try {
                    const citasData = await fetchCitas();
                    const citasFiltradas = currentUser?.idCliente
                        ? citasData.filter(c => c.cliente?.idCliente === currentUser.idCliente)
                        : citasData;
                    setCitas(citasFiltradas);
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
                const fecha = fechaObj.toISOString().split("T")[0];
                const hora = fechaObj.toTimeString().substring(0, 5);

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

    // Validar formulario
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

        return isValid;
    };

    // Crear o actualizar cita
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error("Por favor complete todos los campos requeridos");
            return;
        }

        try {
            const fechaHora = new Date(`${formData.fecha}T${formData.hora}`);
            const duracionTotal = formData.servicios.reduce(
                (total, servicio) => total + (parseInt(servicio.duracion) || 30),
                0
            );

            const citaData = {
                fecha: fechaHora,
                clienteId: formData.cliente.idCliente,
                empleadoId: formData.empleado.idEmpleado,
                servicioIds: formData.servicios.map(s => s.idServicio),
                duracionTotal,
            };

            if (editingCitaId) {
                await updateCita(editingCitaId, citaData);
                toast.success("Cita actualizada correctamente");
            } else {
                await createCita(citaData);
                toast.success("Cita creada correctamente");
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
            toast.error(error.response?.data?.message || error.message || "Error al guardar la cita");
        }
    };

    // Eliminar cita
    const handleDelete = async (citaId) => {
        try {
            await deleteCita(citaId);
            setCitas(prev => prev.filter(c => c.idCita !== citaId));
            toast.success("Cita eliminada correctamente");
        } catch (err) {
            toast.error(err.message || "Error al eliminar la cita");
        }
    };

    // Formatear fecha
    const formatFechaHora = (fechaString) => {
        const fecha = new Date(fechaString);
        return fecha.toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
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
                            <CalendarIcon className="h-5 w-5" />
                            <h3 className="font-medium">Fecha</h3>
                        </div>
                        <div className="space-y-4">
                            <DatePicker
                                value={formData.fecha}
                                onChange={(date) => setFormData(prev => ({ ...prev, fecha: date }))}
                                error={fechaError}
                            />
                        </div>

                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="h-5 w-5" />
                            <h3 className="font-medium">Hora</h3>
                        </div>
                        {/* Mostrar hora seleccionada */}
                        <div className="space-y-2">
                            <TimeSelect
                                value={formData.hora}
                                onChange={(hora) => setFormData(prev => ({ ...prev, hora }))}
                            />
                        </div>

                        {horaError && <p className="text-red-500 text-sm mt-2">{horaError}</p>}
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
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                <strong className="font-bold">Error!</strong>
                <span className="block sm:inline"> {error}</span>
            </div>
        );
    }

    return (
        <section className="py-16 lg:py-20">
            <div className="container mx-auto px-4">
                <div className="flex justify-between mb-4">
                    <button
                        onClick={() => openModal()}
                        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 flex items-center gap-2 rounded-3xl"
                    >
                        <PlusCircleIcon className="w-6 h-6" /> Agendar Cita
                    </button>

                    {!currentUser?.idCliente && (
                        <input
                            type="text"
                            placeholder="Buscar por cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="border border-gray-300 rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500"
                        />
                    )}
                </div>

                <div className="overflow-x-auto rounded-lg shadow-lg bg-white">
                    <table className="w-full table-auto border-collapse">
                        <thead>
                            <tr>
                                <th className="min-w-[80px] py-2 px-2 md:py-4 md:px-3 text-base md:text-lg font-semibold text-white bg-red-500">
                                    Fecha y Hora
                                </th>
                                <th className="min-w-[80px] py-2 px-2 md:py-4 md:px-3 text-base md:text-lg font-semibold text-white bg-red-500">
                                    Cliente
                                </th>
                                <th className="min-w-[80px] py-2 px-2 md:py-4 md:px-3 text-base md:text-lg font-semibold text-white bg-red-500">
                                    Barbero
                                </th>
                                <th className="min-w-[80px] py-2 px-2 md:py-4 md:px-3 text-base md:text-lg font-semibold text-white bg-red-500">
                                    Servicios
                                </th>
                                <th className="min-w-[80px] py-2 px-2 md:py-4 md:px-3 text-base md:text-lg font-semibold text-white bg-red-500">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {citas.length > 0 ? (
                                citas.map((cita) => (
                                    <tr key={cita.idCita} className="bg-neutral-100">
                                        <td className="py-2 px-2 md:py-4 md:px-3 text-center text-xs md:text-base border-b border-gray-200">
                                            {formatFechaHora(cita.fecha)}
                                        </td>
                                        <td className="py-2 px-2 md:py-4 md:px-3 text-center text-xs md:text-base border-b border-gray-200">
                                            {cita.cliente ? `${cita.cliente.nombre} ${cita.cliente.apellido}` : "N/A"}
                                        </td>
                                        <td className="py-2 px-2 md:py-4 md:px-3 text-center text-xs md:text-base border-b border-gray-200">
                                            {cita.empleado ? `${cita.empleado.nombre} ${cita.empleado.apellido}` : "N/A"}
                                        </td>
                                        <td className="py-2 px-2 md:py-4 md:px-3 text-center text-xs md:text-base border-b border-gray-200">
                                            {cita.servicios.map(s => s.nombre).join(", ")}
                                        </td>
                                        <td className="py-2 px-2 md:py-4 md:px-3 text-center text-xs md:text-base border-b border-gray-200">
                                            <button
                                                onClick={() => openModal(cita.idCita)}
                                                className="px-2 py-1 md:px-3 md:py-1.5 rounded-md font-medium transition duration-200 text-blue-500 hover:bg-blue-100 mr-2"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(cita.idCita)}
                                                className="px-2 py-1 md:px-3 md:py-1.5 rounded-md font-medium transition duration-200 text-red-500 hover:bg-red-100"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="py-4 text-center text-gray-500">
                                        No hay citas registradas
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {showModal && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black/75 bg-opacity-50 z-50">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl p-6 space-y-6 border border-gray-200 max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-semibold flex items-center gap-2">
                                <PlusCircleIcon className="w-6 h-6 text-red-500" />{" "}
                                {editingCitaId ? "Editar Cita" : "Nueva Cita"}
                            </h2>

                            {error && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                {/* Información del cliente */}
                                <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
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

                                {/* Resumen de la cita */}
                                {(formData.servicios.length > 0 || formData.empleado || formData.fecha || formData.hora) && (
                                    <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                                        <h3 className="font-medium mb-3">Resumen de la cita</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                            {formData.servicios.length > 0 && (
                                                <div>
                                                    <p className="text-zinc-500">Servicios</p>
                                                    <p className="font-medium">
                                                        {formData.servicios.map(s => s.nombre).join(", ")}
                                                    </p>
                                                    <p className="text-zinc-500 mt-1">
                                                        Duración: {formData.servicios.reduce((t, s) => t + (parseInt(s.duracion) || 0), 0)} min
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
                                                        {formData.fecha ? format(new Date(formData.fecha), "EEEE d 'de' MMMM", { locale: es }) : ""}
                                                        {formData.hora && ` - ${formData.hora}`}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4 justify-end mt-6">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded-md"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md disabled:opacity-50"
                                        disabled={
                                            !formData.fecha ||
                                            !formData.hora ||
                                            !formData.empleado ||
                                            formData.servicios.length === 0
                                        }
                                    >
                                        {editingCitaId ? "Actualizar" : "Confirmar"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default TableCitas;