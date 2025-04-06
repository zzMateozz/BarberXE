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
} from "../../services/EmployeeService.js";
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
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);

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
    if (formData.nombre) {
      if (formData.nombre.length < 3) {
        setNombreError("El nombre debe tener al menos 3 caracteres");
      } else if (formData.nombre.length > 30) {
        setNombreError("El nombre no debe exceder 30 caracteres");
      } else {
        setNombreError("");
      }
    } else {
      setNombreError("");
    }
  }, [formData.nombre]);

  useEffect(() => {
    if (formData.apellido) {
      if (formData.apellido.length < 3) {
        setApellidoError("El apellido debe tener al menos 3 caracteres");
      } else if (formData.apellido.length > 30) {
        setApellidoError("El apellido no debe exceder 30 caracteres");
      } else {
        setApellidoError("");
      }
    } else {
      setApellidoError("");
    }
  }, [formData.apellido]);

  useEffect(() => {
    if (formData.telefono) {
      if (!/^\d+$/.test(formData.telefono)) {
        setTelefonoError("El teléfono solo debe contener números");
      } else if (formData.telefono.length < 7) {
        setTelefonoError("El teléfono debe tener al menos 7 dígitos");
      } else if (formData.telefono.length > 10) {
        setTelefonoError("El teléfono no debe exceder 10 dígitos");
      } else {
        setTelefonoError("");
      }
    } else {
      setTelefonoError("");
    }
  }, [formData.telefono]);

  useEffect(() => {
    if (formData.usuario) {
      if (formData.cargo === "Cajero") {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/;
        if (!emailRegex.test(formData.usuario)) {
          setUsuarioError("Correo inválido. Debe incluir @ y terminar en .com");
        } else {
          setUsuarioError("");
        }
      } else {
        setUsuarioError("");
      }
    } else {
      setUsuarioError("");
    }
  }, [formData.usuario, formData.cargo]);

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

  const openModal = (employeeId = null) => {
    setShowModal(true);
    setEditingEmployeeId(employeeId);
    
    if (employeeId !== null) {
      const employee = employees.find(emp => emp.idEmpleado === employeeId);
      if (employee) {
        setFormData({
          nombre: employee.nombre,
          apellido: employee.apellido,
          telefono: employee.telefono,
          estado: employee.estado,
          cargo: employee.cargo || "Barbero",
          usuario: employee.usuario || "",
          contraseña: "********",
          idUsuario: employee.idUsuario || null,
        });
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
        idUsuario: null,
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
      nombre: "",
      apellido: "",
      telefono: "",
      estado: "activo",
      cargo: "Barbero",
      usuario: "",
      contraseña: "",
      idUsuario: null,
    });
    setEditingEmployeeId(null);
    setError(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    if (name === "telefono") {
      processedValue = value.replace(/\D/g, '');
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
      ...(name === "cargo" &&
        value === "Barbero" && {
          usuario: "",
          contraseña: "",
        }),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (nombreError || apellidoError || telefonoError) {
      toast.error("Por favor corrija los errores en el formulario");
      return;
    }
    
    if (!formData.nombre || !formData.apellido || !formData.telefono) {
      toast.error("Los campos nombre, apellido y teléfono son obligatorios");
      return;
    }
  
    // Validaciones específicas para Cajeros
    if ((editingEmployeeId === null && formData.cargo === "Cajero") && 
        (usuarioError || contraseñaError || !formData.usuario || !formData.contraseña)) {
      toast.error("Para cajeros, usuario y contraseña son obligatorios y deben ser válidos");
      return;
    }
  
    try {
      if (editingEmployeeId !== null) {
        // 1. Buscar el empleado original para obtener su cargo actual
        const originalEmployee = employees.find(emp => emp.idEmpleado === editingEmployeeId);
        
        // 2. Preparar datos para actualización (sin incluir el cargo)
        const updateData = {
          nombre: formData.nombre,
          apellido: formData.apellido,
          telefono: formData.telefono,
          estado: formData.estado,
          cargo: originalEmployee.cargo // Mantenemos el cargo original
        };
      
        // 3. Actualizar en el backend
        await updateEmployee(editingEmployeeId, updateData);
      
        // 4. Actualizar el estado local
        setEmployees(prev => 
          prev.map(emp => 
            emp.idEmpleado === editingEmployeeId ? { 
              ...emp,          // Mantenemos todos los datos existentes
              ...updateData     // Aplicamos solo los cambios permitidos
            } : emp
          )
        );
        
        toast.success("Empleado actualizado con éxito");
      } 
       else {
        // Creación de nuevo empleado
        if (formData.cargo === "Cajero") {
          const response = await createUser({
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
  
          setEmployees(prev => [
            ...prev,
            {
              ...response.empleado,
              usuario: response.usuario,
              idUsuario: response.idUsuario
            }
          ]);
          toast.success("Cajero creado con éxito");
        } else {
          const newEmployee = await createEmployee({
            nombre: formData.nombre,
            apellido: formData.apellido,
            telefono: formData.telefono,
            estado: formData.estado,
            cargo: formData.cargo,
          });
          
          setEmployees(prev => [
            ...prev,
            {
              ...newEmployee,
              cargo: formData.cargo,
            }
          ]);
          toast.success("Barbero creado con éxito");
        }
      }
      closeModal();
    } catch (err) {
      console.error("Error en handleSubmit:", err);
      toast.error(err.response?.data?.message || err.message || "Error al guardar empleado");
    }
  };

  const handleDelete = async (employeeId) => {
    try {
      await deleteEmployee(employeeId);
      setEmployees(prev => prev.filter(emp => emp.idEmpleado !== employeeId));
      toast.success("Empleado eliminado con éxito");
    } catch (err) {
      toast.error(err.message || "Ocurrió un error al eliminar el empleado");
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
                <th className={styles.th}>Nombre</th>
                <th className={styles.th}>Apellido</th>
                <th className={styles.th}>Teléfono</th>
                <th className={styles.th}>Estado</th>
                <th className={styles.th}>Cargo</th>
                <th className={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.idEmpleado} className="bg-neutral-100">
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
                      onClick={() => openModal(emp.idEmpleado)}
                      className={`${styles.button} ${styles.editButton} mr-2`}
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(emp.idEmpleado)}
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
                {editingEmployeeId !== null ? "Editar Empleado" : "Añadir Empleado"}
              </h2>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Ingrese nombre (3-30 caracteres)"
                    className={`mt-1 w-full border rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500 ${getInputBorderClass(formData.nombre, nombreError)}`}
                    required
                    minLength={3}
                    maxLength={30}
                  />
                  <ValidationMessage message={nombreError} isValid={false} />
                  {formData.nombre && !nombreError && (
                    <ValidationMessage message="Nombre válido" isValid={true} />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Apellido
                  </label>
                  <input
                    type="text"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleChange}
                    placeholder="Ingrese apellido (3-30 caracteres)"
                    className={`mt-1 w-full border rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500 ${getInputBorderClass(formData.apellido, apellidoError)}`}
                    required
                    minLength={3}
                    maxLength={30}
                  />
                  <ValidationMessage message={apellidoError} isValid={false} />
                  {formData.apellido && !apellidoError && (
                    <ValidationMessage message="Apellido válido" isValid={true} />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="Ingrese teléfono (7-10 dígitos)"
                    className={`mt-1 w-full border rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500 ${getInputBorderClass(formData.telefono, telefonoError)}`}
                    required
                    minLength={7}
                    maxLength={10}
                    pattern="[0-9]{7,10}"
                  />
                  <ValidationMessage message={telefonoError} isValid={false} />
                  {formData.telefono && !telefonoError && (
                    <ValidationMessage message="Teléfono válido" isValid={true} />
                  )}
                </div>

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
                  {editingEmployeeId !== null ? (
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

                {formData.cargo === "Cajero" && editingEmployeeId === null && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nombre de Usuario
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
                        <ValidationMessage message="Usuario válido" isValid={true} />
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
                      (formData.cargo === "Cajero" && (usuarioError || contraseñaError))
                    }
                  >
                    {editingEmployeeId !== null ? "Actualizar" : "Guardar"}
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