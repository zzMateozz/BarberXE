import React, { useState } from "react";
import { Pencil, Trash2} from "lucide-react";
import {PlusCircleIcon } from "@heroicons/react/24/outline"

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

const TableIngresos = ({ isCollapsed }) => {
  const [ingresos, setIngresos] = useState([
    {
      id_ingreso: "1",
      descripcion: "Venta de productos",
      fecha: "2025-04-01",
      valor: 500,
    },
    {
      id_ingreso: "2",
      descripcion: "Pago de cliente",
      fecha: "2025-03-28",
      valor: 1000,
    },
    // Agregar más ingresos según sea necesario
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    id_ingreso: "",
    descripcion: "",
    fecha: "",
    valor: "",
  });
  const [editIndex, setEditIndex] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const openModal = (index = null) => {
    setShowModal(true);
    if (index !== null) {
      setFormData(ingresos[index]);
      setEditIndex(index);
    } else {
      setFormData({
        id_ingreso: "",
        descripcion: "",
        fecha: "",
        valor: "",
      });
      setEditIndex(null);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      id_ingreso: "",
      descripcion: "",
      fecha: "",
      valor: "",
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
      setIngresos((prev) =>
        prev.map((ing, i) => (i === editIndex ? formData : ing))
      );
    } else {
      setIngresos((prev) => [...prev, formData]);
    }
    closeModal();
  };

  const handleDelete = (index) => {
    setIngresos((prev) => prev.filter((_, i) => i !== index));
  };

  // Método de búsqueda
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Filtrado de ingresos según el término de búsqueda
  const filteredIngresos = ingresos.filter((ing) =>
    Object.values(ing)
      .filter((val) => val !== ing.id_ingreso) // Excluye el id_ingreso del filtro
      .some((val) => val.toString().toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Paginación - Obtener ingresos de la página actual
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentIngresos = filteredIngresos.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  // Total de páginas
  const totalPages = Math.ceil(filteredIngresos.length / itemsPerPage);

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
            <PlusCircleIcon  className="w-6 h-6" /> Agregar
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
          className={`${styles.tableContainer} ${isCollapsed ? "mx-4" : "mx-0"}`}
        >
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>#</th>
                <th className={styles.th}>Descripción</th>
                <th className={styles.th}>Fecha</th>
                <th className={styles.th}>Valor</th>
                <th className={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentIngresos.map((ing, i) => (
                <tr key={i} className="bg-neutral-100">
                  <td className={styles.td}>{indexOfFirstItem + i + 1}</td>
                  <td className={styles.td}>{ing.descripcion}</td>
                  <td className={styles.td}>{ing.fecha}</td>
                  <td className={styles.td}>${ing.valor}</td>
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
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-6 border border-gray-200 max-h-[70vh] overflow-y-auto">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <PlusCircleIcon  className="w-6 h-6 text-red-500" />
                {editIndex !== null ? "Editar Ingreso" : "Añadir Ingreso"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {["descripcion", "fecha", "valor"].map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700">
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                    </label>
                    <input
                      type={field === "fecha" ? "date" : "text"}
                      name={field}
                      value={formData[field]}
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

export default TableIngresos;
