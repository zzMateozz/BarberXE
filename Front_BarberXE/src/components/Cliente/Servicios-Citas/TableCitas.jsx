"use client"
import React, { useState, useEffect } from "react";
import { Pencil, Trash2, Search, Plus, Calendar, Clock, User, Users, Scissors, Check, X, Loader2 } from "lucide-react";
import {
    createCita,
    updateCita,
    deleteCita,
    fetchEmpleados,
    fetchServicios,
    fetchCitasByClienteId,
    fetchClienteByUserId,
    fetchCitas
} from "../../../services/QuotesService.js";
import { toast } from "react-toastify";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimeSelect } from "../Hora-Calendario/Hour.jsx";
import { DatePicker } from "../Hora-Calendario/Calendar.jsx";
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
    // Estados principales
    const [citas, setCitas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userLoading, setUserLoading] = useState(true);
    const [todasLasCitas, setTodasLasCitas] = useState([]);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingCitaId, setEditingCitaId] = useState(null);
    const [currentStep, setCurrentStep] = useState("servicio");

    // Datos para el formulario
    const [empleados, setEmpleados] = useState([]);
    const [servicios, setServicios] = useState([]);
    const [barberos, setBarberos] = useState([]);

    // Estado del usuario procesado
    const [clienteInfo, setClienteInfo] = useState(null);

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
    // CORRECCIÓN: Verificar que citas sea un array antes de usar slice
    const currentItems = Array.isArray(citas) ? citas.slice(indexOfFirstItem, indexOfLastItem) : [];
    const totalPages = Math.ceil((Array.isArray(citas) ? citas.length : 0) / itemsPerPage);

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

    // Función mejorada para obtener usuario desde localStorage
    const getUserFromStorage = () => {
        try {
            // Intentar diferentes claves de localStorage y sessionStorage
            const possibleKeys = ['user', 'currentUser', 'authUser', 'authData', 'userData'];
            const storages = [localStorage, sessionStorage];

            for (const storage of storages) {
                for (const key of possibleKeys) {
                    try {
                        const storedData = storage.getItem(key);
                        if (storedData) {
                            const parsed = JSON.parse(storedData);
                            console.log(`Datos encontrados en ${storage === localStorage ? 'localStorage' : 'sessionStorage'}.${key}:`, parsed);

                            // Si el objeto tiene una propiedad user, devolverla
                            if (parsed.user) {
                                return parsed.user;
                            }

                            // Si el objeto parece ser un usuario directamente
                            if (parsed.id || parsed.idCliente || parsed.username || parsed.email || parsed.nombre) {
                                return parsed;
                            }

                            // Si tiene una propiedad cliente
                            if (parsed.cliente) {
                                return parsed.cliente;
                            }
                        }
                    } catch (parseError) {
                        console.warn(`Error parseando ${key} desde storage:`, parseError);
                    }
                }
            }

            return null;
        } catch (error) {
            console.error("Error obteniendo user desde storage:", error);
            return null;
        }
    };

    // 2. Reemplazar la función processUserInfo
    const processUserInfo = async (userObj) => {
        if (!userObj) {
            console.log("No se recibió objeto de usuario");
            return null;
        }

        console.log("Procesando información del usuario:", userObj);

        // Extraer userId (no clienteId directamente)
        let userId = null;

        const possibleUserIds = [
            userObj.id,
            userObj.idUser,
            userObj.userId,
            userObj.user?.id,
            userObj.user?.idUser
        ];

        userId = possibleUserIds.find(id => id != null);

        if (!userId) {
            console.error("No se pudo extraer el userId:", userObj);
            return null;
        }

        console.log("UserId extraído:", userId);

        try {
            console.log("Obteniendo información del cliente desde API usando userId:", userId);
            const clienteResponse = await fetchClienteByUserId(userId);

            console.log("Respuesta del cliente:", clienteResponse);

            if (clienteResponse && clienteResponse.data) {
                const clienteData = clienteResponse.data;

                return {
                    idCliente: clienteData.idCliente || clienteData.id,
                    userId: userId,
                    nombre: clienteData.nombre || clienteData.firstName || userObj.nombre || userObj.firstName || 'Usuario',
                    apellido: clienteData.apellido || clienteData.lastName || userObj.apellido || userObj.lastName || '',
                    email: clienteData.email || userObj.email || '',
                    telefono: clienteData.telefono || clienteData.phone || userObj.telefono || userObj.phone || ''
                };
            } else {
                console.error("No se recibió información válida del cliente");
                return null;
            }
        } catch (error) {
            console.error("Error obteniendo información del cliente desde API:", error);

            // Si la API falla, intentar usar la información disponible
            // pero advertir que puede no ser correcta
            console.warn("Usando información de fallback - puede no tener el clienteId correcto");
            return {
                idCliente: null, // No tenemos el clienteId correcto
                userId: userId,
                nombre: userObj.nombre || userObj.firstName || userObj.name || 'Usuario',
                apellido: userObj.apellido || userObj.lastName || userObj.surname || '',
                email: userObj.email || '',
                telefono: userObj.telefono || userObj.phone || '',
                error: "No se pudo obtener el clienteId correcto"
            };
        }
    };

    // 3. Actualizar el useEffect que procesa la información del usuario
    useEffect(() => {
        const processUser = async () => {
            console.log("Current user recibido:", currentUser);

            let userToProcess = currentUser;

            // Si no viene currentUser por props, intentar obtenerlo del storage
            if (!userToProcess) {
                console.log("No se recibió currentUser, intentando obtener del storage...");
                userToProcess = getUserFromStorage();
            }

            if (userToProcess) {
                try {
                    const clienteData = await processUserInfo(userToProcess);
                    console.log("Cliente procesado:", clienteData);

                    if (clienteData && clienteData.idCliente) {
                        setClienteInfo(clienteData);
                        setUserLoading(false);
                    } else {
                        console.error("No se pudo extraer la información del cliente:", userToProcess);
                        setError("No se pudo cargar la información del usuario. Estructura de datos no reconocida.");
                        setUserLoading(false);
                    }
                } catch (error) {
                    console.error("Error procesando usuario:", error);
                    setError("Error al cargar la información del usuario.");
                    setUserLoading(false);
                }
            } else {
                console.log("Esperando currentUser o datos en storage...");
                // Dar tiempo para que el usuario se cargue
                const timeout = setTimeout(async () => {
                    const fallbackUser = getUserFromStorage();
                    if (fallbackUser) {
                        try {
                            const clienteData = await processUserInfo(fallbackUser);
                            if (clienteData && clienteData.idCliente) {
                                setClienteInfo(clienteData);
                                setUserLoading(false);
                                return;
                            }
                        } catch (error) {
                            console.error("Error procesando fallback user:", error);
                        }
                    }

                    setError("No se pudo cargar la información del usuario. Por favor, inicie sesión nuevamente.");
                    setUserLoading(false);
                }, 3000);

                return () => clearTimeout(timeout);
            }
        };

        processUser();
    }, [currentUser]);

    // Función para crear una fecha local a partir de componentes
    const createLocalDate = (year, month, day, hours, minutes) => {
        const date = new Date(year, month - 1, day, hours, minutes);
        return date;
    };

    // Función para formatear fecha en el resumen
    const formatDateForSummary = (dateString) => {
        try {
            if (dateString instanceof Date) {
                return format(dateString, "EEEE d 'de' MMMM", { locale: es });
            }

            if (typeof dateString === 'string' && dateString.includes('T')) {
                const date = parseISO(dateString);
                return format(date, "EEEE d 'de' MMMM", { locale: es });
            }

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
    
// CORRECCIÓN: Función para normalizar datos de la API
    const normalizeApiResponse = (data) => {
        // Si data es undefined o null, devolver array vacío
        if (!data) {
            return [];
        }

        // Si data ya es un array, devolverlo
        if (Array.isArray(data)) {
            return data;
        }

        // Si data es un objeto con propiedad data que es array
        if (data.data && Array.isArray(data.data)) {
            return data.data;
        }

        // Si data es un objeto con propiedades que parecen ser arrays
        if (typeof data === 'object') {
            // Buscar propiedades que sean arrays
            const arrayKeys = Object.keys(data).filter(key => Array.isArray(data[key]));
            if (arrayKeys.length > 0) {
                return data[arrayKeys[0]];
            }
        }

        // Si nada de lo anterior funciona, devolver array vacío
        console.warn("Formato de datos no reconocido:", data);
        return [];
    };

    // 3. Actualizar el useEffect para cargar datos
   // Función actualizada para cargar datos
useEffect(() => {
    const loadData = async () => {
        if (!clienteInfo) {
            return; // Esperar a que clienteInfo se cargue
        }

        // Verificar que tenemos el clienteId correcto
        if (!clienteInfo.idCliente) {
            console.error("No se tiene clienteId válido:", clienteInfo);
            setError("No se pudo determinar el ID del cliente correctamente");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            console.log("Cargando datos para clienteId:", clienteInfo.idCliente);

            // CAMBIO: Cargar tanto las citas del cliente como todas las citas
            const [citasClienteResponse, todasCitasResponse, empleadosResponse, serviciosResponse] = await Promise.all([
                fetchCitasByClienteId(clienteInfo.idCliente), // Citas del cliente
                fetchCitas(), // NUEVO: Todas las citas para validar horarios
                fetchEmpleados(),
                fetchServicios()
            ]);

            console.log("Respuesta de citas del cliente:", citasClienteResponse);
            console.log("Respuesta de todas las citas:", todasCitasResponse);

            const citasClienteData = normalizeApiResponse(citasClienteResponse);
            const todasCitasData = normalizeApiResponse(todasCitasResponse); // NUEVO
            const empleadosData = normalizeApiResponse(empleadosResponse);
            const serviciosData = normalizeApiResponse(serviciosResponse).map(s => ({
                ...s,
                duracion: parseInt(s.duracion) || 0
            }));

            setCitas(citasClienteData); // Solo citas del cliente para la tabla
            setTodasLasCitas(todasCitasData); // NUEVO: Todas las citas para validaciones

            // Filtrar barberos activos
            const barberosActivos = empleadosData.filter(
                e => e.cargo?.toLowerCase() === "barbero" && e.estado?.toLowerCase() === "activo"
            );
            setBarberos(barberosActivos);

            // Filtrar servicios activos
            const serviciosActivos = serviciosData.filter(
                s => s.estado?.toLowerCase() === "activo"
            );
            setServicios(serviciosActivos);

            setLoading(false);
        } catch (err) {
            console.error("Error cargando datos:", err);
            setError(err.message || "Error al cargar los datos");
            setLoading(false);
        }
    };

    loadData();
}, [clienteInfo]);

    // Manejar búsqueda por barbero
    useEffect(() => {
        const loadFilteredCitas = async () => {
            if (!clienteInfo || !clienteInfo.idCliente) return;

            try {
                const citasResponse = await fetchCitasByClienteId(clienteInfo.idCliente);
                const citasCliente = normalizeApiResponse(citasResponse);

                if (searchTerm) {
                    const filtered = citasCliente.filter(cita =>
                        cita.empleado?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        cita.empleado?.apellido?.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                    setCitas(filtered);
                } else {
                    setCitas(citasCliente);
                }

                setCurrentPage(1);
            } catch (err) {
                console.error("Error filtrando citas:", err);
                setError(err.message);
            }
        };

        loadFilteredCitas();
    }, [searchTerm, clienteInfo]);

    // Abrir modal para nueva/editar cita
    const openModal = (citaId = null) => {
        if (!clienteInfo) {
            toast.error("No se pudo cargar la información del usuario");
            return;
        }

        setShowModal(true);
        setEditingCitaId(citaId);
        setCurrentStep("servicio");

        if (citaId) {
            const citaToEdit = citas.find(c => c.idCita === citaId);
            if (citaToEdit) {
                const fechaObj = new Date(citaToEdit.fecha);
                const year = fechaObj.getFullYear();
                const month = String(fechaObj.getMonth() + 1).padStart(2, '0');
                const day = String(fechaObj.getDate()).padStart(2, '0');
                const fecha = `${year}-${month}-${day}`;

                const hours = String(fechaObj.getHours()).padStart(2, '0');
                const minutes = String(fechaObj.getMinutes()).padStart(2, '0');
                const hora = `${hours}:${minutes}`;

                setFormData({
                    fecha,
                    hora,
                    cliente: clienteInfo,
                    empleado: citaToEdit.empleado,
                    servicios: citaToEdit.servicios || [],
                });
            }
        } else {
            setFormData({
                fecha: "",
                hora: "",
                cliente: clienteInfo,
                empleado: null,
                servicios: [],
            });
        }
    };

    // ✅ Función mejorada para detectar conflictos de horario
    const detectarConflictoHorario = (error) => {
        const errorMessage = error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            String(error);

        // Patrones para detectar conflictos de horario
        const patronesConflicto = [
            /empleado.*ocupado/i,
            /horario.*ocupado/i,
            /cita.*existente/i,
            /conflicto.*horario/i,
            /already.*booked/i,
            /schedule.*conflict/i,
            /time.*overlap/i,
            /solapamiento/i,
            /disponible/i,
            /busy/i,
            /occupied/i
        ];

        return patronesConflicto.some(patron => patron.test(errorMessage));
    };


    const extraerInfoConflicto = (errorMessage) => {
        const info = {
            horarioOcupado: null,
            duracionOcupada: null,
            empleadoOcupado: null,
            citaExistente: null
        };

        // Extraer rango de horas (múltiples formatos)
        const patronesHorario = [
            /(\d{1,2}:\d{2}(?:\s*[ap]\.?\s*m\.?)?)\s*[-–—]\s*(\d{1,2}:\d{2}(?:\s*[ap]\.?\s*m\.?)?)/gi,
            /desde\s+las?\s+(\d{1,2}:\d{2})\s+hasta\s+las?\s+(\d{1,2}:\d{2})/gi,
            /entre\s+las?\s+(\d{1,2}:\d{2})\s+y\s+las?\s+(\d{1,2}:\d{2})/gi,
            /de\s+(\d{1,2}:\d{2})\s+a\s+(\d{1,2}:\d{2})/gi,
            /(\d{1,2}:\d{2})\s*a\s*(\d{1,2}:\d{2})/gi
        ];

        for (const patron of patronesHorario) {
            const match = errorMessage.match(patron);
            if (match) {
                info.horarioOcupado = match[0];
                break;
            }
        }

        // Si no encontró rango, buscar hora individual
        if (!info.horarioOcupado) {
            const horaIndividual = errorMessage.match(/(\d{1,2}:\d{2})/g);
            if (horaIndividual && horaIndividual.length >= 1) {
                info.horarioOcupado = horaIndividual[0];
            }
        }

        // Extraer duración
        const patronesDuracion = [
            /(\d+)\s*(?:minutos?|mins?|min)/gi,
            /(\d+)\s*(?:horas?|hrs?|h)/gi,
            /duración?\s*:?\s*(\d+)/gi
        ];

        for (const patron of patronesDuracion) {
            const match = errorMessage.match(patron);
            if (match) {
                info.duracionOcupada = match[0];
                break;
            }
        }

        // Extraer nombre del empleado
        const patronesEmpleado = [
            /empleado\s+([a-záéíóúñ\s]+)/gi,
            /barbero\s+([a-záéíóúñ\s]+)/gi,
            /(?:el|la)\s+([a-záéíóúñ\s]+)\s+(?:está|tiene)/gi
        ];

        for (const patron of patronesEmpleado) {
            const match = errorMessage.match(patron);
            if (match && match[1]) {
                info.empleadoOcupado = match[1].trim();
                break;
            }
        }

        // Extraer información de cita existente
        const patronCitaExistente = /cita\s+(?:existente|programada|agendada)/gi;
        if (patronCitaExistente.test(errorMessage)) {
            info.citaExistente = true;
        }

        return info;
    };

    // Cerrar modal
    const closeModal = () => {
        setShowModal(false);
        setEditingCitaId(null);
        setError(null);
        // Limpiar errores
        setFechaError("");
        setHoraError("");
        setEmpleadoError("");
        setServiciosError("");
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

        if (formData.fecha && formData.hora) {
            const [year, month, day] = formData.fecha.split('-').map(Number);
            const [hours, minutes] = formData.hora.split(':').map(Number);

            const fechaHoraCita = createLocalDate(year, month, day, hours, minutes);
            const ahora = new Date();

            if (fechaHoraCita < ahora) {
                setFechaError("No puede agendar citas en el pasado");
                isValid = false;
            }

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

const obtenerCitasOcupadasEmpleado = (empleadoId, fecha) => {
    if (!empleadoId || !fecha || !Array.isArray(todasLasCitas)) { // CAMBIO: usar todasLasCitas
        console.log("Parámetros faltantes para obtener citas ocupadas:", { empleadoId, fecha, todasLasCitas: !!todasLasCitas });
        return [];
    }
    
    console.log("Buscando citas ocupadas para empleado:", empleadoId, "en fecha:", fecha);
    console.log("Total de citas disponibles:", todasLasCitas.length);
    
    // 1. Filtrar citas del empleado en la fecha seleccionada
    const citasEmpleado = todasLasCitas.filter(cita => {
        const citaEmpleadoId = cita.empleado?.idEmpleado;
        const citaFecha = new Date(cita.fecha).toISOString().split('T')[0];
        
        const coincide = citaEmpleadoId === empleadoId && citaFecha === fecha;
        
        if (coincide) {
            console.log("Cita encontrada:", {
                citaId: cita.idCita,
                empleado: cita.empleado?.nombre,
                fecha: citaFecha,
                hora: new Date(cita.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
            });
        }
        
        return coincide;
    });

    console.log(`Encontradas ${citasEmpleado.length} citas para el empleado ${empleadoId} en ${fecha}`);

    // 2. Mapear horarios ocupados
    return citasEmpleado.map(cita => {
        const inicio = new Date(cita.fecha);
        const duracionMinutos = cita.duracionTotal || 
                              (cita.servicios && Array.isArray(cita.servicios) 
                                  ? cita.servicios.reduce((total, s) => total + (parseInt(s.duracion) || 30), 0)
                                  : 30);
        
        const fin = new Date(inicio.getTime() + duracionMinutos * 60000);
        
        const horarioFormateado = `${inicio.getHours().toString().padStart(2, '0')}:${inicio.getMinutes().toString().padStart(2, '0')} - ${fin.getHours().toString().padStart(2, '0')}:${fin.getMinutes().toString().padStart(2, '0')}`;
        
        const serviciosTexto = cita.servicios && Array.isArray(cita.servicios) 
            ? cita.servicios.map(s => s.nombre || s.titulo || 'Servicio').join(', ')
            : 'Sin servicios especificados';

        const esTuCita = cita.cliente?.idCliente === clienteInfo?.idCliente;
        
        console.log("Procesando cita:", {
            id: cita.idCita,
            horario: horarioFormateado,
            duracion: duracionMinutos,
            servicios: serviciosTexto,
            esTuCita
        });

        return {
            idCita: cita.idCita,
            horario: horarioFormateado,
            duracion: duracionMinutos,
            servicios: serviciosTexto,
            esTuCita,
            cliente: esTuCita ? 'Tu cita' : (cita.cliente?.nombre || 'Cliente')
        };
    }).sort((a, b) => {
        // Ordenar por hora de inicio
        const horaA = a.horario.split(' - ')[0];
        const horaB = b.horario.split(' - ')[0];
        return horaA.localeCompare(horaB);
    });
};

const MostrarHorariosOcupados = ({ empleado, fecha }) => {
    if (!empleado || !fecha) return null;

    const citasOcupadas = obtenerCitasOcupadasEmpleado(empleado.idEmpleado, fecha);

    if (citasOcupadas.length === 0) {
        return (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                    <Check className="w-4 h-4" />
                    <span className="font-medium">¡Excelente! {empleado.nombre} está completamente disponible este día.</span>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-yellow-600" />
                <h4 className="font-medium text-yellow-800">
                    Horarios ocupados - {empleado.nombre} {empleado.apellido}
                </h4>
            </div>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
                {citasOcupadas.map((cita, index) => (
                    <div 
                        key={`${cita.idCita}-${index}`}
                        className={`p-2 rounded-md text-sm ${
                            cita.esTuCita 
                                ? 'bg-blue-100 border border-blue-300' 
                                : 'bg-white border border-gray-200'
                        }`}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <div className={`font-mono font-medium ${
                                    cita.esTuCita ? 'text-blue-700' : 'text-gray-700'
                                }`}>
                                    {cita.horario}
                                </div>
                                <div className={`text-xs mt-1 ${
                                    cita.esTuCita ? 'text-blue-600' : 'text-gray-500'
                                }`}>
                                    {cita.servicios} ({cita.duracion} min)
                                </div>
                            </div>
                            {cita.esTuCita && (
                                <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                                    Tu cita
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="mt-3 text-xs text-yellow-700 bg-yellow-100 p-2 rounded">
                💡 <strong>Tip:</strong> Elige un horario que no se superponga con los mostrados arriba.
            </div>
        </div>
    );
};

const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
        toast.error("Por favor complete todos los campos requeridos")
        return
    }

    setSubmitting(true)
    const timeoutId = setTimeout(() => {
        setSubmitting(false)
        toast.warning("La operación está tardando más de lo esperado")
    }, 10000)

    try {
        setError(null)
        const fechaSolo = formData.fecha?.split("T")[0]
        const hora = formData.hora

        if (!fechaSolo || !hora) throw new Error("Fecha u hora incompleta")

        const [year, month, day] = fechaSolo.split("-").map(Number)
        const [hour, minute] = hora.split(":").map(Number)

        const fechaHora = new Date(year, month - 1, day, hour, minute)

        if (isNaN(fechaHora.getTime())) {
            throw new Error("Fecha y hora inválidas")
        }

        const duracionTotal = formData.servicios.reduce(
            (total, servicio) => total + (parseInt(servicio?.duracion) || 30),
            0
        )

        const citaData = {
            fecha: fechaHora.toISOString(),
            clienteId: clienteInfo.idCliente,
            empleadoId: formData.empleado.idEmpleado,
            servicioIds: formData.servicios.map((s) => s.idServicio),
            duracionTotal,
        }

        if (editingCitaId) {
            await updateCita(editingCitaId, citaData)
            toast.success(
                <div>
                    <p>✅ Cita actualizada correctamente</p>
                    <p><strong>Empleado:</strong> {formData.empleado.nombre} {formData.empleado.apellido}</p>
                    <p><strong>Duración:</strong> {duracionTotal} minutos</p>
                    <p><strong>Horario:</strong> {formData.hora} - {calculateEndTime(formData.hora, duracionTotal)}</p>
                </div>,
                { autoClose: 8000 }
            )
        } else {
            await createCita(citaData)
            toast.success(
                <div>
                    <p>✅ Cita creada correctamente</p>
                    <p><strong>Empleado:</strong> {formData.empleado.nombre} {formData.empleado.apellido}</p>
                    <p><strong>Duración:</strong> {duracionTotal} minutos</p>
                    <p><strong>Horario:</strong> {formData.hora} - {calculateEndTime(formData.hora, duracionTotal)}</p>
                </div>,
                { autoClose: 8000 }
            )
        }

        // Recargar datos - ACTUALIZADO para recargar ambos conjuntos de datos
        const [citasClienteActualizadas, todasCitasActualizadas] = await Promise.all([
            fetchCitasByClienteId(clienteInfo.idCliente),
            fetchCitas()
        ]);
        
        setCitas(normalizeApiResponse(citasClienteActualizadas));
        setTodasLasCitas(normalizeApiResponse(todasCitasActualizadas));
        closeModal()

    } catch (error) {
        console.error("Error al guardar cita:", error)

        const duracionTotal = formData.servicios.reduce(
            (total, servicio) => total + (parseInt(servicio?.duracion) || 30),
            0
        )

        // ✅ Manejo mejorado de errores de conflicto
        const statusCode = error.response?.status;
        const isConflictoHorario = statusCode === 409 ||
            statusCode === 400 ||
            detectarConflictoHorario(error);

        if (isConflictoHorario) {
            const errorMessage = error.response?.data?.message ||
                error.response?.data?.error ||
                error.message;

            const infoConflicto = extraerInfoConflicto(errorMessage);

            // CAMBIO: Usar todasLasCitas en lugar de citas
            const citasOcupadas = obtenerCitasOcupadasEmpleado(
                formData.empleado.idEmpleado,
                formData.fecha
            );

            toast.error(
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">⚠️</span>
                        <strong className="text-red-700">Horario No Disponible</strong>
                    </div>

                    <div className="text-sm space-y-2">
                        <p>El empleado <strong>{formData.empleado.nombre} {formData.empleado.apellido}</strong> ya está ocupado.</p>

                        <div className="bg-red-50 border-l-4 border-red-400 p-2 rounded">
                            <p className="text-red-800 font-medium">🚫 Intento de reserva:</p>
                            <p className="text-red-700 text-xs">
                                {formData.hora} - {calculateEndTime(formData.hora, duracionTotal)} ({duracionTotal} min)
                            </p>
                        </div>

                       <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                            <div className="mb-3 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-red-600" />
                                <h3 className="text-red-800 font-semibold">
                                    Horarios ocupados para {formData.empleado.nombre}
                                </h3>
                            </div>

                            {citasOcupadas.length > 0 ? (
                                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                                    {citasOcupadas.map((cita, index) => (
                                        <div key={`error-${cita.idCita}-${index}`} className={`p-3 rounded-md shadow-xs border ${
                                            cita.esTuCita 
                                                ? 'bg-blue-50 border-blue-200' 
                                                : 'bg-white border-red-100'
                                        }`}>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className={`font-mono text-sm font-medium ${
                                                        cita.esTuCita ? 'text-blue-700' : 'text-red-700'
                                                    }`}>
                                                        {cita.horario}
                                                    </div>
                                                    <div className={`text-xs mt-1 ${
                                                        cita.esTuCita ? 'text-blue-600' : 'text-red-500'
                                                    }`}>
                                                        ({cita.duracion} min)
                                                    </div>
                                                    <div className={`text-xs ${
                                                        cita.esTuCita ? 'text-blue-500' : 'text-gray-500'
                                                    }`}>
                                                    </div>
                                                </div>
                                                {cita.esTuCita && (
                                                    <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                                                        Tu cita
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-red-600 text-sm">
                                    No se encontraron citas registradas (pero el horario está ocupado)
                                </div>
                            )}
                        </div>

                        <div className="mt-2 p-2 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                            <p className="text-yellow-800 font-medium">💡 Sugerencias:</p>
                            <ul className="text-yellow-700 text-xs list-disc list-inside space-y-1">
                                <li>Elija otro horario disponible</li>
                                <li>Seleccione un empleado diferente</li>
                                <li>Verifique los horarios ocupados mostrados arriba</li>
                            </ul>
                        </div>
                    </div>
                </div>,
                {
                    autoClose: 15000,
                    className: "toast-conflict"
                }
            )
        } else {
            // Error general
            toast.error(
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">❌</span>
                        <strong>Error al {editingCitaId ? "actualizar" : "crear"} la cita</strong>
                    </div>
                    <p className="text-sm">{error.response?.data?.message || error.message}</p>
                    {error.response?.status && (
                        <p className="text-xs text-gray-600 mt-1">Código de error: {error.response.status}</p>
                    )}
                </div>,
                { autoClose: 8000 }
            )
        }
    } finally {
        setSubmitting(false)
        clearTimeout(timeoutId)
    }
}

    // Eliminar cita
    const handleDelete = async (citaId) => {
        if (window.confirm("¿Está seguro que desea eliminar esta cita?")) {
            try {
                await deleteCita(citaId);
                setCitas(prev => Array.isArray(prev) ? prev.filter(c => c.idCita !== citaId) : []);
                toast.success("Cita eliminada con éxito");
            } catch (err) {
                console.error("Error eliminando cita:", err);
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
                <TabsTrigger value="servicio" onClick={() => setCurrentStep("servicio")} className="text-sm">
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

    // Mostrar loading mientras se carga el usuario
    if (userLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
                <span className="ml-2">Cargando información del usuario...</span>
            </div>
        );
    }

    // Mostrar error si no se pudo cargar el usuario
    if (!clienteInfo) {
        return (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md mb-6">
                <div className="flex items-center">
                    <X className="h-5 w-5 text-red-500 mr-2" />
                    <div>
                        <h3 className="text-red-800 font-medium">Error de usuario</h3>
                        <p className="text-red-700 text-sm mt-1">
                            {error || "No se pudo cargar la información del usuario. Por favor, inicie sesión nuevamente."}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-2 text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                        >
                            Recargar página
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
            </div>
        );
    }

    if (error && clienteInfo) {
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
                    <h1 className="text-2xl font-semibold text-zinc-800 mb-2">Mis Citas</h1>
                    <p className="text-zinc-500 text-sm">
                        Administra tus citas programadas - {clienteInfo.nombre} {clienteInfo.apellido}
                    </p>
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
                            placeholder="Buscar por barbero..."
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
                                        <td colSpan="4" className="py-8 text-center text-zinc-500">
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