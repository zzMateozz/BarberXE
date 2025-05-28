import { useState, useEffect } from "react"
import { Pencil, Trash2, Search, Plus, Eye, EyeOff, X, Check, Loader2, Mail, User, Phone, Lock } from "lucide-react"
import {
  fetchClients,
  updateClient,
  deleteClient,
  fetchUsers,
  searchClientsByName,
  createUser,
} from "../../../services/ClientService.js"
import { toast } from "react-toastify"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const TableClients = ({ isCollapsed }) => {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    usuario: "",
    contraseña: "",
    cliente: {
      nombre: "",
      apellido: "",
      telefono: "",
    },
  })
  const [editingClientId, setEditingClientId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Estados para errores de validación
  const [nombreError, setNombreError] = useState("")
  const [apellidoError, setApellidoError] = useState("")
  const [telefonoError, setTelefonoError] = useState("")
  const [usuarioError, setUsuarioError] = useState("")
  const [contraseñaError, setContraseñaError] = useState("")

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Calcula los elementos para la paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = clients.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(clients.length / itemsPerPage);

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
    if (formData.cliente.nombre) {
      if (formData.cliente.nombre.length < 3) {
        setNombreError("El nombre debe tener al menos 3 caracteres")
      } else if (formData.cliente.nombre.length > 30) {
        setNombreError("El nombre no debe exceder 30 caracteres")
      } else {
        setNombreError("")
      }
    } else {
      setNombreError("")
    }
  }, [formData.cliente.nombre])

  useEffect(() => {
    if (formData.cliente.apellido) {
      if (formData.cliente.apellido.length < 3) {
        setApellidoError("El apellido debe tener al menos 3 caracteres")
      } else if (formData.cliente.apellido.length > 30) {
        setApellidoError("El apellido no debe exceder 30 caracteres")
      } else {
        setApellidoError("")
      }
    } else {
      setApellidoError("")
    }
  }, [formData.cliente.apellido])

  useEffect(() => {
    if (formData.cliente.telefono) {
      if (!/^\d+$/.test(formData.cliente.telefono)) {
        setTelefonoError("El teléfono solo debe contener números")
      } else if (formData.cliente.telefono.length < 7) {
        setTelefonoError("El teléfono debe tener al menos 7 dígitos")
      } else if (formData.cliente.telefono.length > 10) {
        setTelefonoError("El teléfono no debe exceder 10 dígitos")
      } else {
        setTelefonoError("")
      }
    } else {
      setTelefonoError("")
    }
  }, [formData.cliente.telefono])

  useEffect(() => {
    if (formData.usuario) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/
      if (!emailRegex.test(formData.usuario)) {
        setUsuarioError("Correo inválido. Debe incluir @ y terminar en .com")
      } else {
        setUsuarioError("")
      }
    } else {
      setUsuarioError("")
    }
  }, [formData.usuario])

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

  // Función auxiliar para validar y convertir datos a array
  const ensureArray = (data, fallback = []) => {
    if (!data) return fallback;
    if (Array.isArray(data)) return data;
    if (typeof data === 'object' && data.data && Array.isArray(data.data)) return data.data;
    if (typeof data === 'object' && data.clients && Array.isArray(data.clients)) return data.clients;
    console.warn('Unexpected data format:', data);
    return fallback;
  };

  // Cargar clientes al montar el componente
  useEffect(() => {
    const loadCombinedData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Cargar ambos conjuntos de datos en paralelo
        const [clientsResponse, usersResponse] = await Promise.all([
          fetchClients().catch(err => {
            console.error('Error fetching clients:', err);
            return [];
          }),
          fetchUsers().catch(err => {
            console.error('Error fetching users:', err);
            return [];
          })
        ]);

        // Validar y convertir a arrays
        const clientsData = ensureArray(clientsResponse);
        const usersData = ensureArray(usersResponse);

        console.log('Clients data:', clientsData);
        console.log('Users data:', usersData);

        // Combinar los datos
        const combinedData = clientsData.map((client) => {
          // Buscar el usuario correspondiente a este cliente
          const user = usersData.find((u) => u.cliente?.idCliente === client.idCliente)

          return {
            ...client,
            usuario: user?.usuario || "", // Usuario o string vacío
            user: user || null, // Objeto usuario completo o null
          }
        })

        setClients(combinedData)
        setLoading(false)
      } catch (err) {
        console.error('Error in loadCombinedData:', err);
        setError(err.message || 'Error al cargar los datos')
        setClients([])
        setLoading(false)
      }
    }

    loadCombinedData()
  }, [])

  // Buscar clientes por nombre
  useEffect(() => {
    const searchClientsUser = async (term) => {
      try {
        setError(null)

        // 1. Buscar clientes por nombre
        const foundClientsResponse = await searchClientsByName(term).catch(err => {
          console.error('Error searching clients:', err);
          return [];
        });

        // 2. Obtener todos los usuarios para hacer el match
        const usersResponse = await fetchUsers().catch(err => {
          console.error('Error fetching users for search:', err);
          return [];
        });

        // Validar y convertir a arrays
        const foundClients = ensureArray(foundClientsResponse);
        const usersData = ensureArray(usersResponse);

        // 3. Combinar los resultados
        const combinedResults = foundClients.map((client) => {
          const user = usersData.find((u) => u.cliente?.idCliente === client.idCliente)
          return {
            ...client,
            usuario: user?.usuario || "", // Usuario o string vacío
            user: user || null, // Objeto usuario completo o null
          }
        })

        setClients(combinedResults)
      } catch (err) {
        console.error('Error in searchClientsUser:', err);
        setError(err.message || 'Error al buscar clientes')
        setClients([])
      }
    }

    if (searchTerm) {
      setCurrentPage(1) // Resetear a la primera página al buscar
      const timer = setTimeout(() => {
        searchClientsUser(searchTerm)
      }, 500)

      return () => clearTimeout(timer)
    } else {
      // Si no hay término de búsqueda, cargar todos los clientes con usuarios
      const loadCombinedData = async () => {
        try {
          setLoading(true)
          setError(null)

          const [clientsResponse, usersResponse] = await Promise.all([
            fetchClients().catch(err => {
              console.error('Error fetching clients:', err);
              return [];
            }),
            fetchUsers().catch(err => {
              console.error('Error fetching users:', err);
              return [];
            })
          ]);

          const clientsData = ensureArray(clientsResponse);
          const usersData = ensureArray(usersResponse);

          const combinedData = clientsData.map((client) => {
            const user = usersData.find((u) => u.cliente?.idCliente === client.idCliente)
            return {
              ...client,
              usuario: user?.usuario || "",
              user: user || null,
            }
          })

          setClients(combinedData)
          setCurrentPage(1) // Resetear a la primera página al recargar
          setLoading(false)
        } catch (err) {
          console.error('Error in loadCombinedData (search effect):', err);
          setError(err.message || 'Error al cargar los datos')
          setClients([])
          setLoading(false)
        }
      }

      loadCombinedData()
    }
  }, [searchTerm])

  const openModal = (clientId = null) => {
    setShowModal(true)
    setEditingClientId(clientId)

    if (clientId !== null) {
      const clientToEdit = clients.find((c) => c.idCliente === clientId)
      if (clientToEdit) {
        setFormData({
          usuario: clientToEdit.user?.usuario || clientToEdit.usuario || "",
          contraseña: "",
          cliente: {
            nombre: clientToEdit.nombre || clientToEdit.cliente?.nombre || "",
            apellido: clientToEdit.apellido || clientToEdit.cliente?.apellido || "",
            telefono: clientToEdit.telefono || clientToEdit.cliente?.telefono || "",
          },
        })
      }
    } else {
      setFormData({
        usuario: "",
        contraseña: "",
        cliente: {
          nombre: "",
          apellido: "",
          telefono: "",
        },
      })
    }

    // Resetear errores
    setNombreError("")
    setApellidoError("")
    setTelefonoError("")
    setUsuarioError("")
    setContraseñaError("")
  }

  const closeModal = () => {
    setShowModal(false)
    setFormData({
      usuario: "",
      contraseña: "",
      cliente: {
        nombre: "",
        apellido: "",
        telefono: "",
      },
    })
    setEditingClientId(null)
    setError(null)
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    let processedValue = value
    if (name === "cliente.telefono" || name === "telefono") {
      processedValue = value.replace(/\D/g, "")
    }

    if (name.startsWith("cliente.")) {
      const fieldName = name.split(".")[1]
      setFormData((prev) => ({
        ...prev,
        cliente: {
          ...prev.cliente,
          [fieldName]: processedValue,
        },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: processedValue }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (
      nombreError ||
      apellidoError ||
      telefonoError ||
      (editingClientId === null && (usuarioError || contraseñaError))
    ) {
      toast.error("Por favor corrija los errores en el formulario")
      return
    }

    if (!formData.cliente.nombre || !formData.cliente.apellido || !formData.cliente.telefono) {
      toast.error("Los campos nombre, apellido y teléfono son obligatorios")
      return
    }

    if (editingClientId === null && (!formData.usuario || !formData.contraseña)) {
      toast.error("Para nuevos clientes, usuario y contraseña son obligatorios")
      return
    }

    const timeoutId = setTimeout(() => {
      setSubmitting(false);
      toast.warning("La operación está tardando más de lo esperado");
    }, 10000); // 10 segundos

    try {
      setSubmitting(true)
      setError(null) // Limpiar errores previos
  if (editingClientId !== null) {
      // ACTUALIZACIÓN
      const response = await updateClient(editingClientId, {
        nombre: formData.cliente.nombre,
        apellido: formData.cliente.apellido,
        telefono: formData.cliente.telefono,
      });

      // Extraer datos de la respuesta
      const updatedData = response.data;

      setClients(prev => 
        prev.map(cli => 
          cli.idCliente === editingClientId
            ? {
                ...cli,
                ...updatedData, // Actualizar campos principales
                cliente: { // Si existe estructura anidada
                  ...cli.cliente,
                  ...updatedData
                }
              }
            : cli
        )
      );
      toast.success("Cliente actualizado con éxito");
    } else {
        // Creación
        console.log('Creando nuevo cliente:', formData);

        const { data } = await createUser({
          usuario: formData.usuario, // No usar "email"
          contraseña: formData.contraseña,
          cliente: { // No usar "client"
            nombre: formData.cliente.nombre,
            apellido: formData.cliente.apellido,
            telefono: formData.cliente.telefono
          }
        });

        console.log('Respuesta del servidor:', data);

        // Validar que la respuesta contenga los datos necesarios
        if (!data || !data.cliente) {
          throw new Error('Respuesta del servidor incompleta');
        }

        if (!data.cliente.idCliente) {
          throw new Error('Error: No se recibió el ID del cliente del servidor');
        }

        const newClient = {
          ...data.cliente,
          idCliente: data.cliente.idCliente,
          usuario: data.usuario, // Usar data.usuario en lugar de response.usuario
          user: {
            usuario: data.usuario,
            idUsuario: data.idUser // Cambiar response.idUsuario -> data.idUser
          }
        };

        console.log('Nuevo cliente preparado:', newClient);

        setClients((prev) => [...prev, newClient])
        toast.success("Cliente creado con éxito")
      }

      closeModal()
    } catch (err) {
      console.error('Error completo en handleSubmit:', err);

      // Manejo más específico de errores
      let errorMessage = 'Error desconocido al guardar los cambios';

      if (err.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }

      // Mostrar el error específico
      toast.error(errorMessage);
      setError(errorMessage);

      // Log adicional para depuración
      console.log('Tipo de error:', typeof err);
      console.log('Error stringified:', JSON.stringify(err, null, 2));
    } finally {
      setSubmitting(false)
      clearTimeout(timeoutId);
    }
  }

  const handleDelete = async (clientId) => {
    if (window.confirm("¿Está seguro que desea eliminar este cliente?")) {
      try {
        await deleteClient(clientId)
        setClients((prev) => prev.filter((c) => c.idCliente !== clientId))
        toast.success("Cliente eliminado con éxito")
      } catch (err) {
        toast.error(err.message || "Error al eliminar el cliente")
      }
    }
  }

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-800 mb-2">Gestión de Clientes</h1>
          <p className="text-zinc-500 text-sm">Administra la información de tus clientes</p>
        </div>

        {/* Barra de acciones */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <Button
            onClick={() => openModal()}
            className="bg-gradient-to-r from-zinc-800 to-black hover:from-black hover:to-zinc-900 text-white font-medium py-2 px-4 rounded-md flex items-center gap-2 transition-colors"
          >
            <Plus size={18} /> Nuevo Cliente
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

        {/* Estado de carga */}
        {loading ? (
          <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow-sm border border-zinc-200">
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={36} className="animate-spin text-red-500" />
              <p className="text-zinc-500">Cargando clientes...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md mb-6">
            <div className="flex items-center">
              <X className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        ) : (
          /* Tabla mejorada */
          <div className="bg-white rounded-lg shadow-sm border border-zinc-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-zinc-50">
                    <th className="py-3 px-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider border-b border-zinc-200">
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-zinc-400" />
                        <span>Usuario</span>
                      </div>
                    </th>
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
                    <th className="py-3 px-4 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider border-b border-zinc-200">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {currentItems.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-zinc-500">
                        <div className="flex flex-col items-center gap-2">
                          <User size={24} className="text-zinc-300" />
                          <p>No se encontraron clientes</p>
                          <Button
                            variant="link"
                            onClick={() => openModal()}
                            className="text-red-500 hover:text-red-600 text-sm"
                          >
                            Agregar un cliente
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((cli) => (
                      <tr key={cli.idCliente} className="hover:bg-zinc-50 transition-colors">
                        <td className="py-3 px-4 text-sm text-zinc-700">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 mr-3">
                              <Mail size={14} />
                            </div>
                            <span className="truncate max-w-[180px]">{cli.usuario || cli.user?.usuario || "-"}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-zinc-700">{cli.nombre || cli.cliente?.nombre}</td>
                        <td className="py-3 px-4 text-sm text-zinc-700">{cli.apellido || cli.cliente?.apellido}</td>
                        <td className="py-3 px-4 text-sm text-zinc-700">
                          <div className="flex items-center gap-1">
                            <Phone size={14} className="text-zinc-400" />
                            {cli.telefono || cli.cliente?.telefono}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              onClick={() => openModal(cli.idCliente)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"
                              title="Editar"
                            >
                              <Pencil size={15} />
                            </Button>
                            <Button
                              onClick={() => handleDelete(cli.idCliente)}
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

            {clients.length > 0 && (
              <div className="py-3 px-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500">
                <div>
                  Mostrando{" "}
                  <span className="font-medium">
                    {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, clients.length)}
                  </span>{" "}
                  de <span className="font-medium">{clients.length}</span> clientes
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
        )}

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
                  {editingClientId !== null ? (
                    <div className="p-2 bg-white/10 rounded-lg">
                      <Pencil className="text-white h-6 w-6" />
                    </div>
                  ) : (
                    <div className="p-2 bg-white/10 rounded-lg">
                      <Plus className="text-white h-6 w-6" />
                    </div>
                  )}
                  <h2 className="text-xl font-bold text-white">
                    {editingClientId !== null ? "Editar Cliente" : "Nuevo Cliente"}
                  </h2>
                </div>
                <p className="text-white/80 text-sm mt-1">
                  {editingClientId !== null
                    ? "Actualiza la información del cliente"
                    : "Complete el formulario para registrar un nuevo cliente"}
                </p>
              </div>

              {/* Contenido con scroll */}
              <div className="p-6 space-y-6 overflow-y-auto" style={{ maxHeight: "calc(90vh - 180px)" }}>
                {/* Mensaje de error general */}
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

                {/* Sección de acceso */}
                {editingClientId === null && (
                  <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 p-5 rounded-xl border border-zinc-200 shadow-sm">
                    <h3 className="flex items-center gap-2 text-black font-medium mb-4 pb-2 border-b border-zinc-200">
                      <Mail className="h-5 w-5 text-zinc-700" />
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

                {/* Sección de datos personales */}
                <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 p-5 rounded-xl border border-zinc-200 shadow-sm">
                  <h3 className="flex items-center gap-2 text-black font-medium mb-4 pb-2 border-b border-zinc-200">
                    <User className="h-5 w-5 text-zinc-700" />
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
                            name="cliente.nombre"
                            value={formData.cliente.nombre}
                            onChange={handleChange}
                            placeholder="Nombre"
                            className={`pl-10 ${nombreError ? "border-red-300 focus:ring-red-500" : formData.cliente.nombre ? "border-green-300 focus:ring-green-500" : ""}`}
                          />
                        </div>
                        {nombreError && (
                          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                            <X className="h-3 w-3" /> {nombreError}
                          </p>
                        )}
                        {formData.cliente.nombre && !nombreError && (
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
                            name="cliente.apellido"
                            value={formData.cliente.apellido}
                            onChange={handleChange}
                            placeholder="Apellido"
                            className={`pl-10 ${apellidoError ? "border-red-300 focus:ring-red-500" : formData.cliente.apellido ? "border-green-300 focus:ring-green-500" : ""}`}
                          />
                        </div>
                        {apellidoError && (
                          <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                            <X className="h-3 w-3" /> {apellidoError}
                          </p>
                        )}
                        {formData.cliente.apellido && !apellidoError && (
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
                          name="cliente.telefono"
                          value={formData.cliente.telefono}
                          onChange={handleChange}
                          placeholder="3001234567"
                          className={`pl-10 ${telefonoError ? "border-red-300 focus:ring-red-500" : formData.cliente.telefono ? "border-green-300 focus:ring-green-500" : ""}`}
                        />
                      </div>
                      {telefonoError && (
                        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                          <X className="h-3 w-3" /> {telefonoError}
                        </p>
                      )}
                      {formData.cliente.telefono && !telefonoError && (
                        <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                          <Check className="h-3 w-3" /> Teléfono válido
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

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
                    (editingClientId === null &&
                      (usuarioError || contraseñaError || !formData.usuario || !formData.contraseña))
                  }
                  className="bg-gradient-to-r from-zinc-800 to-black hover:from-black hover:to-zinc-900 text-white"
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      <span>{editingClientId !== null ? "Actualizando..." : "Guardando..."}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {editingClientId !== null ? (
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

export default TableClients
