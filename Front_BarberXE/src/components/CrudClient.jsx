import React, { useState } from "react";
import { Pencil, Trash2} from "lucide-react";
import { EyeIcon, EyeSlashIcon, PlusCircleIcon } from "@heroicons/react/24/outline";

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
  const [showPassword, setShowPassword] = useState(false);
  const [clients, setClients] = useState([
    {
      cedula: "10293847",
      nombre: "Carlos",
      apellido: "Sánchez",
      telefono: "3123456789",
      correo: "carlos@example.com",
    },
    {
      cedula: "56473829",
      nombre: "Laura",
      apellido: "Martínez",
      telefono: "3234567890",
      correo: "laura@example.com",
    },
    {
      cedula: "84726394",
      nombre: "Pedro",
      apellido: "Ramírez",
      telefono: "3345678901",
      correo: "pedro@example.com",
    },
    {
      cedula: "23984756",
      nombre: "Marta",
      apellido: "López",
      telefono: "3456789012",
      correo: "marta@example.com",
    },
    {
      cedula: "39482756",
      nombre: "José",
      apellido: "González",
      telefono: "3567890123",
      correo: "jose@example.com",
    },
    {
      cedula: "48273691",
      nombre: "Ana",
      apellido: "Hernández",
      telefono: "3678901234",
      correo: "ana@example.com",
    },
    {
      cedula: "12983746",
      nombre: "Luis",
      apellido: "Torres",
      telefono: "3789012345",
      correo: "luis@example.com",
    },
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    cedula: "",
    nombre: "",
    apellido: "",
    telefono: "",
    correo: "",
  });
  const [editIndex, setEditIndex] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const openModal = (index = null) => {
    setShowModal(true);
    if (index !== null) {
      setFormData(clients[index]);
      setEditIndex(index);
    } else {
      setFormData({
        cedula: "",
        nombre: "",
        apellido: "",
        telefono: "",
        correo: "",
        contraseña: "",
      });
      setEditIndex(null);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      cedula: "",
      nombre: "",
      apellido: "",
      telefono: "",
      correo: "",
      contraseña: "",
    });
    setEditIndex(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editIndex !== null) {
      setClients((prev) =>
        prev.map((cli, i) => (i === editIndex ? formData : cli))
      );
    } else {
      setClients((prev) => [...prev, formData]);
    }
    closeModal();
  };

  const handleDelete = (index) => {
    setClients((prev) => prev.filter((_, i) => i !== index));
  };

  // Método de búsqueda
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Filtrado de clientes según el término de búsqueda
  const filteredClients = clients.filter((cli) =>
    Object.values(cli).some((val) =>
      val.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Paginación - Obtener clientes de la página actual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentClients = filteredClients.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  // Total de páginas
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  // Cambiar de página
  const changePage = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page); // Actualiza la página actual
    }
  };

  return (
    <section className="py-16 lg:py-20">
      <div className="container mx-auto px-4">
        <div className="flex justify-between mb-4">
          <button
            onClick={() => openModal()}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 flex items-center gap-2 rounded-3xl"
          >
       < PlusCircleIcon className="w-6 h-6" /> Agregar
          </button>
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={handleSearchChange}
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
                <th className={styles.th}>#</th>
                <th className={styles.th}>Cédula</th>
                <th className={styles.th}>Nombre</th>
                <th className={styles.th}>Apellido</th>
                <th className={styles.th}>Teléfono</th>
                <th className={styles.th}>Correo</th>
                <th className={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentClients.map((cli, i) => (
                <tr key={i} className="bg-neutral-100">
                  <td className={styles.td}>{indexOfFirstItem + i + 1}</td>
                  <td className={styles.td}>{cli.cedula}</td>
                  <td className={styles.td}>{cli.nombre}</td>
                  <td className={styles.td}>{cli.apellido}</td>
                  <td className={styles.td}>{cli.telefono}</td>
                  <td className={styles.td}>{cli.correo}</td>
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
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-6 border border-gray-200">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <PlusCircleIcon className="w-6 h-6 text-red-500" />{" "}
                {editIndex !== null ? "Editar Cliente" : "Añadir Cliente"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {[
                  "cedula",
                  "nombre",
                  "apellido",
                  "telefono",
                  "correo",
                  "contraseña",
                ].map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700">
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                    </label>
                    {field === "contraseña" ? (
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name={field}
                          value={formData[field]}
                          onChange={handleChange}
                          placeholder={`Ingrese ${field}`}
                          className="mt-1 w-full border rounded-md py-2 px-3 pr-10 focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-3 flex items-center"
                        >
                          {showPassword ? (
                            <EyeSlashIcon className= "w-6 h-6" />
                          ) : (
                            <EyeIcon className= "w-6 h-6" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <input
                        type="text"
                        name={field}
                        value={formData[field]}
                        onChange={handleChange}
                        placeholder={`Ingrese ${field}`}
                        className="mt-1 w-full border rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    )}
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
