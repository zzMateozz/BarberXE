import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Edit, Check, X, DollarSign } from 'lucide-react';
import { 
  addIngreso, 
  fetchIngresosByArqueo, 
  getOpenArqueo,
  updateIngreso,
  deleteIngreso
} from '../../../services/ArqueoService';

function CrudIncome() {
  // Estados
  const [ingresos, setIngresos] = useState([]);
  const [arqueoActual, setArqueoActual] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Estados para el formulario
  const [formData, setFormData] = useState({
    monto: '',
    descripcion: '',
    medioPago: 'Efectivo'
  });
  
  // Estado para edición
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    monto: '',
    descripcion: '',
    medioPago: ''
  });

  // Función para limpiar mensajes después de un tiempo
  const clearMessages = () => {
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 3000);
  };

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Obtener ID de empleado del localStorage
        const empleadoIdActual = localStorage.getItem('currentEmpleadoIdForArqueo');
        
        if (!empleadoIdActual) {
          setError("No se encontró un empleado asociado al arqueo.");
          return;
        }

        // 2. Obtener arqueo abierto
        const { exists, data: arqueo } = await getOpenArqueo(empleadoIdActual);
        
        if (exists && arqueo) {
          setArqueoActual(arqueo);
          
          // 3. Cargar ingresos del arqueo
          const ingresosData = await fetchIngresosByArqueo(arqueo.idArqueo);
          setIngresos(Array.isArray(ingresosData) ? ingresosData : []);
        } else {
          setArqueoActual(null);
          setIngresos([]);
          setError("No hay un arqueo abierto actualmente");
        }
      } catch (err) {
        console.error("Error cargando datos:", err);
        setError(err.message || "Error al cargar datos");
      } finally {
        setLoading(false);
      }
    };

    cargarDatosIniciales();
  }, []);

  // Manejar cambios en el formulario principal
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejar cambios en el formulario de edición
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Agregar nuevo ingreso
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (!arqueoActual?.idArqueo) {
        setError("Debe abrir un arqueo primero");
        return;
      }

      // Validar campos
      if (!formData.monto || !formData.descripcion) {
        setError("Monto y descripción son requeridos");
        return;
      }

      // Crear objeto de ingreso
      const ingresoData = {
        monto: Number(formData.monto),
        descripcion: formData.descripcion.trim(),
        medioPago: formData.medioPago,
        arqueoId: arqueoActual.idArqueo
      };

      const nuevoIngreso = await addIngreso(ingresoData);

      // Actualizar estado local
      setIngresos(prev => [...prev, nuevoIngreso]);
      
      // Limpiar formulario
      setFormData({ monto: "", descripcion: "", medioPago: "Efectivo" });
      setSuccess("Ingreso registrado exitosamente");
      clearMessages();
      
    } catch (err) {
      console.error("Error agregando ingreso:", err);
      setError(err.message || "Error al registrar ingreso");
      clearMessages();
    } finally {
      setLoading(false);
    }
  };

  // Iniciar edición de un ingreso
  const handleStartEdit = (ingreso) => {
    setEditingId(ingreso.idIngreso);
    setEditForm({
      monto: ingreso.monto,
      descripcion: ingreso.descripcion || '',
      medioPago: ingreso.medioPago || 'Efectivo'
    });
    setError(null);
    setSuccess(null);
  };

  // Cancelar edición
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ monto: '', descripcion: '', medioPago: '' });
  };

  // Guardar cambios de edición
  const handleSaveEdit = async (id) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Validar campos
      if (!editForm.monto || !editForm.descripcion) {
        setError("Monto y descripción son requeridos");
        return;
      }

      const datosActualizados = {
        monto: Number(editForm.monto),
        descripcion: editForm.descripcion.trim(),
        medioPago: editForm.medioPago
      };

      const ingresoActualizado = await updateIngreso(id, datosActualizados);
      
      // Actualizar estado local
      setIngresos(prev => 
        prev.map(ing => 
          ing.idIngreso === id ? { ...ing, ...ingresoActualizado } : ing
        )
      );
      
      setEditingId(null);
      setSuccess("Ingreso actualizado correctamente");
      clearMessages();
      
    } catch (err) {
      console.error("Error actualizando ingreso:", err);
      setError(err.message || "Error al actualizar el ingreso");
      clearMessages();
    } finally {
      setLoading(false);
    }
  };

  // Eliminar un ingreso
  const handleDelete = async (id) => {
    if (!window.confirm("¿Está seguro de eliminar este ingreso?")) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      await deleteIngreso(id);
      
      // Actualizar estado local
      setIngresos(prev => prev.filter(ing => ing.idIngreso !== id));
      
      setSuccess("Ingreso eliminado correctamente");
      clearMessages();
      
    } catch (err) {
      console.error("Error eliminando ingreso:", err);
      setError(err.message || "Error al eliminar el ingreso");
      clearMessages();
    } finally {
      setLoading(false);
    }
  };

  // Calcular total de ingresos
  const calcularTotal = () => {
    if (!Array.isArray(ingresos)) return 0;
    return ingresos.reduce((total, ing) => total + (Number(ing.monto) || 0), 0);
  };

  // Formato para moneda
  const formatCurrency = (value) => {
    const numericValue = Number(value) || 0;
    return numericValue.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    });
  };

  return (
    <div className="min-h-[70vh] bg-gray-50 p-3">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center">
          <DollarSign className="mr-2" />
          Gestión de Ingresos
        </h1>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-md">
            {success}
          </div>
        )}

        {!arqueoActual ? (
          <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-md text-yellow-700">
            <p className="font-medium">No hay un arqueo abierto actualmente</p>
            <p className="text-sm mt-1">Debe abrir un arqueo de caja para registrar ingresos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formulario de nuevo ingreso */}
            <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Nuevo Ingreso</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monto ($)
                  </label>
                  <input
                    type="number"
                    name="monto"
                    value={formData.monto}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-zinc-800 focus:border-transparent"
                    placeholder="0"
                    min="1"
                    step="0.01"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <input
                    type="text"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-zinc-800 focus:border-transparent"
                    placeholder="Descripción del ingreso"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medio de Pago
                  </label>
                  <select
                    name="medioPago"
                    value={formData.medioPago}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-zinc-800 focus:border-transparent"
                    disabled={loading}
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-zinc-800 to-black text-white py-2 px-4 rounded-md hover:from-black hover:to-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-800 focus:ring-offset-2 disabled:opacity-70 transition-all duration-200 flex items-center justify-center"
                >
                  <PlusCircle className="w-5 h-5 mr-2" />
                  {loading ? "Procesando..." : "Registrar Ingreso"}
                </button>
              </form>
            </div>

            {/* Listado de ingresos */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Ingresos Registrados</h2>
                <div className="text-xl font-bold text-green-600">
                  Total: {formatCurrency(calcularTotal())}
                </div>
              </div>

              {loading && ingresos.length === 0 ? (
                <div className="text-center py-8">Cargando...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Monto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Descripción
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Medio de Pago
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {ingresos.map((ingreso) => (
                        <tr key={ingreso.idIngreso}>
                          {editingId === ingreso.idIngreso ? (
                            // Modo edición
                            <>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="number"
                                  name="monto"
                                  value={editForm.monto}
                                  onChange={handleEditChange}
                                  className="w-full p-1 border border-gray-300 rounded-sm text-sm focus:ring-2 focus:ring-zinc-800 focus:border-transparent"
                                  min="1"
                                  step="0.01"
                                  required
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="text"
                                  name="descripcion"
                                  value={editForm.descripcion}
                                  onChange={handleEditChange}
                                  className="w-full p-1 border border-gray-300 rounded-sm text-sm focus:ring-2 focus:ring-zinc-800 focus:border-transparent"
                                  required
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <select
                                  name="medioPago"
                                  value={editForm.medioPago}
                                  onChange={handleEditChange}
                                  className="w-full p-1 border border-gray-300 rounded-sm text-sm focus:ring-2 focus:ring-zinc-800 focus:border-transparent"
                                >
                                  <option value="Efectivo">Efectivo</option>
                                  <option value="Tarjeta">Tarjeta</option>
                                  <option value="Transferencia">Transferencia</option>
                                  <option value="Otro">Otro</option>
                                </select>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleSaveEdit(ingreso.idIngreso)}
                                    className="bg-gradient-to-r from-zinc-800 to-black text-white p-1.5 rounded-md hover:from-black hover:to-zinc-900 transition-all duration-200"
                                    disabled={loading}
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="bg-gradient-to-r from-red-600 to-red-800 text-white p-1.5 rounded-md hover:from-red-700 hover:to-red-900 transition-all duration-200"
                                    disabled={loading}
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            // Modo vista
                            <>
                              <td className="px-6 py-4 whitespace-nowrap font-medium text-green-600">
                                {formatCurrency(Number(ingreso.monto))}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {ingreso.descripcion || "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {ingreso.medioPago || "Efectivo"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleStartEdit(ingreso)}
                                    className="bg-gradient-to-r from-zinc-800 to-black text-white p-1.5 rounded-md hover:from-black hover:to-zinc-900 transition-all duration-200"
                                    disabled={loading}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(ingreso.idIngreso)}
                                    className="bg-gradient-to-r from-red-600 to-red-800 text-white p-1.5 rounded-md hover:from-red-700 hover:to-red-900 transition-all duration-200"
                                    disabled={loading}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}

                      {ingresos.length === 0 && !loading && (
                        <tr>
                          <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                            No hay ingresos registrados
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CrudIncome;