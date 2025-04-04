import React, { useState } from "react";
import { Pencil, Trash2, PlusCircle } from "lucide-react";

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

const TableServices = ({ isCollapsed }) => {
  const [services, setServices] = useState([
    {
      id: 1,
      nombre: "Corte de cabello",
      precio: "$20,000",
      estado: "Activo",
    },
    {
      id: 2,
      nombre: "Afeitado",
      precio: "$15,000",
      estado: "Activo",
    },
    {
      id: 3,
      nombre: "Baño de vapor",
      precio: "$10,000",
      estado: "Inactivo",
    },
    {
      id: 4,
      nombre: "Corte y afeitado",
      precio: "$35,000",
      estado: "Activo",
    },
    {
      id: 5,
      nombre: "Peinado",
      precio: "$25,000",
      estado: "Activo",
    },
    {
      id: 6,
      nombre: "Tratamiento capilar",
      precio: "$30,000",
      estado: "Inactivo",
    },
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    precio: "",
    estado: "Activo",
  });
  const [editIndex, setEditIndex] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const openModal = (index = null) => {
    setShowModal(true);
    if (index !== null) {
      setFormData(services[index]);
      setEditIndex(index);
    } else {
      setFormData({
        nombre: "",
        precio: "",
        estado: "Activo",
      });
      setEditIndex(null);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      nombre: "",
      precio: "",
      estado: "Activo",
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
      setServices((prev) =>
        prev.map((service, i) => (i === editIndex ? formData : service))
      );
    } else {
      setServices((prev) => [
        ...prev,
        { ...formData, id: prev.length + 1 }, // Asegura un nuevo ID
      ]);
    }
    closeModal();
  };

  const handleDelete = (index) => {
    setServices((prev) => prev.filter((_, i) => i !== index));
  };

  // Método de búsqueda
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Filtrado de servicios según el término de búsqueda
  const filteredServices = services.filter((service) =>
    Object.values(service).some((val) =>
      val.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Paginación - Obtener servicios de la página actual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentServices = filteredServices.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  // Total de páginas
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage);

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
            <PlusCircle className="w-6 h-6" /> Agregar
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
                <th className={styles.th}>Nombre</th>
                <th className={styles.th}>Precio</th>
                <th className={styles.th}>Estado</th>
                <th className={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentServices.map((service, i) => (
                <tr key={i} className="bg-neutral-100">
                  <td className={styles.td}>{indexOfFirstItem + i + 1}</td>
                  <td className={styles.td}>{service.nombre}</td>
                  <td className={styles.td}>{service.precio}</td>
                  <td className={styles.td}>
                    <span
                      className={`py-1 px-2 rounded-full ${
                        service.estado === "Activo"
                          ? "bg-green-300 text-green-800"
                          : "bg-red-300 text-red-800"
                      }`}
                    >
                      {service.estado}
                    </span>
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
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-6 border border-gray-200">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <PlusCircle className="w-6 h-6 text-red-500" />{" "}
                {editIndex !== null ? "Editar Servicio" : "Añadir Servicio"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {["nombre", "precio"].map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700">
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                    </label>
                    <input
                      type="text"
                      name={field}
                      value={formData[field]}
                      onChange={handleChange}
                      placeholder={`Ingrese ${field}`}
                      className="mt-1 w-full border rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Estado
                  </label>
                  <select
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
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

export default TableServices;
