import React, { useState, useEffect } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  EyeIcon,
  EyeSlashIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";
import {
  fetchClients,
  updateClient,
  deleteClient,
  fetchUsers,
  searchClientsByName,
  createUser,
} from "../../services/ClientService.js";
import { toast } from "react-toastify";

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
    <div className={`text-sm mt-1 ${isValid ? "text-green-600" : "text-red-600"}`}>
      {message}
    </div>
  );
};

const TableClients = ({ isCollapsed }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    usuario: "",
    contraseña: "",
    cliente: {
      nombre: "",
      apellido: "",
      telefono: "",
    },
  });
  const [editingClientId, setEditingClientId] = useState(null);

  // Estados para errores de validación
  const [nombreError, setNombreError] = useState("");
  const [apellidoError, setApellidoError] = useState("");
  const [telefonoError, setTelefonoError] = useState("");
  const [usuarioError, setUsuarioError] = useState("");
  const [contraseñaError, setContraseñaError] = useState("");

  const getInputBorderClass = (value, error) => {
    if (!value) return "border-gray-300";
    return error ? "border-red-500 focus:ring-red-500" : "border-green-500 focus:ring-green-500";
  };

  // Validaciones
  useEffect(() => {
    if (formData.cliente.nombre) {
      if (formData.cliente.nombre.length < 3) {
        setNombreError("El nombre debe tener al menos 3 caracteres");
      } else if (formData.cliente.nombre.length > 30) {
        setNombreError("El nombre no debe exceder 30 caracteres");
      } else {
        setNombreError("");
      }
    } else {
      setNombreError("");
    }
  }, [formData.cliente.nombre]);

  useEffect(() => {
    if (formData.cliente.apellido) {
      if (formData.cliente.apellido.length < 3) {
        setApellidoError("El apellido debe tener al menos 3 caracteres");
      } else if (formData.cliente.apellido.length > 30) {
        setApellidoError("El apellido no debe exceder 30 caracteres");
      } else {
        setApellidoError("");
      }
    } else {
      setApellidoError("");
    }
  }, [formData.cliente.apellido]);

  useEffect(() => {
    if (formData.cliente.telefono) {
      if (!/^\d+$/.test(formData.cliente.telefono)) {
        setTelefonoError("El teléfono solo debe contener números");
      } else if (formData.cliente.telefono.length < 7) {
        setTelefonoError("El teléfono debe tener al menos 7 dígitos");
      } else if (formData.cliente.telefono.length > 10) {
        setTelefonoError("El teléfono no debe exceder 10 dígitos");
      } else {
        setTelefonoError("");
      }
    } else {
      setTelefonoError("");
    }
  }, [formData.cliente.telefono]);

  useEffect(() => {
    if (formData.usuario) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/;
      if (!emailRegex.test(formData.usuario)) {
        setUsuarioError("Correo inválido. Debe incluir @ y terminar en .com");
      } else {
        setUsuarioError("");
      }
    } else {
      setUsuarioError("");
    }
  }, [formData.usuario]);

  useEffect(() => {
    if (formData.contraseña) {
      if (formData.contraseña.length < 8) {
        setContraseñaError("La contraseña debe tener al menos 8 caracteres");
      } else if (formData.contraseña.length > 12) {
        setContraseñaError("La contraseña no debe exceder 12 caracteres");
      } else if (!/^[a-zA-Z0-9]{8,12}$/.test(formData.contraseña)) {
        setContraseñaError("La contraseña solo debe contener letras y números");
      } else {
        setContraseñaError("");
      }
    } else {
      setContraseñaError("");
    }
  }, [formData.contraseña]);

  // Cargar clientes al montar el componente
  useEffect(() => {
    const loadCombinedData = async () => {
      try {
        setLoading(true);
        // Cargar ambos conjuntos de datos en paralelo
        const [clientsData, usersData] = await Promise.all([
          fetchClients(),
          fetchUsers()
        ]);
  
        // Combinar los datos
        const combinedData = clientsData.map(client => {
          // Buscar el usuario correspondiente a este cliente
          const user = usersData.find(u => u.cliente?.idCliente === client.idCliente);
          
          return {
            ...client,
            usuario: user?.usuario || '', // Usuario o string vacío
            user: user || null // Objeto usuario completo o null
          };
        });
  
        setClients(combinedData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
  
    loadCombinedData();
  }, []);
  
  // Buscar clientes por nombre
  useEffect(() => {
    const searchClientsUser = async (term) => {
      try {
        // 1. Buscar clientes por nombre
        const foundClients = await searchClientsByName(term);
        
        // 2. Obtener todos los usuarios para hacer el match
        const usersData = await fetchUsers();
        
        // 3. Combinar los resultados
        const combinedResults = foundClients.map(client => {
          const user = usersData.find(u => u.cliente?.idCliente === client.idCliente);
          return {
            ...client,
            usuario: user?.usuario || '', // Usuario o string vacío
            user: user || null // Objeto usuario completo o null
          };
        });
        
        setClients(combinedResults);
      } catch (err) {
        setError(err.message);
      }
    };

    if (searchTerm) {
      const timer = setTimeout(() => {
        searchClientsUser(searchTerm);
      }, 500);

      return () => clearTimeout(timer);
    } else {
      // Si no hay término de búsqueda, cargar todos los clientes con usuarios
      const loadCombinedData = async () => {
        try {
          setLoading(true);
          const [clientsData, usersData] = await Promise.all([
            fetchClients(),
            fetchUsers()
          ]);

          const combinedData = clientsData.map(client => {
            const user = usersData.find(u => u.cliente?.idCliente === client.idCliente);
            return {
              ...client,
              usuario: user?.usuario || '',
              user: user || null
            };
          });

          setClients(combinedData);
          setLoading(false);
        } catch (err) {
          setError(err.message);
          setLoading(false);
        }
      };

      loadCombinedData();
    }
  }, [searchTerm]);
  
  const openModal = (clientId = null) => {
    setShowModal(true);
    setEditingClientId(clientId);
    
    if (clientId !== null) {
      const clientToEdit = clients.find(c => c.idCliente === clientId);
      if (clientToEdit) {
        setFormData({
          usuario: clientToEdit.user?.usuario || clientToEdit.usuario || "",
          contraseña: "",
          cliente: {
            nombre: clientToEdit.nombre || clientToEdit.cliente?.nombre || "",
            apellido: clientToEdit.apellido || clientToEdit.cliente?.apellido || "",
            telefono: clientToEdit.telefono || clientToEdit.cliente?.telefono || ""
          }
        });
      }
    } else {
      setFormData({
        usuario: "",
        contraseña: "",
        cliente: {
          nombre: "",
          apellido: "",
          telefono: ""
        }
      });
    }
    
    // Resetear errores
    setNombreError("");
    setApellidoError("");
    setTelefonoError("");
    setUsuarioError("");
    setContraseñaError("");
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      usuario: "",
      contraseña: "",
      cliente: {
        nombre: "",
        apellido: "",
        telefono: ""
      }
    });
    setEditingClientId(null);
    setError(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    let processedValue = value;
    if (name === "cliente.telefono" || name === "telefono") {
      processedValue = value.replace(/\D/g, '');
    }

    if (name.startsWith("cliente.")) {
      const fieldName = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        cliente: {
          ...prev.cliente,
          [fieldName]: processedValue,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: processedValue }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (nombreError || apellidoError || telefonoError || 
        (editingClientId === null && (usuarioError || contraseñaError))) {
      toast.error("Por favor corrija los errores en el formulario");
      return;
    }
    
    if (!formData.cliente.nombre || !formData.cliente.apellido || !formData.cliente.telefono) {
      toast.error("Los campos nombre, apellido y teléfono son obligatorios");
      return;
    }
    
    if (editingClientId === null && (!formData.usuario || !formData.contraseña)) {
      toast.error("Para nuevos clientes, usuario y contraseña son obligatorios");
      return;
    }

    try {
      if (editingClientId !== null) {
        // Actualización
        const updatedClient = await updateClient(editingClientId, {
          nombre: formData.cliente.nombre,
          apellido: formData.cliente.apellido,
          telefono: formData.cliente.telefono
        });
        
        setClients(prev => 
          prev.map(cli => 
            cli.idCliente === editingClientId ? { 
              ...cli,
              nombre: updatedClient.nombre,
              apellido: updatedClient.apellido,
              telefono: updatedClient.telefono
            } : cli
          )
        );
        toast.success("Cliente actualizado con éxito");
      } else {
        // Creación
        const response = await createUser({
          usuario: formData.usuario,
          contraseña: formData.contraseña,
          cliente: {
            nombre: formData.cliente.nombre,
            apellido: formData.cliente.apellido,
            telefono: formData.cliente.telefono
          }
        });

        const newClient = {
          ...response.cliente,
          idCliente: response.cliente.idCliente,
          usuario: response.usuario,
          user: {
            usuario: response.usuario,
            idUsuario: response.idUsuario
          }
        };
        
        setClients(prev => [...prev, newClient]);
        toast.success("Cliente creado con éxito");
      }
      closeModal();
    } catch (err) {
      toast.error(err.message || 'Error al guardar los cambios');
    }
  };

  const handleDelete = async (clientId) => {
    try {
      await deleteClient(clientId);
      setClients(prev => prev.filter(c => c.idCliente !== clientId));
      toast.success("Cliente eliminado con éxito");
    } catch (err) {
      toast.error(err.message || "Error al eliminar el cliente");
    }
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
            <PlusCircleIcon className="w-6 h-6" /> Agregar
          </button>
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className={`${styles.tableContainer} ${isCollapsed ? "mx-4" : "mx-0"}`}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Usuario</th>
                <th className={styles.th}>Nombre</th>
                <th className={styles.th}>Apellido</th>
                <th className={styles.th}>Teléfono</th>
                <th className={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((cli) => (
                <tr key={cli.idCliente} className="bg-neutral-100">
                  <td className={styles.td}>
                    {cli.usuario || cli.user?.usuario || ''}
                  </td>
                  <td className={styles.td}>{cli.nombre || cli.cliente?.nombre}</td>
                  <td className={styles.td}>{cli.apellido || cli.cliente?.apellido}</td>
                  <td className={styles.td}>{cli.telefono || cli.cliente?.telefono}</td>
                  <td className={styles.td}>
                    <button
                      onClick={() => openModal(cli.idCliente)}
                      className={`${styles.button} ${styles.editButton} mr-2`}
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(cli.idCliente)}
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
                {editingClientId !== null ? "Editar Cliente" : "Crear Cliente y Usuario"}
              </h2>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                {editingClientId === null && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nombre de Usuario (Correo)
                      </label>
                      <input
                        type="email"
                        name="usuario"
                        value={formData.usuario}
                        onChange={handleChange}
                        placeholder="correo@ejemplo.com"
                        className={`mt-1 w-full border rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500 ${getInputBorderClass(formData.usuario, usuarioError)}`}
                        required
                      />
                      <ValidationMessage message={usuarioError} isValid={false} />
                      {formData.usuario && !usuarioError && (
                        <ValidationMessage message="Correo válido" isValid={true} />
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Contraseña
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="contraseña"
                          value={formData.contraseña}
                          onChange={handleChange}
                          placeholder="Ingrese contraseña (8-12 caracteres)"
                          className={`mt-1 w-full border rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500 ${getInputBorderClass(formData.contraseña, contraseñaError)}`}
                          required
                          minLength={8}
                          maxLength={12}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-3 flex items-center"
                        >
                          {showPassword ? (
                            <EyeSlashIcon className="w-5 h-5 text-gray-500" />
                          ) : (
                            <EyeIcon className="w-5 h-5 text-gray-500" />
                          )}
                        </button>
                      </div>
                      <ValidationMessage message={contraseñaError} isValid={false} />
                      {formData.contraseña && !contraseñaError && (
                        <ValidationMessage message="Contraseña válida" isValid={true} />
                      )}
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre
                  </label>
                  <input
                    type="text"
                    name="cliente.nombre"
                    value={formData.cliente.nombre}
                    onChange={handleChange}
                    placeholder="Ingrese nombre (3-30 caracteres)"
                    className={`mt-1 w-full border rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500 ${getInputBorderClass(formData.cliente.nombre, nombreError)}`}
                    required
                    minLength={3}
                    maxLength={30}
                  />
                  <ValidationMessage message={nombreError} isValid={false} />
                  {formData.cliente.nombre && !nombreError && (
                    <ValidationMessage message="Nombre válido" isValid={true} />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Apellido
                  </label>
                  <input
                    type="text"
                    name="cliente.apellido"
                    value={formData.cliente.apellido}
                    onChange={handleChange}
                    placeholder="Ingrese apellido (3-30 caracteres)"
                    className={`mt-1 w-full border rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500 ${getInputBorderClass(formData.cliente.apellido, apellidoError)}`}
                    required
                    minLength={3}
                    maxLength={30}
                  />
                  <ValidationMessage message={apellidoError} isValid={false} />
                  {formData.cliente.apellido && !apellidoError && (
                    <ValidationMessage message="Apellido válido" isValid={true} />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="cliente.telefono"
                    value={formData.cliente.telefono}
                    onChange={handleChange}
                    placeholder="Ingrese teléfono (7-10 dígitos)"
                    className={`mt-1 w-full border rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500 ${getInputBorderClass(formData.cliente.telefono, telefonoError)}`}
                    required
                    minLength={7}
                    maxLength={10}
                    pattern="[0-9]{7,10}"
                  />
                  <ValidationMessage message={telefonoError} isValid={false} />
                  {formData.cliente.telefono && !telefonoError && (
                    <ValidationMessage message="Teléfono válido" isValid={true} />
                  )}
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
                      nombreError ||
                      apellidoError ||
                      telefonoError ||
                      (editingClientId === null && (usuarioError || contraseñaError))
                    }
                  >
                    {editingClientId !== null ? "Actualizar" : "Guardar"}
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

export default TableClients;