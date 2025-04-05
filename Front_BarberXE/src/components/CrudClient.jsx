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
} from "../services/ClientService.js";

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
  const [editIndex, setEditIndex] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Cargar clientes al montar el componente
  useEffect(() => {
    const loadClients = async () => {
      try {
        const data = await fetchClients();
        setClients(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    loadClients();
  }, []);

  // Buscar clientes por nombre
  useEffect(() => {
    const loadCombinedData = async () => {
      try {
        const [clientsData, usersData] = await Promise.all([
          fetchClients(),
          fetchUsers(),
        ]);

        const combined = clientsData.map((client) => {
          const user = usersData.find(
            (u) => u.cliente?.idCliente === client.idCliente
          );
          return { ...client, user };
        });

        setClients(combined);
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
    if (searchTerm) {
      const searchClients = async () => {
        try {
          const results = await searchClientsByName(searchTerm);
          setClients(results);
          setCurrentPage(1);
        } catch (err) {
          setError(err.message);
        }
      };

      const timer = setTimeout(() => {
        searchClients();
      }, 500);

      return () => clearTimeout(timer);
    } else {
      // Si el término de búsqueda está vacío, recargar todos los clientes
      const reloadClients = async () => {
        try {
          const data = await fetchClients();
          setClients(data);
        } catch (err) {
          setError(err.message);
        }
      };
      reloadClients();
    }
  }, [searchTerm]);

  const openModal = (index = null) => {
    setShowModal(true);
    if (index !== null) {
      // Para edición, usamos el formato de cliente existente
      const clientToEdit = clients[index];
      setFormData({
        usuario: clientToEdit.user?.usuario || "",
        contraseña: "", // No mostramos la contraseña actual por seguridad
        cliente: {
          nombre: clientToEdit.nombre,
          apellido: clientToEdit.apellido,
          telefono: clientToEdit.telefono,
        },
      });
      setEditIndex(index);
    } else {
      // Para nuevo cliente, inicializamos con valores vacíos
      setFormData({
        usuario: "",
        contraseña: "",
        cliente: {
          nombre: "",
          apellido: "",
          telefono: "",
        },
      });
      setEditIndex(null);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      usuario: "",
      contraseña: "",
      cliente: {
        nombre: "",
        apellido: "",
        telefono: "",
      },
    });
    setEditIndex(null);
    setError(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("cliente.")) {
      // Manejar campos anidados del cliente
      const fieldName = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        cliente: {
          ...prev.cliente,
          [fieldName]: value,
        },
      }));
    } else {
      // Manejar campos directos del usuario
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editIndex !== null) {
        // Actualizar cliente existente
        const clientId = clients[editIndex].idCliente;
        const updatedClient = await updateClient(clientId, formData.cliente);
        
        // Actualizamos el estado manteniendo el usuario si existía
        setClients(prev => 
          prev.map((cli, i) => 
            i === editIndex ? { 
              ...updatedClient, 
              usuario: cli.usuario // Mantenemos el usuario del cliente anterior
            } : cli
          )
        );
      } else {
        // Crear nuevo usuario-cliente
        const response = await createUser({
          usuario: formData.usuario,
          contraseña: formData.contraseña,
          cliente: formData.cliente
        });
  
        // Normalizamos la respuesta para tener una estructura consistente
        const newClient = {
          ...response.cliente,
          usuario: response.usuario // Aseguramos que el usuario esté en el objeto cliente
        };
        
        // Agregar el nuevo cliente a la lista
        setClients(prev => [...prev, newClient]);
      }
      closeModal();
    } catch (err) {
      setError(err.message || 'Error al guardar los cambios');
    }
  };
  const handleDelete = async (index) => {
    try {
      await deleteClient(clients[index].idCliente);
      setClients((prev) => prev.filter((_, i) => i !== index));
    } catch (err) {
      setError(err.message);
    }
  };

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentClients = clients.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(clients.length / itemsPerPage);

  const changePage = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
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

        <div
          className={`${styles.tableContainer} ${
            isCollapsed ? "mx-4" : "mx-0"
          }`}
        >
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
              {currentClients.map((cli, i) => (
                <tr key={i} className="bg-neutral-100">
                  <td className={styles.td}>
                    {typeof cli === "object" && "usuario" in cli
                      ? cli.usuario
                      : cli.user
                      ? cli.user.usuario
                      : "N/A"}
                  </td>
                  <td className={styles.td}>
                    {typeof cli === "object" && "cliente" in cli
                      ? cli.cliente.nombre
                      : cli.nombre}
                  </td>
                  <td className={styles.td}>
                    {typeof cli === "object" && "cliente" in cli
                      ? cli.cliente.apellido
                      : cli.apellido}
                  </td>
                  <td className={styles.td}>
                    {typeof cli === "object" && "cliente" in cli
                      ? cli.cliente.telefono
                      : cli.telefono}
                  </td>
                  <td className={styles.td}>
                    <button
                      onClick={() => openModal(i)}
                      className={`${styles.button} ${styles.editButton} mr-2`}
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(i)}
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

        <div className="mt-6">
          <nav className="flex justify-center">
            <ul className="flex space-x-2">
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                return (
                  <li key={page}>
                    <button
                      onClick={() => changePage(page)}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        page === currentPage
                          ? "bg-red-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {page}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/75 bg-opacity-50 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-6 border border-gray-200 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <PlusCircleIcon className="w-6 h-6 text-red-500" />{" "}
                {editIndex !== null
                  ? "Editar Cliente"
                  : "Crear Cliente y Usuario"}
              </h2>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Campos de usuario (solo para creación) */}
                {editIndex === null && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nombre de Usuario
                      </label>
                      <input
                        type="text"
                        name="usuario"
                        value={formData.usuario}
                        onChange={handleChange}
                        placeholder="Ingrese nombre de usuario"
                        className="mt-1 w-full border rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500"
                        required
                      />
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
                          placeholder="Ingrese contraseña"
                          className="mt-1 w-full border rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500"
                          required={editIndex === null}
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
                    </div>
                  </>
                )}

                {/* Campos del cliente */}
                {["nombre", "apellido", "telefono"].map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700">
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                    </label>
                    <input
                      type={field === "telefono" ? "tel" : "text"}
                      name={`cliente.${field}`}
                      value={formData.cliente[field]}
                      onChange={handleChange}
                      placeholder={`Ingrese ${field}`}
                      className="mt-1 w-full border rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                ))}

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
                  >
                    {editIndex !== null ? "Actualizar" : "Guardar"}
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
