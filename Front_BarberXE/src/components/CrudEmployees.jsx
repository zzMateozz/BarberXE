import React, { useState, useEffect } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  EyeIcon,
  EyeSlashIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";
import {
  fetchEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  searchEmployeesByName,
  createUser,
} from "../services/EmployeeService.js";

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

const TableEmployees = ({ isCollapsed }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    estado: "activo",
    cargo: "Barbero",
    usuario: "",
    contraseña: "",
    idUsuario: null,
  });
  const [editIndex, setEditIndex] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Cargar empleados al montar el componente
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const data = await fetchEmployees();
        const formattedData = data.map((emp) => ({
          ...emp,
          cargo: emp.cargo || "Barbero",
        }));
        setEmployees(formattedData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    loadEmployees();
  }, []);

  // Buscar empleados por nombre
  useEffect(() => {
    if (searchTerm) {
      const searchEmployees = async () => {
        try {
          const results = await searchEmployeesByName(searchTerm);
          setEmployees(results);
          setCurrentPage(1);
        } catch (err) {
          setError(err.message);
        }
      };

      const timer = setTimeout(() => {
        searchEmployees();
      }, 500);

      return () => clearTimeout(timer);
    } else {
      const reloadEmployees = async () => {
        try {
          const data = await fetchEmployees();
          setEmployees(data);
        } catch (err) {
          setError(err.message);
        }
      };
      reloadEmployees();
    }
  }, [searchTerm]);

  const openModal = (index = null) => {
    setShowModal(true);
    if (index !== null) {
      const employee = employees[index];
      setFormData({
        nombre: employee.nombre,
        apellido: employee.apellido,
        telefono: employee.telefono,
        estado: employee.estado,
        cargo: employee.cargo || "Barbero", // Mantener el cargo original
        usuario: employee.usuario || "",
        contraseña: "********", // Mostrar placeholder para contraseña
        idUsuario: employee.idUsuario || null,
      });
      setEditIndex(index);
    } else {
      setFormData({
        nombre: "",
        apellido: "",
        telefono: "",
        estado: "activo",
        cargo: "Barbero",
        usuario: "",
        contraseña: "",
        idUsuario: null,
      });
      setEditIndex(null);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      nombre: "",
      apellido: "",
      telefono: "",
      estado: "activo",
      cargo: "Barbero",
      usuario: "",
      contraseña: "",
      idUsuario: null,
    });
    setEditIndex(null);
    setError(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "cargo" &&
        value === "Barbero" && {
          usuario: "",
          contraseña: "",
        }),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editIndex !== null) {
        // Obtener el cargo original del empleado
        const originalCargo = employees[editIndex].cargo;
        const employeeId = employees[editIndex].idEmpleado;

        // Actualizar solo los campos permitidos (sin cambiar cargo, usuario o contraseña)
        const updatedEmployee = await updateEmployee(employeeId, {
          nombre: formData.nombre,
          apellido: formData.apellido,
          telefono: formData.telefono,
          estado: formData.estado,
          cargo: originalCargo, // Mantener el cargo original
        });

        setEmployees((prev) =>
          prev.map((emp, i) =>
            i === editIndex ? { ...updatedEmployee, cargo: originalCargo } : emp
          )
        );
      } else {
        if (formData.cargo === "Cajero") {
          // Crear usuario primero para cajeros
          const userResponse = await createUser({
            usuario: formData.usuario,
            contraseña: formData.contraseña,
            empleado: {
              nombre: formData.nombre,
              apellido: formData.apellido,
              telefono: formData.telefono,
              cargo: formData.cargo,
              estado: formData.estado,
            },
          });

          setEmployees((prev) => [
            ...prev,
            {
              ...userResponse.empleado,
              cargo: "Cajero",
            },
          ]);
        } else {
          // Crear empleado normal (barbero)
          const newEmployee = await createEmployee({
            nombre: formData.nombre,
            apellido: formData.apellido,
            telefono: formData.telefono,
            estado: formData.estado,
            cargo: formData.cargo,
          });
          setEmployees((prev) => [
            ...prev,
            {
              ...newEmployee,
              cargo: formData.cargo,
            },
          ]);
        }
      }
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (index) => {
    try {
      await deleteEmployee(employees[index].idEmpleado);
      setEmployees((prev) => prev.filter((_, i) => i !== index));
    } catch (err) {
      setError(err.message);
    }
  };

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEmployees = employees.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(employees.length / itemsPerPage);

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
                <th className={styles.th}>Nombre</th>
                <th className={styles.th}>Apellido</th>
                <th className={styles.th}>Teléfono</th>
                <th className={styles.th}>Estado</th>
                <th className={styles.th}>Cargo</th>
                <th className={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentEmployees.map((emp, i) => (
                <tr key={i} className="bg-neutral-100">
                  <td className={styles.td}>{emp.nombre}</td>
                  <td className={styles.td}>{emp.apellido}</td>
                  <td className={styles.td}>{emp.telefono}</td>
                  <td className={styles.td}>
                    <span
                      className={`py-1 px-2 rounded-full ${
                        emp.estado === "activo"
                          ? "bg-green-300 text-green-800"
                          : "bg-red-300 text-red-800"
                      }`}
                    >
                      {emp.estado}
                    </span>
                  </td>
                  <td className={styles.td}>{emp.cargo || "Barbero"}</td>
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
                {editIndex !== null ? "Editar Empleado" : "Añadir Empleado"}
              </h2>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                {["nombre", "apellido", "telefono"].map((field) => (
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
                    required
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Cargo
                  </label>
                  {editIndex !== null ? (
                    <input
                      type="text"
                      value={formData.cargo}
                      className="mt-1 w-full border rounded-md py-2 px-3 bg-gray-100 cursor-not-allowed"
                      readOnly
                    />
                  ) : (
                    <select
                      name="cargo"
                      value={formData.cargo}
                      onChange={handleChange}
                      className="mt-1 w-full border rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="Barbero">Barbero</option>
                      <option value="Cajero">Cajero</option>
                    </select>
                  )}
                </div>

                {formData.cargo === "Cajero" && editIndex === null && (
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
                          required
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

export default TableEmployees;
