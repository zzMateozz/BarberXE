"use client"
import { useState, useEffect } from "react"
import { Pencil, Trash2, Search, Plus, Eye, EyeOff, X, Check, Loader2, Mail, User, Phone, Lock, Calendar as CalendarIcon, Image as ImageIcon } from "lucide-react"
import { PlusCircleIcon } from "@heroicons/react/24/outline"
import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  searchEmployeesByName,
  createUser,
} from "../../../services/EmployeeService.js"
import { toast } from "react-toastify"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"


const TableEmployees = ({ isCollapsed }) => {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    estado: "activo",
    cargo: "Barbero",
    usuario: "",
    contraseña: "",
  })
  const [editingEmployeeId, setEditingEmployeeId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Estados para errores de validación
  const [nombreError, setNombreError] = useState("")
  const [apellidoError, setApellidoError] = useState("")
  const [telefonoError, setTelefonoError] = useState("")
  const [usuarioError, setUsuarioError] = useState("")
  const [contraseñaError, setContraseñaError] = useState("")

  // Calcular empleados para la página actual
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = employees.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(employees.length / itemsPerPage)

  // Funciones para cambiar de página
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

  // Validaciones
  useEffect(() => {
    if (formData.nombre) {
      if (formData.nombre.length < 3) {
        setNombreError("El nombre debe tener al menos 3 caracteres")
      } else if (formData.nombre.length > 30) {
        setNombreError("El nombre no debe exceder 30 caracteres")
      } else {
        setNombreError("")
      }
    } else {
      setNombreError("")
    }
  }, [formData.nombre])

  useEffect(() => {
    if (formData.apellido) {
      if (formData.apellido.length < 3) {
        setApellidoError("El apellido debe tener al menos 3 caracteres")
      } else if (formData.apellido.length > 30) {
        setApellidoError("El apellido no debe exceder 30 caracteres")
      } else {
        setApellidoError("")
      }
    } else {
      setApellidoError("")
    }
  }, [formData.apellido])

  useEffect(() => {
    if (formData.telefono) {
      if (!/^\d+$/.test(formData.telefono)) {
        setTelefonoError("El teléfono solo debe contener números")
      } else if (formData.telefono.length < 7) {
        setTelefonoError("El teléfono debe tener al menos 7 dígitos")
      } else if (formData.telefono.length > 10) {
        setTelefonoError("El teléfono no debe exceder 10 dígitos")
      } else {
        setTelefonoError("")
      }
    } else {
      setTelefonoError("")
    }
  }, [formData.telefono])

  useEffect(() => {
    if (formData.usuario) {
      if (formData.cargo === "Cajero") {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/
        if (!emailRegex.test(formData.usuario)) {
          setUsuarioError("Correo inválido. Debe incluir @ y terminar en .com")
        } else {
          setUsuarioError("")
        }
      } else {
        setUsuarioError("")
      }
    } else {
      setUsuarioError("")
    }
  }, [formData.usuario, formData.cargo])

 useEffect(() => {
    if (formData.contraseña) {
        // Validación de longitud
        if (formData.contraseña.length < 8) {
            setContraseñaError("La contraseña debe tener al menos 8 caracteres");
            return;
        } else if (formData.contraseña.length > 12) {
            setContraseñaError("La contraseña no debe exceder 12 caracteres");
            return;
        }

        // Validación de caracteres permitidos (letras, números y caracteres especiales comunes)
        if (!/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/.test(formData.contraseña)) {
            setContraseñaError("La contraseña contiene caracteres no permitidos");
            return;
        }

        // Validación de requisitos adicionales
        let errorMessages = [];
        
        if (!/[A-Z]/.test(formData.contraseña)) {
            errorMessages.push("al menos una letra mayúscula");
        }
        
        if (!/[0-9]/.test(formData.contraseña)) {
            errorMessages.push("al menos un número");
        }
        
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.contraseña)) {
            errorMessages.push("al menos un carácter especial");
        }

        if (errorMessages.length > 0) {
            setContraseñaError(`La contraseña debe contener ${errorMessages.join(", ")}`);
        } else {
            setContraseñaError("");
        }
    } else {
        setContraseñaError("");
    }
}, [formData.contraseña]);

  // Cargar empleados al montar el componente
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const data = await fetchEmployees()
        const formattedData = data.map((emp) => ({
          ...emp,
          cargo: emp.cargo || "Barbero",
        }))
        setEmployees(formattedData)
        setLoading(false)
      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
    }
    loadEmployees()
  }, [])

  // Buscar empleados por nombre
  // Buscar empleados por nombre
  useEffect(() => {
    if (searchTerm) {
      const searchEmployees = async () => {
        try {
          const results = await searchEmployeesByName(searchTerm)
          setEmployees(results)
          setCurrentPage(1) // Resetear a la primera página al buscar
        } catch (err) {
          setError(err.message)
        }
      }

      const timer = setTimeout(() => {
        searchEmployees()
      }, 500)

      return () => clearTimeout(timer)
    } else {
      const reloadEmployees = async () => {
        try {
          const data = await fetchEmployees()
          setEmployees(data)
          setCurrentPage(1) // Resetear a la primera página al recargar
        } catch (err) {
          setError(err.message)
        }
      }
      reloadEmployees()
    }
  }, [searchTerm])

  const openModal = (employeeId = null) => {
    setShowModal(true)
    setEditingEmployeeId(employeeId)
    setSelectedImage(null)
    setImagePreview(null)

    if (employeeId !== null) {
      const employee = employees.find((emp) => emp.idEmpleado === employeeId)
      if (employee) {
        setFormData({
          nombre: employee.nombre,
          apellido: employee.apellido,
          telefono: employee.telefono,
          estado: employee.estado,
          cargo: employee.cargo || "Barbero", // Mostrar el cargo pero no se podrá editar
          usuario: "", // No cargar usuario al editar
          contraseña: "",
        })
        if (employee.imagenPerfil) {
          setImagePreview(employee.imagenPerfil)
        }
      }
    } else {
      setFormData({
        nombre: "",
        apellido: "",
        telefono: "",
        estado: "activo",
        cargo: "Barbero",
        usuario: "",
        contraseña: "",
      })
    }

    // Resetear errores
    setNombreError("")
    setApellidoError("")
    setTelefonoError("")
    setUsuarioError("")
    setContraseñaError("")
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamaño (ejemplo: máximo 2MB)
      const maxSize = 5 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        toast.error("La imagen es demasiado grande. El tamaño máximo permitido es 5MB");
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const closeModal = () => {
    setShowModal(false)
    setFormData({
      nombre: "",
      apellido: "",
      telefono: "",
      estado: "activo",
      cargo: "Barbero",
      usuario: "",
      contraseña: "",
    })
    setEditingEmployeeId(null)
    setError(null)
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    let processedValue = value
    if (name === "telefono") {
      processedValue = value.replace(/\D/g, "")
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
      ...(name === "cargo" &&
        value === "Barbero" && {
        usuario: "",
        contraseña: "",
      }),
    }))
  }


  const handleSubmit = async (e) => {
    e.preventDefault()

    const formDataToSend = new FormData();
    formDataToSend.append('nombre', formData.nombre);
    formDataToSend.append('apellido', formData.apellido);
    formDataToSend.append('telefono', formData.telefono);
    formDataToSend.append('estado', formData.estado);
    formDataToSend.append('cargo', formData.cargo);

    if (selectedImage) {
      formDataToSend.append('imagenPerfil', selectedImage);
    }

    // Validaciones básicas
    if (nombreError || apellidoError || telefonoError) {
      toast.error("Por favor corrija los errores en el formulario")
      return
    }

    if (!formData.nombre || !formData.apellido || !formData.telefono) {
      toast.error("Los campos nombre, apellido y teléfono son obligatorios")
      return
    }

    // Validaciones específicas para Cajeros
    if (
      editingEmployeeId === null &&
      formData.cargo === "Cajero" &&
      (usuarioError || contraseñaError || !formData.usuario || !formData.contraseña)
    ) {
      toast.error("Para cajeros, usuario y contraseña son obligatorios y deben ser válidos")
      return
    }

    const timeoutId = setTimeout(() => {
      setSubmitting(false);
      toast.warning("La operación está tardando más de lo esperado");
    }, 10000); // 10 segundos

    try {
      setSubmitting(true);



      if (editingEmployeeId !== null) {
        // Actualización de empleado
        const updatedEmployee = await updateEmployee(editingEmployeeId, formDataToSend);

        setEmployees(prev =>
          prev.map(emp =>
            emp.idEmpleado === editingEmployeeId
              ? { ...emp, ...updatedEmployee }
              : emp
          )
        );
        toast.success("Empleado actualizado con éxito");
      } else {
        // Creación de nuevo empleado
        if (formData.cargo === "Cajero") {
          // Para cajeros
          const cajeroData = {
            usuario: formData.usuario,
            contraseña: formData.contraseña,
            empleado: {
              nombre: formData.nombre,
              apellido: formData.apellido,
              telefono: formData.telefono,
              cargo: "Cajero",
              estado: formData.estado,
            },
          };

          const response = await createUser(cajeroData);
          setEmployees(prev => [...prev, response.empleado]);
          toast.success("Cajero creado con éxito");
        } else {
          // Para barberos
          const newEmployee = await createEmployee(formDataToSend);
          setEmployees(prev => [...prev, newEmployee]);
          toast.success("Barbero creado con éxito");
        }
      }
      closeModal();
    } catch (err) {
      console.error("Error en handleSubmit:", err);
      clearTimeout(timeoutId); // Limpiar el timeout
      setSubmitting(false);
      toast.error(err.response?.data?.message || err.message || "Error al guardar empleado");
    }
  };

  const handleDelete = async (employeeId) => {
    try {
      await deleteEmployee(employeeId)
      setEmployees((prev) => prev.filter((emp) => emp.idEmpleado !== employeeId))
      toast.success("Empleado eliminado con éxito")
    } catch (err) {
      toast.error(err.message || "Ocurrió un error al eliminar el empleado")
    }
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
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md shadow-sm">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    )
  }

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-800 mb-2">Gestión de Empleados</h1>
          <p className="text-zinc-500">Administra la información de tus empleados</p>
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <Button
            onClick={() => openModal()}
            className="bg-gradient-to-r from-zinc-800 to-black hover:from-black hover:to-zinc-900 text-white font-medium py-2 px-4 rounded-md flex items-center gap-2 transition-colors"
          >
            <Plus size={18} /> Nuevo Empleado
          </Button>

          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-zinc-400" />
            </div>
            <Input
              type="text"
              placeholder="Buscar por nombre..."
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
                      <User size={14} className="text-zinc-400" />
                      <span>Nombre</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider border-b border-zinc-200">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-zinc-400" />
                      <span>Apellido</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider border-b border-zinc-200">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-zinc-400" />
                      <span>Teléfono</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider border-b border-zinc-200">
                    <div className="flex items-center gap-2">
                      <CalendarIcon size={14} className="text-zinc-400" />
                      <span>Estado</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider border-b border-zinc-200">
                    <div className="flex items-center gap-2">
                      <Lock size={14} className="text-zinc-400" />
                      <span>Cargo</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider border-b border-zinc-200">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-zinc-500">
                      <div className="flex flex-col items-center gap-2">
                        <User size={24} className="text-zinc-300" />
                        <p>No se encontraron empleados</p>
                        <Button
                          variant="link"
                          onClick={() => openModal()}
                          className="text-red-500 hover:text-red-600 text-sm"
                        >
                          Agregar un empleado
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentItems.map((emp) => (
                    <tr key={emp.idEmpleado} className="hover:bg-zinc-50 transition-colors">
                      <td className="py-3 px-4 text-sm text-zinc-700">
                        <div className="flex items-center">
                          <span>{emp.nombre}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-zinc-700">{emp.apellido}</td>
                      <td className="py-3 px-4 text-sm text-zinc-700">
                        <div className="flex items-center gap-1">
                          <Phone size={14} className="text-zinc-400" />
                          {emp.telefono}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${emp.estado === "activo" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                        >
                          {emp.estado === "activo" ? (
                            <>
                              <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-green-500" fill="currentColor" viewBox="0 0 8 8">
                                <circle cx="4" cy="4" r="3" />
                              </svg>
                              Activo
                            </>
                          ) : (
                            <>
                              <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-red-500" fill="currentColor" viewBox="0 0 8 8">
                                <circle cx="4" cy="4" r="3" />
                              </svg>
                              Inactivo
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-zinc-700">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${emp.cargo === "Barbero" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
                          {emp.cargo}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => openModal(emp.idEmpleado)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"
                            title="Editar"
                          >
                            <Pencil size={15} />
                          </Button>
                          <Button
                            onClick={() => handleDelete(emp.idEmpleado)}
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

          {/* Paginación actualizada */}
          {employees.length > 0 && (
            <div className="py-3 px-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500">
              <div>
                Mostrando{" "}
                <span className="font-medium">
                  {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, employees.length)}
                </span>{" "}
                de <span className="font-medium">{employees.length}</span> empleados
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
        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div
              className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden animate-in fade-in-90 zoom-in-90 duration-200"
              style={{ maxHeight: "90vh" }}
            >
              {/* Encabezado con gradiente negro */}
              <div className="bg-gradient-to-r from-zinc-800 to-black px-6 py-5 relative">
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-zinc-600 to-zinc-800"></div>
                <div className="flex items-center gap-3">
                  {editingEmployeeId !== null ? (
                    <div className="p-2 bg-white/10 rounded-lg">
                      <Pencil className="text-white h-6 w-6" />
                    </div>
                  ) : (
                    <div className="p-2 bg-white/10 rounded-lg">
                      <PlusCircleIcon className="text-white h-6 w-6" />
                    </div>
                  )}
                  <h2 className="text-xl font-bold text-white">
                    {editingEmployeeId !== null ? "Editar Empleado" : "Nuevo Empleado"}
                  </h2>
                </div>
                <p className="text-white/80 text-sm mt-1">
                  {editingEmployeeId !== null
                    ? "Actualiza la información del empleado"
                    : "Complete el formulario para registrar un nuevo empleado"}
                </p>
              </div>

              {/* Contenido con scroll */}
              <div className="p-6 space-y-6 overflow-y-auto" style={{ maxHeight: "calc(90vh - 180px)" }}>
                {/* Mensaje de error general */}
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r-md">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-red-500"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Formulario */}
                <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 p-5 rounded-xl border border-zinc-200 shadow-sm">
                  <h3 className="flex items-center gap-2 text-black font-medium mb-4 pb-2 border-b border-zinc-200">
                    <svg
                      className="h-5 w-5 text-zinc-700"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Datos personales
                  </h3>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-black mb-1">Nombre</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-4 w-4 text-zinc-500" />
                          </div>
                          <Input
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            placeholder="Ingrese nombre (3-30 caracteres)"
                            className={`pl-10 ${nombreError ? "border-red-300 focus:ring-red-500" : formData.nombre ? "border-green-300 focus:ring-green-500" : ""}`}
                            required
                            minLength={3}
                            maxLength={30}
                          />
                        </div>
                        {nombreError && (
                          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                            <X className="h-3 w-3" /> {nombreError}
                          </p>
                        )}
                        {formData.nombre && !nombreError && (
                          <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                            <Check className="h-3 w-3" /> Nombre válido
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-black mb-1">Apellido</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-4 w-4 text-zinc-500" />
                          </div>
                          <Input
                            type="text"
                            name="apellido"
                            value={formData.apellido}
                            onChange={handleChange}
                            placeholder="Ingrese apellido (3-30 caracteres)"
                            className={`pl-10 ${apellidoError ? "border-red-300 focus:ring-red-500" : formData.apellido ? "border-green-300 focus:ring-green-500" : ""}`}
                            required
                            minLength={3}
                            maxLength={30}
                          />
                        </div>
                        {apellidoError && (
                          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                            <X className="h-3 w-3" /> {apellidoError}
                          </p>
                        )}
                        {formData.apellido && !apellidoError && (
                          <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                            <Check className="h-3 w-3" /> Apellido válido
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Teléfono</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-4 w-4 text-zinc-500" />
                        </div>
                        <Input
                          type="text"
                          name="telefono"
                          value={formData.telefono}
                          onChange={handleChange}
                          placeholder="Ingrese teléfono (7-10 dígitos)"
                          className={`pl-10 ${telefonoError ? "border-red-300 focus:ring-red-500" : formData.telefono ? "border-green-300 focus:ring-green-500" : ""}`}
                          required
                          pattern="[0-9]{7,10}"
                        />
                      </div>
                      {telefonoError && (
                        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                          <X className="h-3 w-3" /> {telefonoError}
                        </p>
                      )}
                      {formData.telefono && !telefonoError && (
                        <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                          <Check className="h-3 w-3" /> Teléfono válido
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Estado</label>
                      <select
                        name="estado"
                        value={formData.estado}
                        onChange={handleChange}
                        className="w-full border border-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-800 focus:border-zinc-800"
                        required
                      >
                        <option value="activo">Activo</option>
                        <option value="inactivo">Inactivo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Cargo</label>
                      {editingEmployeeId !== null ? (
                        <Input
                          type="text"
                          value={formData.cargo}
                          className="w-full bg-zinc-100 border border-zinc-300 rounded-lg px-3 py-2 text-zinc-500 cursor-not-allowed"
                          readOnly
                        />
                      ) : (
                        <select
                          name="cargo"
                          value={formData.cargo}
                          onChange={handleChange}
                          className="w-full border border-zinc-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-800 focus:border-zinc-800"
                          required
                        >
                          <option value="Barbero">Barbero</option>
                          <option value="Cajero">Cajero</option>
                        </select>
                      )}
                    </div>

                    {/* Nuevo campo para la imagen */}
                    {formData.cargo === "Barbero" && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-black mb-2">Imagen de perfil</label>
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="h-20 w-20 rounded-full bg-zinc-200 overflow-hidden border-2 border-zinc-300 flex items-center justify-center">
                              {imagePreview ? (
                                <img
                                  src={imagePreview}
                                  alt="Vista previa"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="h-8 w-8 text-zinc-400" />
                              )}
                            </div>
                            <label
                              htmlFor="imagenPerfil"
                              className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 border border-zinc-300 shadow-sm cursor-pointer hover:bg-zinc-50"
                              title="Cambiar imagen"
                            >
                              <Pencil className="h-4 w-4 text-zinc-600" />
                            </label>
                          </div>
                          <div className="flex-1">
                            <input
                              type="file"
                              id="imagenPerfil"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="hidden"
                            />
                            <label
                              htmlFor="imagenPerfil"
                              className="inline-block text-sm text-zinc-600 hover:text-zinc-800 cursor-pointer"
                            >
                              {selectedImage ? 'Cambiar imagen' : 'Seleccionar imagen'}
                            </label>
                            <p className="text-xs text-zinc-500 mt-1">
                              Formatos: JPG, PNG (Max. 5MB)
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sección de acceso para Cajeros */}
                {formData.cargo === "Cajero" && editingEmployeeId === null && (
                  <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 p-5 rounded-xl border border-zinc-200 shadow-sm">
                    <h3 className="flex items-center gap-2 text-black font-medium mb-4 pb-2 border-b border-zinc-200">
                      <svg
                        className="h-5 w-5 text-zinc-700"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M14.243 5.757a6 6 0 10-.986 9.284 1 1 0 111.087 1.678A8 8 0 1118 10a3 3 0 01-4.8 2.401A4 4 0 1114 10a1 1 0 102 0c0-1.537-.586-3.07-1.757-4.243zM12 10a2 2 0 10-4 0 2 2 0 004 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Datos de acceso
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-black mb-1">Correo electrónico</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-4 w-4 text-zinc-500" />
                          </div>
                          <Input
                            type="email"
                            name="usuario"
                            value={formData.usuario}
                            onChange={handleChange}
                            placeholder="correo@ejemplo.com"
                            className={`pl-10 ${usuarioError ? "border-red-300 focus:ring-red-500" : formData.usuario ? "border-green-300 focus:ring-green-500" : ""}`}
                            required
                          />
                        </div>
                        {usuarioError && (
                          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                            <X className="h-3 w-3" /> {usuarioError}
                          </p>
                        )}
                        {formData.usuario && !usuarioError && (
                          <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                            <Check className="h-3 w-3" /> Correo válido
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-black mb-1">Contraseña</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-4 w-4 text-zinc-500" />
                          </div>
                          <Input
                            type={showPassword ? "text" : "password"}
                            name="contraseña"
                            value={formData.contraseña}
                            onChange={handleChange}
                            placeholder="8-12 caracteres"
                            className={`pl-10 pr-10 ${contraseñaError ? "border-red-300 focus:ring-red-500" : formData.contraseña ? "border-green-300 focus:ring-green-500" : ""}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-700"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {contraseñaError && (
                          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                            <X className="h-3 w-3" /> {contraseñaError}
                          </p>
                        )}
                        {formData.contraseña && !contraseñaError && (
                          <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                            <Check className="h-3 w-3" /> Contraseña válida
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                {/* Footer con botones */}
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
                      nombreError ||
                      apellidoError ||
                      telefonoError ||
                      (editingEmployeeId === null &&
                        (formData.cargo === "Cajero"
                          ? usuarioError || contraseñaError || !formData.usuario || !formData.contraseña
                          : false))
                    }

                    className="bg-gradient-to-r from-zinc-800 to-black hover:from-black hover:to-zinc-900 text-white"
                  >
                    {submitting ? (
                      <div className="flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        <span>{editingEmployeeId !== null ? "Actualizando..." : "Guardando..."}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {editingEmployeeId !== null ? (
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
          </div>
        )}
      </div>
    </section>
  )
}

export default TableEmployees