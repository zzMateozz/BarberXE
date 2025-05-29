import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Edit, Check, X, DollarSign, AlertCircle } from 'lucide-react';
import { 
  addIngreso, 
  fetchIngresosByArqueo, 
  getOpenArqueo,
  updateIngreso,
  deleteIngreso,
  getCurrentEmpleadoId,
  getHistorial
} from '../../../services/ArqueoService';

function CrudIncome() {
  
  const [ingresos, setIngresos] = useState([]);
  const [arqueoActual, setArqueoActual] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
 
  const [formData, setFormData] = useState({
    monto: '',
    descripcion: '',
    medioPago: 'Efectivo'
  });
  

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    monto: '',
    descripcion: '',
    medioPago: ''
  });

  const clearMessages = () => {
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 5000);
  };

  const buscarArqueoAbierto = async (empleadoId) => {
    try {
      try {
        const { exists, data } = await getOpenArqueo(empleadoId);
        if (exists && data) {
          return data;
        }
      } catch (err) {
        console.warn("⚠️ getOpenArqueo falló:", err.message);
      }
      const historial = await getHistorial();
      if (Array.isArray(historial)) {
        const arqueosAbiertos = historial.filter(arqueo => 
          !arqueo.fechaCierre && 
          (arqueo.empleado?.idEmpleado === empleadoId || 
           arqueo.empleadoId === empleadoId ||
           arqueo.idEmpleado === empleadoId)
        );
        
        if (arqueosAbiertos.length > 0) {
          const arqueoActivo = arqueosAbiertos.sort((a, b) => 
            new Date(b.fechaInicio) - new Date(a.fechaInicio)
          )[0];
          return arqueoActivo;
        }
        const cualquierArqueoAbierto = historial.find(arqueo => !arqueo.fechaCierre);
        if (cualquierArqueoAbierto) {
          return cualquierArqueoAbierto;
        }
      }
      return null;
      
    } catch (error) {
      console.error("❌ Error buscando arqueo abierto:", error);
      throw error;
    }
  };

  const obtenerEmpleadoId = () => {
    try {
      let empleadoId = getCurrentEmpleadoId();
      
      if (empleadoId) {
        return Number(empleadoId);
      }
      
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(atob(base64));
          
          empleadoId = payload.empleadoId || 
                      payload.idEmpleado || 
                      payload.userId || 
                      payload.id ||
                      payload.sub;
          
          if (empleadoId) {
            return Number(empleadoId);
          }
        } catch (decodeError) {
          console.error("❌ Error decodificando token:", decodeError);
        }
      }
      
    
      console.warn("⚠️ Usando ID por defecto para testing");
      return 1;
      
    } catch (error) {
      console.error("❌ Error obteniendo empleado ID:", error);
      return null;
    }
  };


  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Obtener empleado ID
        const empleadoId = obtenerEmpleadoId();
        
        if (!empleadoId) {
          setError("No se encontró información del empleado. Por favor, inicie sesión nuevamente.");
          return;
        }

        // 2. Buscar arqueo abierto
        const arqueoData = await buscarArqueoAbierto(empleadoId);
        
        if (arqueoData) {
          setArqueoActual(arqueoData);
          
          // 3. Cargar ingresos del arqueo
          try {
            const ingresosData = await fetchIngresosByArqueo(arqueoData.idArqueo || arqueoData.id);
            const ingresosNormalizados = Array.isArray(ingresosData) ? ingresosData.map(ingreso => ({
              idIngreso: ingreso.id || ingreso.idIngreso,
              monto: Number(ingreso.monto) || 0,
              descripcion: ingreso.descripcion || '',
              medioPago: ingreso.medioPago || 'Efectivo',
              fecha: ingreso.fecha || ingreso.createdAt,
              arqueoId: ingreso.arqueoId || arqueoData.idArqueo || arqueoData.id
            })) : [];
            
            setIngresos(ingresosNormalizados);
          } catch (ingresosError) {
            console.warn("⚠️ Error cargando ingresos, continuando con array vacío:", ingresosError);
            setIngresos([]);
          }
        } else {
          setArqueoActual(null);
          setIngresos([]);
          setError("No hay un arqueo abierto actualmente. Debe abrir un arqueo para registrar ingresos.");
        }
      } catch (err) {
        console.error("❌ Error cargando datos:", err);
        if (err.message.includes('Token') || err.message.includes('autenticado')) {
          setError("Sesión expirada. Por favor, inicie sesión nuevamente.");
        } else {
          setError(err.message || "Error al cargar datos. Intente nuevamente.");
        }
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
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (!arqueoActual?.idArqueo && !arqueoActual?.id) {
        setError("No hay un arqueo abierto. Debe abrir un arqueo primero.");
        return;
      }

      // Validar campos
      if (!formData.monto || !formData.descripcion.trim()) {
        setError("Monto y descripción son requeridos");
        return;
      }

      const montoNumerico = Number(formData.monto);
      if (isNaN(montoNumerico) || montoNumerico <= 0) {
        setError("El monto debe ser un número válido mayor a 0");
        return;
      }

      // Crear objeto de ingreso
      const ingresoData = {
        monto: montoNumerico,
        descripcion: formData.descripcion.trim(),
        medioPago: formData.medioPago,
        arqueoId: arqueoActual.idArqueo || arqueoActual.id
      };

      const nuevoIngreso = await addIngreso(ingresoData);
      
      // Normalizar respuesta del servidor
      const ingresoNormalizado = {
        idIngreso: nuevoIngreso.id || nuevoIngreso.idIngreso,
        monto: Number(nuevoIngreso.monto) || montoNumerico,
        descripcion: nuevoIngreso.descripcion || ingresoData.descripcion,
        medioPago: nuevoIngreso.medioPago || ingresoData.medioPago,
        fecha: nuevoIngreso.fecha || nuevoIngreso.createdAt || new Date().toISOString(),
        arqueoId: nuevoIngreso.arqueoId || ingresoData.arqueoId
      };

      // Actualizar estado local
      setIngresos(prev => [...prev, ingresoNormalizado]);
      
      // Limpiar formulario
      setFormData({ monto: "", descripcion: "", medioPago: "Efectivo" });
      setSuccess("Ingreso registrado exitosamente");
      clearMessages();
      
    } catch (err) {
      console.error("❌ Error agregando ingreso:", err);
      if (err.message.includes('Token') || err.message.includes('autenticado')) {
        setError("Sesión expirada. Por favor, inicie sesión nuevamente.");
      } else {
        setError(err.message || "Error al registrar ingreso. Intente nuevamente.");
      }
      clearMessages();
    } finally {
      setLoading(false);
    }
  };

  // Iniciar edición de un ingreso
  const handleStartEdit = (ingreso) => {
    setEditingId(ingreso.idIngreso);
    setEditForm({
      monto: ingreso.monto.toString(),
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
      if (!editForm.monto || !editForm.descripcion.trim()) {
        setError("Monto y descripción son requeridos");
        return;
      }

      const montoNumerico = Number(editForm.monto);
      if (isNaN(montoNumerico) || montoNumerico <= 0) {
        setError("El monto debe ser un número válido mayor a 0");
        return;
      }

      const datosActualizados = {
        monto: montoNumerico,
        descripcion: editForm.descripcion.trim(),
        medioPago: editForm.medioPago
      };

   

      const ingresoActualizado = await updateIngreso(id, datosActualizados);
      
      // Actualizar estado local
      setIngresos(prev => 
        prev.map(ing => 
          ing.idIngreso === id ? {
            ...ing,
            monto: datosActualizados.monto,
            descripcion: datosActualizados.descripcion,
            medioPago: datosActualizados.medioPago
          } : ing
        )
      );
      
      setEditingId(null);
      setEditForm({ monto: '', descripcion: '', medioPago: '' });
      setSuccess("Ingreso actualizado correctamente");
      clearMessages();
      
    } catch (err) {
      console.error("❌ Error actualizando ingreso:", err);
      if (err.message.includes('Token') || err.message.includes('autenticado')) {
        setError("Sesión expirada. Por favor, inicie sesión nuevamente.");
      } else {
        setError(err.message || "Error al actualizar el ingreso. Intente nuevamente.");
      }
      clearMessages();
    } finally {
      setLoading(false);
    }
  };

  // Eliminar un ingreso
  const handleDelete = async (id) => {
    if (!window.confirm("¿Está seguro de eliminar este ingreso? Esta acción no se puede deshacer.")) {
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
      console.error("❌ Error eliminando ingreso:", err);
      if (err.message.includes('Token') || err.message.includes('autenticado')) {
        setError("Sesión expirada. Por favor, inicie sesión nuevamente.");
      } else {
        setError(err.message || "Error al eliminar el ingreso. Intente nuevamente.");
      }
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

  // Componente de alerta
  const AlertMessage = ({ type, message }) => {
    const bgColor = type === 'error' ? 'bg-red-100 text-red-700 border-red-300' : 'bg-green-100 text-green-700 border-green-300';
    const icon = type === 'error' ? <AlertCircle className="w-5 h-5 mr-2" /> : <Check className="w-5 h-5 mr-2" />;
    
    return (
      <div className={`mb-4 p-4 rounded-md border flex items-center ${bgColor}`}>
        {icon}
        {message}
      </div>
    );
  };

  return (
    <div className="min-h-[70vh] bg-gray-50 p-3">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center">
          <DollarSign className="mr-2" />
          Gestión de Ingresos
          {arqueoActual && (
            <span className="ml-4 text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">
              Arqueo #{arqueoActual.idArqueo || arqueoActual.id} - {arqueoActual.empleado?.nombre || 'Cajero'}
            </span>
          )}
        </h1>

        {error && <AlertMessage type="error" message={error} />}
        {success && <AlertMessage type="success" message={success} />}

        {loading && ingresos.length === 0 && (
          <div className="bg-blue-50 border border-blue-300 p-4 rounded-md text-blue-700 flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700 mr-2"></div>
            Cargando datos...
          </div>
        )}

        {!arqueoActual && !loading ? (
          <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-md text-yellow-700">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              <div>
                <p className="font-medium">No hay un arqueo abierto actualmente</p>
                <p className="text-sm mt-1">Debe abrir un arqueo de caja para registrar ingresos</p>
              </div>
            </div>
          </div>
        ) : arqueoActual && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formulario de nuevo ingreso */}
            <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Nuevo Ingreso</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monto ($) *
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
                    Descripción *
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
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-zinc-800 to-black text-white py-2 px-4 rounded-md hover:from-black hover:to-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-800 focus:ring-offset-2 disabled:opacity-70 transition-all duration-200 flex items-center justify-center"
                >
                  <PlusCircle className="w-5 h-5 mr-2" />
                  {loading ? "Procesando..." : "Registrar Ingreso"}
                </button>
              </div>
            </div>

            {/* Listado de ingresos */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Ingresos Registrados</h2>
                <div className="text-xl font-bold text-green-600">
                  Total: {formatCurrency(calcularTotal())}
                </div>
              </div>

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
                                disabled={loading}
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
                                disabled={loading}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <select
                                name="medioPago"
                                value={editForm.medioPago}
                                onChange={handleEditChange}
                                className="w-full p-1 border border-gray-300 rounded-sm text-sm focus:ring-2 focus:ring-zinc-800 focus:border-transparent"
                                disabled={loading}
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
                                  title="Editar ingreso"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(ingreso.idIngreso)}
                                  className="bg-gradient-to-r from-red-600 to-red-800 text-white p-1.5 rounded-md hover:from-red-700 hover:to-red-900 transition-all duration-200"
                                  disabled={loading}
                                  title="Eliminar ingreso"
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
                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                          <div className="flex flex-col items-center">
                            <DollarSign className="w-12 h-12 text-gray-300 mb-2" />
                            <p>No hay ingresos registrados</p>
                            <p className="text-sm">Agregue el primer ingreso usando el formulario</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CrudIncome;