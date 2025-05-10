import React, { useState, useEffect } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import {
  fetchIngresosByArqueo,
  addIngreso,
  deleteIngreso,
  getOpenArqueo
} from "../../services/ArqueoService";

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

const TableIngresos = ({ isCollapsed, arqueoActual }) => {
  const [ingresos, setIngresos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    descripcion: "",
    fecha: new Date().toISOString().split("T")[0],
    monto: "",
  });
  const [editIndex, setEditIndex] = useState(null);

  // Agrega este efecto para verificar el estado del arqueo
  useEffect(() => {
    const verificarArqueo = async () => {
      try {
        if (arqueoActual?.id) {
          const { exists, data } = await getOpenArqueo();

          if (!exists || data.id !== arqueoActual.id) {
            setError("El arqueo no está activo o ha sido cerrado");
            // Deshabilitar funcionalidades si es necesario
          }
        }
      } catch (error) {
        console.error("Error verificando arqueo:", error);
      }
    };

    verificarArqueo();
  }, [arqueoActual]);

  const fetchIngresos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchIngresosByArqueo(arqueoActual.id);
      setIngresos(response.data || response);
    } catch (error) {
      setError(`Error al obtener ingresos: ${error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Métodos para manejo de modal
  const openModal = (index = null) => {
    setShowModal(true);
    if (index !== null) {
      setFormData(ingresos[index]);
      setEditIndex(index);
    } else {
      resetFormData();
    }
  };

  const closeModal = () => {
    setShowModal(false);
    resetFormData();
  };

  const resetFormData = () => {
    setFormData({
      descripcion: "",
      fecha: new Date().toISOString().split("T")[0],
      monto: "",
    });
    setEditIndex(null);
  };

  // Métodos para manejo de formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Verificación adicional
      const { exists, data } = await getOpenArqueo();

      if (!exists || data.id !== arqueoActual.id) {
        throw new Error(
          "No se pueden agregar movimientos. El arqueo no está activo."
        );
      }

      if (!arqueoActual?.id) {
        throw new Error("No hay un arqueo abierto para agregar ingresos");
      }

      const ingresoData = {
        descripcion: formData.descripcion,
        fecha: formData.fecha,
        monto: Number(formData.monto),
        arqueoId: arqueoActual.id,
      };

      await addIngreso(arqueoActual.id, ingresoData);
      closeModal();
      await fetchIngresos();
    } catch (error) {
      setError(
        `Error al ${editIndex !== null ? "actualizar" : "agregar"} ingreso: ${
          error.message
        }`
      );
      console.error(error);
    }
  };

  const handleDelete = async (index) => {
    try {
      const ingresoId = ingresos[index].id;
      await deleteIngreso(ingresoId);
      await fetchIngresos();
    } catch (error) {
      setError(`Error al eliminar ingreso: ${error.message}`);
      console.error(error);
    }
  };

  // Métodos de búsqueda y paginación
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredIngresos = ingresos.filter((ing) =>
    Object.values(ing).some((val) =>
      val?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <section className="py-16 lg:py-20">
      <div className="container mx-auto px-4">
        <div className="flex justify-between mb-4">
          <button
            onClick={() => openModal()}
            className={`bg-red-500 text-white font-semibold py-3 px-4 flex items-center gap-2 rounded-3xl ${
              !arqueoActual?.id || arqueoActual?.fechaCierre
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-red-600"
            }`}
            disabled={!arqueoActual?.id || arqueoActual?.fechaCierre}
            title={
              !arqueoActual?.id
                ? "No hay arqueo seleccionado"
                : arqueoActual?.fechaCierre
                ? "El arqueo está cerrado"
                : "Agregar ingreso"
            }
          >
            <PlusCircleIcon className="w-6 h-6" />
            Agregar Ingreso
          </button>
          <input
            type="text"
            placeholder="Buscar ingresos..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="border border-gray-300 rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Cargando ingresos...</div>
        ) : (
          <>
            <div
              className={`${styles.tableContainer} ${
                isCollapsed ? "mx-4" : "mx-0"
              }`}
            >
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>#</th>
                    <th className={styles.th}>Descripción</th>
                    <th className={styles.th}>Fecha</th>
                    <th className={styles.th}>Monto</th>
                    <th className={styles.th}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIngresos.map((ing, i) => (
                    <tr key={ing.id || i} className="bg-neutral-100">
                      <td className={styles.td}>{indexOfFirstItem + i + 1}</td>
                      <td className={styles.td}>{ing.descripcion}</td>
                      <td className={styles.td}>{ing.fecha}</td>
                      <td className={styles.td}>
                        ${ing.monto.toLocaleString()}
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
                  {filteredIngresos.length === 0 && (
                    <tr>
                      <td
                        colSpan="5"
                        className="py-4 text-center text-gray-500"
                      >
                        No hay ingresos registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/75 bg-opacity-50 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-6 border border-gray-200 max-h-[70vh] overflow-y-auto">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <PlusCircleIcon className="w-6 h-6 text-red-500" />
                {editIndex !== null ? "Editar Ingreso" : "Añadir Ingreso"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Descripción
                  </label>
                  <input
                    type="text"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    placeholder="Ingrese descripción"
                    className="mt-1 w-full border rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Fecha
                  </label>
                  <input
                    type="date"
                    name="fecha"
                    value={formData.fecha}
                    onChange={handleChange}
                    className="mt-1 w-full border rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Monto
                  </label>
                  <input
                    type="number"
                    name="monto"
                    value={formData.monto}
                    onChange={handleChange}
                    placeholder="Ingrese monto"
                    step="0.01"
                    min="0"
                    className="mt-1 w-full border rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500"
                    required
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
