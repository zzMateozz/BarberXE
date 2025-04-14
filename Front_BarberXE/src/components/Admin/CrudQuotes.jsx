import React, { useState, useEffect } from "react";
import { Pencil, Trash2, Calendar } from "lucide-react";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import {
  fetchCitas,
  createCita,
  updateCita,
  deleteCita,
  fetchClientes,
  fetchEmpleados,
  fetchServicios,
  checkDisponibilidadEmpleado,
} from "../../services/QuotesService.js";
import { toast } from "react-toastify";
import Select from "react-select";

const styles = {
  tableContainer: "overflow-x-auto rounded-lg shadow-lg bg-white",
  table: "w-full table-auto border-collapse",
  th: "min-w-[80px] py-2 px-2 md:py-4 md:px-3 text-base md:text-lg font-semibold text-white bg-red-500",
  td: "py-2 px-2 md:py-4 md:px-3 text-center text-xs md:text-base border-b border-gray-200",
  button:
    "px-2 py-1 md:px-3 md:py-1.5 rounded-md font-medium transition duration-200",
  editButton: "text-blue-500 hover:bg-blue-100",
  deleteButton: "text-red-500 hover:bg-red-100",
};

const ValidationMessage = ({ message, isValid }) => {
  if (!message) return null;

  return (
    <div
      className={`text-sm mt-1 ${isValid ? "text-green-600" : "text-red-600"}`}
    >
      {message}
    </div>
  );
};

