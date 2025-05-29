import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Edit, Check, X, ArrowDownCircle, AlertCircle } from 'lucide-react';
import { 
  addEgreso, 
  fetchEgresosByArqueo, 
  getOpenArqueo,
  updateEgreso,
  deleteEgreso,
  getCurrentEmpleadoId,
  getHistorial
} from '../../../services/ArqueoService';

function CrudEgresos() {
  // Estados
  const [egresos, setEgresos] = useState([]);
  const [arqueoActual, setArqueoActual] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Estados para el formulario
  const [formData, setFormData] = useState({
    monto: '',
    descripcion: '',
    categoria: 'Gastos Operativos',
    justificacion: ''
  });
  
  // Estado para edición
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    monto: '',
    descripcion: '',
    categoria: '',
    justificacion: ''
  });

  // Categorías disponibles
  const categorias = [
    "Gastos Operativos",
    "Compra de Insumos",
    "Pago de Servicios",
    "Sueldos y comisiones",
    "Publicidad",
    "Mantenimiento",
    "Otros"
  ];

  // Función para limpiar mensajes después de un tiempo
  const clearMessages = () => {
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 5000);
  };

  // Función mejorada para buscar arqueo abierto
  const buscarArqueoAbierto = async (empleadoId) => {
    try {
    
      // Método 1: Usar la función getOpenArqueo
      try {
        const { exists, data } = await getOpenArqueo(empleadoId);
        if (exists && data) {
          return data;
        }
      } catch (err) {
        console.warn("⚠️ getOpenArqueo falló:", err.message);
      }
      
      // Método 2: Buscar en el historial general

      const historial = await getHistorial();
      
      if (Array.isArray(historial)) {
        // Buscar arqueos sin fecha de cierre (abiertos)
        const arqueosAbiertos = historial.filter(arqueo => 
          !arqueo.fechaCierre && 
          (arqueo.empleado?.idEmpleado === empleadoId || 
           arqueo.empleadoId === empleadoId ||
           arqueo.idEmpleado === empleadoId)
        );
        

        
        if (arqueosAbiertos.length > 0) {
          // Tomar el más reciente
          const arqueoActivo = arqueosAbiertos.sort((a, b) => 
            new Date(b.fechaInicio) - new Date(a.fechaInicio)
          )[0];
          

          return arqueoActivo;
        }

        // Si no encontramos por empleado específico, buscar cualquier arqueo abierto
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

  // Función para obtener ID del empleado
  const obtenerEmpleadoId = () => {
    try {
      // Usar la función getCurrentEmpleadoId
      let empleadoId = getCurrentEmpleadoId();

      
      if (empleadoId) {
        return Number(empleadoId);
      }
      
      // Decodificar token manualmente si es necesario
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(atob(base64));
          

          
          // Buscar el ID en diferentes propiedades posibles
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
      
      console.error("❌ No se pudo obtener el ID del empleado");
      return null;
    } catch (error) {
      console.error("❌ Error obteniendo empleado ID:", error);
      return null;
    }
  };

  // Cargar datos iniciales
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
         
          
          // 3. Cargar egresos del arqueo
          try {
            const egresosData = await fetchEgresosByArqueo(arqueoData.idArqueo || arqueoData.id);
            const egresosNormalizados = Array.isArray(egresosData) ? egresosData.map(egreso => ({
              idEgreso: egreso.id || egreso.idEgreso,
              monto: Number(egreso.monto) || 0,
              descripcion: egreso.descripcion || '',
              categoria: egreso.categoria || 'Gastos Operativos',
              justificacion: egreso.justificacion || '',
              fecha: egreso.fecha || egreso.createdAt,
              arqueoId: egreso.arqueoId || arqueoData.idArqueo || arqueoData.id
            })) : [];
            
            setEgresos(egresosNormalizados);
         
          } catch (egresosError) {
            console.warn("⚠️ Error cargando egresos, continuando con array vacío:", egresosError);
            setEgresos([]);
          }
        } else {
          setArqueoActual(null);
          setEgresos([]);
          setError("No hay un arqueo abierto actualmente. Debe abrir un arqueo para registrar egresos.");
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

  // Agregar nuevo egreso
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (!arqueoActual?.idArqueo && !arqueoActual?.id) {
        setError("No hay un arqueo abierto. Debe abrir un arqueo primero.");
        return;
      }

      // Validar campos
      if (!formData.monto || !formData.descripcion.trim() || !formData.categoria) {
        setError("Monto, descripción y categoría son requeridos");
        return;
      }

      const montoNumerico = Number(formData.monto);
      if (isNaN(montoNumerico) || montoNumerico <= 0) {
        setError("El monto debe ser un número válido mayor a 0");
        return;
      }

      // Crear objeto de egreso
      const egresoData = {
        monto: montoNumerico,
        descripcion: formData.descripcion.trim(),
        categoria: formData.categoria,
        justificacion: formData.justificacion.trim(),
        arqueoId: arqueoActual.idArqueo || arqueoActual.id
      };



      const nuevoEgreso = await addEgreso(egresoData);
      
      // Normalizar respuesta del servidor
      const egresoNormalizado = {
        idEgreso: nuevoEgreso.id || nuevoEgreso.idEgreso,
        monto: Number(nuevoEgreso.monto) || montoNumerico,
        descripcion: nuevoEgreso.descripcion || egresoData.descripcion,
        categoria: nuevoEgreso.categoria || egresoData.categoria,
        justificacion: nuevoEgreso.justificacion || egresoData.justificacion,
        fecha: nuevoEgreso.fecha || nuevoEgreso.createdAt || new Date().toISOString(),
        arqueoId: nuevoEgreso.arqueoId || egresoData.arqueoId
      };

      // Actualizar estado local
      setEgresos(prev => [...prev, egresoNormalizado]);
      
      // Limpiar formulario
      setFormData({ 
        monto: "", 
        descripcion: "", 
        categoria: "Gastos Operativos", 
        justificacion: "" 
      });
      setSuccess("Egreso registrado exitosamente");
      clearMessages();
      
    } catch (err) {
      console.error("❌ Error agregando egreso:", err);
      if (err.message.includes('Token') || err.message.includes('autenticado')) {
        setError("Sesión expirada. Por favor, inicie sesión nuevamente.");
      } else {
        setError(err.message || "Error al registrar egreso. Intente nuevamente.");
      }
      clearMessages();
    } finally {
      setLoading(false);
    }
  };

  // Iniciar edición de un egreso
  const handleStartEdit = (egreso) => {
    setEditingId(egreso.idEgreso);
    setEditForm({
      monto: egreso.monto.toString(),
      descripcion: egreso.descripcion || '',
      categoria: egreso.categoria || 'Gastos Operativos',
      justificacion: egreso.justificacion || ''
    });
    setError(null);
    setSuccess(null);
  };

  // Cancelar edición
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ 
      monto: '', 
      descripcion: '', 
      categoria: '', 
      justificacion: '' 
    });
  };

  // Guardar cambios de edición
  const handleSaveEdit = async (id) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Validar campos
      if (!editForm.monto || !editForm.descripcion.trim() || !editForm.categoria) {
        setError("Monto, descripción y categoría son requeridos");
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
        categoria: editForm.categoria,
        justificacion: editForm.justificacion.trim()
      };


      const egresoActualizado = await updateEgreso(id, datosActualizados);
      
      // Actualizar estado local
      setEgresos(prev => 
        prev.map(egr => 
          egr.idEgreso === id ? {
            ...egr,
            monto: datosActualizados.monto,
            descripcion: datosActualizados.descripcion,
            categoria: datosActualizados.categoria,
            justificacion: datosActualizados.justificacion
          } : egr
        )
      );
      
      setEditingId(null);
      setEditForm({ 
        monto: '', 
        descripcion: '', 
        categoria: '', 
        justificacion: '' 
      });
      setSuccess("Egreso actualizado correctamente");
      clearMessages();
      
    } catch (err) {
      console.error("❌ Error actualizando egreso:", err);
      if (err.message.includes('Token') || err.message.includes('autenticado')) {
        setError("Sesión expirada. Por favor, inicie sesión nuevamente.");
      } else {
        setError(err.message || "Error al actualizar el egreso. Intente nuevamente.");
      }
      clearMessages();
    } finally {
      setLoading(false);
    }
  };

  // Eliminar un egreso
  const handleDelete = async (id) => {
    if (!window.confirm("¿Está seguro de eliminar este egreso? Esta acción no se puede deshacer.")) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      await deleteEgreso(id);
      
      // Actualizar estado local
      setEgresos(prev => prev.filter(egr => egr.idEgreso !== id));
      
      setSuccess("Egreso eliminado correctamente");
      clearMessages();
      
    } catch (err) {
      console.error("❌ Error eliminando egreso:", err);
      if (err.message.includes('Token') || err.message.includes('autenticado')) {
        setError("Sesión expirada. Por favor, inicie sesión nuevamente.");
      } else {
        setError(err.message || "Error al eliminar el egreso. Intente nuevamente.");
      }
      clearMessages();
    } finally {
      setLoading(false);
    }
  };

  // Calcular total de egresos
  const calcularTotal = () => {
    if (!Array.isArray(egresos)) return 0;
    return egresos.reduce((total, egr) => total + (Number(egr.monto) || 0), 0);
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
          <ArrowDownCircle className="mr-2 text-red-600" />
          Gestión de Egresos
          {arqueoActual && (
            <span className="ml-4 text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">
              Arqueo #{arqueoActual.idArqueo || arqueoActual.id} - {arqueoActual.empleado?.nombre || 'Cajero'}
            </span>
          )}
        </h1>

        {error && <AlertMessage type="error" message={error} />}
        {success && <AlertMessage type="success" message={success} />}

        {loading && egresos.length === 0 && (
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
                <p className="text-sm mt-1">Debe abrir un arqueo de caja para registrar egresos</p>
              </div>
            </div>
          </div>
        ) : arqueoActual && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formulario de nuevo egreso */}
            <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Nuevo Egreso</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    placeholder="Descripción del egreso"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría *
                  </label>
                  <select
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-zinc-800 focus:border-transparent"
                    required
                    disabled={loading}
                  >
                    {categorias.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Justificación (Opcional)
                  </label>
                  <textarea
                    name="justificacion"
                    value={formData.justificacion}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-zinc-800 focus:border-transparent"
                    placeholder="Justificación del egreso"
                    rows="3"
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-zinc-800 to-black text-white py-2 px-4 rounded-md hover:from-black hover:to-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-800 focus:ring-offset-2 disabled:opacity-70 transition-all duration-200 flex items-center justify-center"
                >
                  <PlusCircle className="w-5 h-5 mr-2" />
                  {loading ? "Procesando..." : "Registrar Egreso"}
                </button>
              </form>
            </div>

            {/* Listado de egresos */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Egresos Registrados</h2>
                <div className="text-xl font-bold text-red-600">
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
                        Categoría
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Justificación
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {egresos.map((egreso) => (
                      <tr key={egreso.idEgreso}>
                        {editingId === egreso.idEgreso ? (
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
                                name="categoria"
                                value={editForm.categoria}
                                onChange={handleEditChange}
                                className="w-full p-1 border border-gray-300 rounded-sm text-sm focus:ring-2 focus:ring-zinc-800 focus:border-transparent"
                                required
                                disabled={loading}
                              >
                                {categorias.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="text"
                                name="justificacion"
                                value={editForm.justificacion}
                                onChange={handleEditChange}
                                className="w-full p-1 border border-gray-300 rounded-sm text-sm focus:ring-2 focus:ring-zinc-800 focus:border-transparent"
                                disabled={loading}
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleSaveEdit(egreso.idEgreso)}
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
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-red-600">
                              {formatCurrency(Number(egreso.monto))}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {egreso.descripcion || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {egreso.categoria || "Gastos Operativos"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {egreso.justificacion || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleStartEdit(egreso)}
                                  className="bg-gradient-to-r from-zinc-800 to-black text-white p-1.5 rounded-md hover:from-black hover:to-zinc-900 transition-all duration-200"
                                  disabled={loading}
                                  title="Editar egreso"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(egreso.idEgreso)}
                                  className="bg-gradient-to-r from-red-600 to-red-800 text-white p-1.5 rounded-md hover:from-red-700 hover:to-red-900 transition-all duration-200"
                                  disabled={loading}
                                  title="Eliminar egreso"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}

                    {egresos.length === 0 && !loading && (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                          <div className="flex flex-col items-center">
                            <ArrowDownCircle className="w-12 h-12 text-gray-300 mb-2" />
                            <p>No hay egresos registrados</p>
                            <p className="text-sm">Agregue el primer egreso usando el formulario</p>
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

export default CrudEgresos;