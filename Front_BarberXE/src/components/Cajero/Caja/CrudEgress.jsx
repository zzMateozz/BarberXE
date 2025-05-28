import React, { useState, useEffect, useCallback } from 'react';
import { PlusCircle, Trash2, Edit, Check, X, ArrowDownCircle } from 'lucide-react'; // ArrowDownCircle como ejemplo para egresos
import {
  addEgreso,
  fetchEgresosByArqueo,
  getOpenArqueo,
  // Asumimos que tienes o crearás estas funciones en ArqueoService:
  updateEgreso, // Necesaria para actualizar
} from '../../../services/ArqueoService';

// Función para formatear moneda (similar a CrudIncome)
const formatCurrency = (value) => {
  const numericValue = Number(value) || 0;
  return numericValue.toLocaleString('es-ES', { // Ajusta 'es-ES' y 'COP' si es necesario
    style: 'currency',
    currency: 'COP', // Cambia a la moneda que uses, ej: 'USD', 'EUR'
    minimumFractionDigits: 2
  });
};

function CrudEgresos() {
  // Estados
  const [egresos, setEgresos] = useState([]);
  const [arqueoActual, setArqueoActual] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [arqueoCajaId, setArqueoCajaId] = useState(null); // Mantener por consistencia si se usa

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Estados para el formulario de nuevo egreso
  const [formData, setFormData] = useState({
    monto: '',
    descripcion: '',
    categoria: 'Gastos Operativos', // Valor por defecto
    justificacion: ''
  });

  const categorias = [
    "Gastos Operativos",
    "Compra de Insumos",
    "Pago de Servicios",
    "Sueldos y comisiones",
    "Publicidad ",
    "Mantenimiento",
    "Otros"
  ];

  // Estado para edición
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    idEgreso: null,
    monto: '',
    descripcion: '',
    categoria: '',
    justificacion: ''
  });

  // Cargar datos iniciales (arqueo y egresos)
  const cargarDatosIniciales = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const empleadoIdActual = localStorage.getItem('currentEmpleadoIdForArqueo');
      if (!empleadoIdActual) {
        setError("No se encontró un empleado asociado al arqueo.");
        setLoading(false);
        return;
      }

      const { exists, data: arqueo } = await getOpenArqueo(empleadoIdActual);

      if (exists && arqueo) {
        setArqueoActual(arqueo);
        setArqueoCajaId(arqueo.idArqueo);

        const egresosData = await fetchEgresosByArqueo(arqueo.idArqueo);
        setEgresos(Array.isArray(egresosData) ? egresosData : []);
      } else {
        setError("Debe abrir un arqueo de caja primero para gestionar egresos.");
        setArqueoActual(null); // Asegurarse que no hay arqueo actual
        setEgresos([]); // Limpiar egresos si no hay arqueo
      }
    } catch (err) {
      setError(err.message || "Error al cargar datos de egresos");
    } finally {
      setLoading(false);
    }
  }, []); // useCallback para evitar re-creaciones innecesarias

  useEffect(() => {
    cargarDatosIniciales();
  }, [cargarDatosIniciales]);

  // Manejar cambios en el formulario principal
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Manejar cambios en el formulario de edición
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm({
      ...editForm,
      [name]: value
    });
  };

  // Agregar nuevo egreso
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!arqueoActual?.idArqueo) {
      setError("Debe existir un arqueo abierto para registrar un egreso.");
      return;
    }

    if (!formData.monto || !formData.descripcion || !formData.categoria) {
      setError("Monto, descripción y categoría son requeridos para el egreso.");
      return;
    }

    try {
      setLoading(true);
      const nuevoEgresoData = {
        monto: Number(formData.monto),
        descripcion: formData.descripcion.trim(),
        categoria: formData.categoria,
        justificacion: formData.justificacion.trim(),
        arqueoId: arqueoActual.idArqueo
      };

      const egresoAgregado = await addEgreso(nuevoEgresoData);
      // Asumimos que addEgreso devuelve el objeto egreso completo con su ID
      setEgresos([...egresos, egresoAgregado]);
      setFormData({ monto: "", descripcion: "", categoria: "Gastos Operativos", justificacion: "" });
      setSuccess("Egreso registrado exitosamente.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error al registrar egreso:", err);
      setError(err.message || "Error al registrar el egreso");
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Iniciar edición de un egreso
  const handleStartEdit = (egreso) => {
    setEditingId(egreso.idEgreso);
    setEditForm({
      idEgreso: egreso.idEgreso,
      monto: egreso.monto,
      descripcion: egreso.descripcion || '',
      categoria: egreso.categoria || 'Gastos Operativos',
      justificacion: egreso.justificacion || ''
    });
    setError(null); // Limpiar errores al iniciar edición
    setSuccess(null); // Limpiar mensajes de éxito
  };

  // Cancelar edición
  const handleCancelEdit = () => {
    setEditingId(null);
  };

  // Guardar cambios de edición
  const handleSaveEdit = async (id) => {
    setError(null);
    setSuccess(null);

    if (!editForm.monto || !editForm.descripcion || !editForm.categoria) {
      setError("Monto, descripción y categoría son requeridos para actualizar el egreso.");
      return;
    }

    try {
      setLoading(true);
      // Asegúrate de que updateEgreso existe y funciona como se espera en ArqueoService
      const egresoActualizado = await updateEgreso(id, {
        monto: Number(editForm.monto),
        descripcion: editForm.descripcion.trim(),
        categoria: editForm.categoria,
        justificacion: editForm.justificacion.trim(),
        // No es necesario enviar arqueoId si el backend no lo requiere para actualizar
      });

      // Actualizar el estado local de egresos
      setEgresos(egresos.map(egr => egr.idEgreso === id ? egresoActualizado : egr));
      setEditingId(null);
      setSuccess("Egreso actualizado correctamente.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error actualizando egreso:", err);
      setError(err.message || "Error al actualizar el egreso");
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Eliminar un egreso
  const handleDelete = async (id) => {
    if (!confirm("¿Está seguro de eliminar este egreso?")) {
      return;
    }
    setError(null);
    setSuccess(null);

    try {
      setLoading(true);
      // Actualizar el estado local de egresos
      setEgresos(egresos.filter(egr => egr.idEgreso !== id));
      setSuccess("Egreso eliminado correctamente.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error eliminando egreso:", err);
      setError(err.message || "Error al eliminar el egreso");
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Calcular total de egresos
  const calcularTotalEgresos = () => {
    if (!Array.isArray(egresos)) return 0;
    return egresos.reduce((total, egr) => total + (Number(egr.monto) || 0), 0);
  };

  return (
    <div className="min-h-[70vh] bg-gray-50 p-3">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center">
          <ArrowDownCircle className="mr-2 text-black-600" />
          Gestión de Egresos
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
            <p className="font-medium">No hay un arqueo abierto actualmente.</p>
            <p className="text-sm mt-1">Debe abrir un arqueo de caja para registrar egresos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formulario de nuevo egreso */}
            <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Nuevo Egreso</h2>
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
                    className="w-full p-2 border rounded-md"
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
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
                    className="w-full p-2 border rounded-md"
                    placeholder="Descripción del egreso"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <select
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                    disabled={loading}
                    required
                  >
                    <option value="">Selecciona una categoría</option>
                    {categorias.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
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
                    className="w-full p-2 border rounded-md"
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
                  Total: {formatCurrency(calcularTotalEgresos())}
                </div>
              </div>

              {loading && egresos.length === 0 ? (
                <div className="text-center py-8">Cargando egresos...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Justificación</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {egresos.map((egreso, index) => (
                        <tr key={egreso.idEgreso || `egreso-${index}`}>
                          {editingId === egreso.idEgreso ? (
                            // Modo edición
                            <>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="number"
                                  name="monto"
                                  value={editForm.monto}
                                  onChange={handleEditChange}
                                  className="w-full p-1 border rounded-sm text-sm"
                                  step="0.01" min="0.01" required
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="text"
                                  name="descripcion"
                                  value={editForm.descripcion}
                                  onChange={handleEditChange}
                                  className="w-full p-1 border rounded-sm text-sm"
                                  required
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <select
                                  name="categoria"
                                  value={editForm.categoria}
                                  onChange={handleEditChange}
                                  className="w-full p-1 border rounded-sm text-sm"
                                  required
                                >
                                  <option value="Gastos Operativos">Gastos Operativos</option>
                                  <option value="Compras Proveedores">Compras Proveedores</option>
                                  <option value="Servicios">Servicios</option>
                                  <option value="Otro">Otro</option>
                                </select>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="text"
                                  name="justificacion"
                                  value={editForm.justificacion}
                                  onChange={handleEditChange}
                                  className="w-full p-1 border rounded-sm text-sm"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleSaveEdit(egreso.idEgreso)}
                                    className="text-green-600 hover:text-green-900"
                                    disabled={loading}
                                  >
                                    <Check className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="text-red-600 hover:text-red-900"
                                    disabled={loading}
                                  >
                                    <X className="w-5 h-5" />
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
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                                {egreso.descripcion || "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {egreso.categoria || "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {egreso.justificacion || "-"}
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
                      {egresos.length === 0 && !loading && (
                        <tr>
                          <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                            No hay egresos registrados para este arqueo.
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

export default CrudEgresos;