const TableCitas = ({ isCollapsed }) => {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCitaId, setEditingCitaId] = useState(null);

  // Datos para combobox
  const [clientes, setClientes] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [servicios, setServicios] = useState([]);

  // Formulario
  const [formData, setFormData] = useState({
    fecha: "",
    hora: "",
    cliente: null,
    empleado: null,
    servicios: [],
    imagenUrl: "",
  });

  // Errores de validación
  const [fechaError, setFechaError] = useState("");
  const [horaError, setHoraError] = useState("");
  const [clienteError, setClienteError] = useState("");
  const [empleadoError, setEmpleadoError] = useState("");
  const [serviciosError, setServiciosError] = useState("");
  const [disponibilidadError, setDisponibilidadError] = useState("");

  // Generar horas disponibles (8:00 AM - 10:00 PM cada 30 minutos)
  const horasDisponibles = Array.from({ length: 28 }, (_, i) => {
    const hour = 8 + Math.floor(i / 2);
    const minute = i % 2 === 0 ? "00" : "30";
    return `${hour.toString().padStart(2, "0")}:${minute}`;
  });

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

        setCitas(citasData);
        setClientes(clientesData);
        setEmpleados(empleadosData);
        setServicios(serviciosData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Buscar citas por cliente
  useEffect(() => {
    if (searchTerm) {
      const filtered = citas.filter(
        (cita) =>
          cita.cliente.nombre
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          cita.cliente.apellido.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setCitas(filtered);
    } else {
      // Si no hay término de búsqueda, recargar todas las citas
      const reloadCitas = async () => {
        try {
          const citasData = await fetchCitas();
          setCitas(citasData);
        } catch (err) {
          setError(err.message);
        }
      };
      reloadCitas();
    }
  }, [searchTerm]);

  const openModal = (citaId = null) => {
    setShowModal(true);
    setEditingCitaId(citaId);

    if (citaId !== null) {
      const citaToEdit = citas.find((c) => c.idCita === citaId);
      if (citaToEdit) {
        // Formatear fecha y hora para el input
        const fechaObj = new Date(citaToEdit.fecha);
        const fecha = fechaObj.toISOString().split("T")[0];
        const hora = fechaObj.toTimeString().substring(0, 5);

        setFormData({
          fecha,
          hora,
          cliente: citaToEdit.cliente,
          empleado: citaToEdit.empleado,
          servicios: citaToEdit.servicios,
          imagenUrl: citaToEdit.imagenUrl || "",
        });
      }
    } else {
      // Resetear formulario para nueva cita
      setFormData({
        fecha: "",
        hora: "",
        cliente: null,
        empleado: null,
        servicios: [],
        imagenUrl: "",
      });
    }

    // Resetear errores
    setFechaError("");
    setHoraError("");
    setClienteError("");
    setEmpleadoError("");
    setServiciosError("");
    setDisponibilidadError("");
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCitaId(null);
    setError(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validar disponibilidad cuando se selecciona empleado o cambia fecha/hora
    if (
      (name === "empleado" || name === "fecha" || name === "hora") &&
      formData.empleado &&
      formData.fecha &&
      formData.hora
    ) {
      validateDisponibilidad();
    }
  };

  const handleServiciosChange = (serviciosSeleccionados) => {
    setFormData((prev) => ({ ...prev, servicios: serviciosSeleccionados }));

    // Calcular duración total de servicios seleccionados
    const duracionTotal = serviciosSeleccionados.reduce(
      (total, servicio) => total + (servicio.duracion || 0),
      0
    );

    if (duracionTotal > 240) {
      setServiciosError("La duración total no puede exceder 4 horas");
    } else {
      setServiciosError("");
    }
  };

  const validateDisponibilidad = async () => {
    if (!formData.empleado || !formData.fecha || !formData.hora) return;

    try {
      const fechaHora = new Date(`${formData.fecha}T${formData.hora}`);
      const duracionTotal = formData.servicios.reduce(
        (total, servicio) => total + (servicio.duracion || 0),
        0
      );

      const disponible = await checkDisponibilidadEmpleado(
        formData.empleado.idEmpleado,
        fechaHora,
        duracionTotal,
        editingCitaId // Pasar ID si es edición para no chequear contra sí misma
      );

      if (!disponible) {
        setDisponibilidadError("El empleado no está disponible en ese horario");
      } else {
        setDisponibilidadError("");
      }
    } catch (err) {
      setDisponibilidadError("Error al verificar disponibilidad");
    }
  };

  const validateForm = () => {
    let isValid = true;

    // Validar fecha (no puede ser en el pasado)
    if (!formData.fecha) {
      setFechaError("La fecha es requerida");
      isValid = false;
    } else {
      const fechaSeleccionada = new Date(formData.fecha);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      if (fechaSeleccionada < hoy) {
        setFechaError("No se pueden agendar citas en fechas pasadas");
        isValid = false;
      } else {
        setFechaError("");
      }
    }

    // Validar hora (8:00 - 22:00)
    if (!formData.hora) {
      setHoraError("La hora es requerida");
      isValid = false;
    } else {
      const [horas] = formData.hora.split(":").map(Number);
      if (horas < 8 || horas >= 22) {
        setHoraError("Horario laboral: 8:00 - 22:00");
        isValid = false;
      } else {
        setHoraError("");
      }
    }

    // Validar cliente
    if (!formData.cliente) {
      setClienteError("Seleccione un cliente");
      isValid = false;
    } else {
      setClienteError("");
    }

    // Validar empleado
    if (!formData.empleado) {
      setEmpleadoError("Seleccione un empleado");
      isValid = false;
    } else {
      setEmpleadoError("");
    }

    // Validar servicios
    if (formData.servicios.length === 0) {
      setServiciosError("Seleccione al menos un servicio");
      isValid = false;
    } else {
      setServiciosError("");
    }

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Por favor complete todos los campos correctamente");
      return;
    }

    if (disponibilidadError) {
      toast.error("El empleado no está disponible en ese horario");
      return;
    }

    try {
      // Crear objeto fecha-hora combinado
      const fechaHora = new Date(`${formData.fecha}T${formData.hora}`);

      // Preparar datos para enviar
      const citaData = {
        fecha: fechaHora,
        cliente: { idCliente: formData.cliente.idCliente },
        empleado: { idEmpleado: formData.empleado.idEmpleado },
        servicios: formData.servicios.map((s) => ({
          idServicio: s.idServicio,
        })),
        imagenUrl: formData.imagenUrl,
      };

      if (editingCitaId !== null) {
        // Actualizar cita existente
        const updatedCita = await updateCita(editingCitaId, citaData);
        setCitas((prev) =>
          prev.map((c) => (c.idCita === editingCitaId ? updatedCita : c))
        );
        toast.success("Cita actualizada con éxito");
      } else {
        // Crear nueva cita
        const newCita = await createCita(citaData);
        setCitas((prev) => [...prev, newCita]);
        toast.success("Cita creada con éxito");
      }

      closeModal();
    } catch (err) {
      toast.error(err.message || "Error al guardar la cita");
    }
  };

  const handleDelete = async (citaId) => {
    try {
      await deleteCita(citaId);
      setCitas((prev) => prev.filter((c) => c.idCita !== citaId));
      toast.success("Cita eliminada con éxito");
    } catch (err) {
      toast.error(err.message || "Error al eliminar la cita");
    }
  };

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
            <PlusCircleIcon className="w-6 h-6" /> Agregar Cita
          </button>
          <input
            type="text"
            placeholder="Buscar por cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div
          className={`${styles.tableContainer} ${
            isCollapsed ? "mx-4" : "mx-0"
          }`}
        >
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Fecha y Hora</th>
                <th className={styles.th}>Cliente</th>
                <th className={styles.th}>Empleado</th>
                <th className={styles.th}>Servicios</th>
                <th className={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {citas.map((cita) => (
                <tr key={cita.idCita} className="bg-neutral-100">
                  <td className={styles.td}>{formatFechaHora(cita.fecha)}</td>
                  <td className={styles.td}>
                    {cita.cliente.nombre} {cita.cliente.apellido}
                  </td>
                  <td className={styles.td}>
                    {cita.empleado.nombre} {cita.empleado.apellido}
                  </td>
                  <td className={styles.td}>
                    {cita.servicios.map((s) => s.nombre).join(", ")}
                  </td>
                  <td className={styles.td}>
                    <button
                      onClick={() => openModal(cita.idCita)}
                      className={`${styles.button} ${styles.editButton} mr-2`}
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(cita.idCita)}
                      className={`${styles.button} ${styles.deleteButton}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/75 bg-opacity-50 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-6 border border-gray-200 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <PlusCircleIcon className="w-6 h-6 text-red-500" />{" "}
                {editingCitaId !== null ? "Editar Cita" : "Nueva Cita"}
              </h2>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Fecha <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        name="fecha"
                        value={formData.fecha}
                        onChange={handleChange}
                        min={new Date().toISOString().split("T")[0]}
                        className={`mt-1 w-full border rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500 ${
                          fechaError ? "border-red-500" : "border-gray-300"
                        }`}
                        required
                        style={{
                          backgroundImage: "none",
                          appearance: "none",
                        }}
                      />
                      <Calendar className="absolute right-3 top-3 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                    <ValidationMessage message={fechaError} isValid={false} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Hora <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="hora"
                        value={formData.hora}
                        onChange={handleChange}
                        className={`mt-1 w-full border rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500 ${
                          horaError ? "border-red-500" : "border-gray-300"
                        }`}
                        required
                      >
                        <option value="">Seleccione hora</option>
                        {horasDisponibles.map((hora) => (
                          <option key={hora} value={hora}>
                            {hora}
                          </option>
                        ))}
                      </select>
                    </div>
                    <ValidationMessage message={horaError} isValid={false} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Cliente <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={clientes.map((c) => ({
                      value: c.idCliente,
                      label: `${c.nombre} ${c.apellido}`,
                    }))}
                    value={
                      formData.cliente
                        ? {
                            value: formData.cliente.idCliente,
                            label: `${formData.cliente.nombre} ${formData.cliente.apellido}`,
                          }
                        : null
                    }
                    onChange={(selected) =>
                      handleSelectChange(
                        "cliente",
                        clientes.find((c) => c.idCliente === selected.value)
                      )
                    }
                    placeholder="Seleccione un cliente"
                    className="mt-1"
                  />
                  <ValidationMessage message={clienteError} isValid={false} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Empleado <span className="text-red-500">*</span>
                  </label>
                  <Select
                    options={empleados.map((e) => ({
                      value: e.idEmpleado,
                      label: `${e.nombre} ${e.apellido}`,
                    }))}
                    value={
                      formData.empleado
                        ? {
                            value: formData.empleado.idEmpleado,
                            label: `${formData.empleado.nombre} ${formData.empleado.apellido}`,
                          }
                        : null
                    }
                    onChange={(selected) =>
                      handleSelectChange(
                        "empleado",
                        empleados.find((e) => e.idEmpleado === selected.value)
                      )
                    }
                    placeholder="Seleccione un empleado"
                    className="mt-1"
                  />
                  <ValidationMessage message={empleadoError} isValid={false} />
                  {disponibilidadError && (
                    <ValidationMessage
                      message={disponibilidadError}
                      isValid={false}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Servicios <span className="text-red-500">*</span>
                  </label>
                  <Select
                    isMulti
                    options={servicios.map((s) => ({
                      value: s.idServicio,
                      label: s.nombre,
                    }))}
                    value={formData.servicios.map((s) => ({
                      value: s.idServicio,
                      label: s.nombre,
                    }))}
                    onChange={(selected) =>
                      handleServiciosChange(
                        selected.map((item) =>
                          servicios.find((s) => s.idServicio === item.value)
                        )
                      )
                    }
                    placeholder="Seleccione servicios"
                    className="mt-1"
                  />
                  <ValidationMessage message={serviciosError} isValid={false} />
                  {formData.servicios.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      Duración total:{" "}
                      {formData.servicios.reduce(
                        (total, s) => total + (s.duracion || 0),
                        0
                      )}{" "}
                      minutos
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    URL de Imagen (Opcional)
                  </label>
                  <input
                    type="url"
                    name="imagenUrl"
                    value={formData.imagenUrl}
                    onChange={handleChange}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-4 justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded-md"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md"
                    disabled={
                      !!fechaError ||
                      !!horaError ||
                      !!clienteError ||
                      !!empleadoError ||
                      !!serviciosError ||
                      !!disponibilidadError
                    }
                  >
                    {editingCitaId !== null ? "Actualizar" : "Guardar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Estilos inline para mejorar el datepicker */}
      <style jsx>{`
        input[type="date"]::-webkit-calendar-picker-indicator {
          opacity: 0;
          position: absolute;
          right: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
        }
        input[type="date"] {
          position: relative;
        }
      `}</style>
    </section>
  );
};

export default TableCitas;