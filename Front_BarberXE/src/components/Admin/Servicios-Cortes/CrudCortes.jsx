import React, { useState, useEffect } from "react"
import { Pencil, Trash2, Search, Plus, Upload, X, Check } from "lucide-react"
import { PlusCircleIcon } from "@heroicons/react/24/outline"
import {
  fetchCuts,
  createCut,
  updateCut,
  deleteCut,
} from "../../../services/CortesServices"
import { toast } from "react-toastify"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

const IMAGE_BASE_URL = 'http://localhost:3000'

const TableCortes = () => {
  const [cortes, setCortes] = useState([]) // Initialize as empty array
  const [searchTerm, setSearchTerm] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    estilo: "",
    imagen: null,
  })
  const [previewImage, setPreviewImage] = useState(null)
  const [editingCutId, setEditingCutId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Función auxiliar para validar y convertir datos a array   
  const ensureArray = (data, fallback = []) => {
    if (!data) return fallback;
    if (Array.isArray(data)) return data;

    // Si es un objeto, intentar extraer el array de diferentes propiedades comunes
    if (typeof data === 'object') {
      // Intentar diferentes nombres de propiedades
      const possibleArrays = [
        data.data,
        data.cortes,
        data.cuts,
        data.items,
        data.results,
        data.records,
        data.list
      ];

      for (const arr of possibleArrays) {
        if (Array.isArray(arr)) {
          return arr;
        }
      }

      // Si el objeto tiene propiedades que parecen ser elementos de un array
      const keys = Object.keys(data);
      if (keys.length > 0 && keys.every(key => !isNaN(key))) {
        // Convertir objeto indexado a array
        return Object.values(data);
      }
    }

    console.warn('Unexpected data format:', data);
    console.warn('Data keys:', typeof data === 'object' ? Object.keys(data) : 'Not an object');
    return fallback;
  };

  useEffect(() => {
    const loadCortes = async () => {
      setLoading(true);
      try {
        const response = await fetchCuts();
        
        console.log('Raw response:', response);
        
        // Asegurar que sea array usando la función auxiliar
        const data = ensureArray(response);
        console.log('Processed data:', data);
        
        // Validar que data realmente sea un array antes de usar map
        if (!Array.isArray(data)) {
          console.error('Cuts data is not an array after processing:', data);
          setCortes([]); // Set empty array as fallback
          setError('Error: Unable to load cuts data');
          return;
        }
        
        const cortesConImagenes = data.map(corte => {
          // Validar que corte sea un objeto válido
          if (!corte || typeof corte !== 'object') {
            console.warn('Invalid corte object:', corte);
            return null;
          }

          return {
            ...corte,
            imagenUrl: corte.imagenUrl 
              ? `${IMAGE_BASE_URL}${corte.imagenUrl}` 
              : null
          };
        }).filter(Boolean); // Filtrar elementos null
        
        setCortes(cortesConImagenes);
        setError(null); // Clear any previous errors
      } catch (err) {
        console.error('Error loading cuts:', err);
        setError(err.message || 'Error loading cuts');
        // Establecer array vacío como fallback
        setCortes([]);
      } finally {
        setLoading(false);
      }
    };
    loadCortes();
  }, []);

  const openModal = (cutId = null) => {
    setShowModal(true)
    setEditingCutId(cutId)

    if (cutId !== null) {
      const corte = cortes.find(c => c.idCorte === cutId)
      if (corte) {
        setFormData({
          estilo: corte.estilo || "",
          imagen: null
        })
        setPreviewImage(corte.imagenUrl)
      }
    } else {
      setFormData({ estilo: "", imagen: null })
      setPreviewImage(null)
    }
    setError(null)
  }

  const closeModal = () => {
    setShowModal(false)
    setFormData({ estilo: "", imagen: null })
    setPreviewImage(null)
    setEditingCutId(null)
    setError(null)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validaciones iniciales
    if (!formData.estilo) {
      toast.error("El estilo es obligatorio");
      return;
    }

    // Validar imagen solo para creación
    if (editingCutId === null && !formData.imagen) {
      toast.error("Debes seleccionar una imagen");
      return;
    }
    
    setSubmitting(true)
    
    const timeoutId = setTimeout(() => {
      setSubmitting(false);
      toast.warning("La operación está tardando más de lo esperado");
    }, 10000);

    try {
      setError(null);
      const formDataToSend = new FormData()
      formDataToSend.append('estilo', formData.estilo)
      
      if (formData.imagen instanceof File) {
        formDataToSend.append('imagen', formData.imagen)
      }

      let response
      if (editingCutId !== null) {
        // Actualización
        response = await updateCut(editingCutId, formDataToSend)
        
        console.log('Update response:', response);
        
        // Verificar diferentes posibles estructuras de respuesta
        let cutData = null;
        
        if (response.idCorte) {
          // Respuesta directa con el corte
          cutData = response;
        } else if (response.data && response.data.idCorte) {
          // Respuesta encapsulada en 'data'
          cutData = response.data;
        } else if (response.cut && response.cut.idCorte) {
          // Respuesta encapsulada en 'cut'
          cutData = response.cut;
        } else if (response.success) {
          // Solo confirmación de éxito, recargar datos
          console.log("Actualización exitosa, recargando datos del servidor...");
          const cortesActualizados = await fetchCuts();
          const processedCuts = ensureArray(cortesActualizados).map((corte) => ({
            ...corte,
            imagenUrl: corte.imagenUrl ? `${IMAGE_BASE_URL}${corte.imagenUrl}` : null,
          }));
          setCortes(processedCuts);
          toast.success("Corte actualizado correctamente");
          closeModal();
          return;
        } else {
          // Estructura desconocida, intentar recargar datos
          console.warn("Estructura de respuesta desconocida, recargando datos...");
          try {
            const cortesActualizados = await fetchCuts();
            const processedCuts = ensureArray(cortesActualizados).map((corte) => ({
              ...corte,
              imagenUrl: corte.imagenUrl ? `${IMAGE_BASE_URL}${corte.imagenUrl}` : null,
            }));
            setCortes(processedCuts);
            toast.success("Corte actualizado - Lista recargada");
            closeModal();
            return;
          } catch (reloadErr) {
            console.error("Error al recargar datos:", reloadErr);
            throw new Error("No se pudo confirmar la actualización");
          }
        }

        if (cutData) {
          let newImageUrl = cortes.find(c => c.idCorte === editingCutId)?.imagenUrl;
          if (formData.imagen instanceof File) {
            newImageUrl = URL.createObjectURL(formData.imagen);
          } else if (cutData.imagenUrl) {
            newImageUrl = `${IMAGE_BASE_URL}${cutData.imagenUrl}`;
          }

          setCortes(prev => prev.map(item => 
            item.idCorte === editingCutId ? {
              ...cutData,
              imagenUrl: newImageUrl
            } : item
          ));
          toast.success("Corte actualizado correctamente");
        }
      } else {
        // Creación
        console.log("Enviando creación de nuevo corte");
        
        try {
          response = await createCut(formDataToSend)
          
          console.log('Create response:', response);
          
          let cutData = null;
          
          if (response.idCorte) {
            cutData = response;
          } else if (response.data && response.data.idCorte) {
            cutData = response.data;
          } else if (response.cut && response.cut.idCorte) {
            cutData = response.cut;
          } else if (response.success || response.message) {
            // Solo confirmación de éxito, recargar datos
            console.log("Creación exitosa, recargando datos del servidor...");
            const cortesActualizados = await fetchCuts();
            const processedCuts = ensureArray(cortesActualizados).map((corte) => ({
              ...corte,
              imagenUrl: corte.imagenUrl ? `${IMAGE_BASE_URL}${corte.imagenUrl}` : null,
            }));
            setCortes(processedCuts);
            toast.success("Corte creado correctamente");
            closeModal();
            return;
          }
          
          if (cutData) {
            let newImageUrl = null;
            if (formData.imagen instanceof File) {
              newImageUrl = URL.createObjectURL(formData.imagen);
            } else if (cutData.imagenUrl) {
              newImageUrl = `${IMAGE_BASE_URL}${cutData.imagenUrl}`;
            }

            setCortes(prev => [...prev, {
              ...cutData,
              imagenUrl: newImageUrl
            }]);
            toast.success("Corte creado correctamente");
          } else {
            // Fallback: recargar todos los datos
            console.log("Estructura desconocida en creación, recargando...");
            const cortesActualizados = await fetchCuts();
            const processedCuts = ensureArray(cortesActualizados).map((corte) => ({
              ...corte,
              imagenUrl: corte.imagenUrl ? `${IMAGE_BASE_URL}${corte.imagenUrl}` : null,
            }));
            setCortes(processedCuts);
            toast.success("Corte creado - Lista actualizada");
          }
          
        } catch (err) {
          console.error("Error en creación:", err);
          
          // Intentar recargar datos como fallback
          try {
            console.log("Error en creación, intentando recargar datos...");
            const cortesActualizados = await fetchCuts();
            const processedCuts = ensureArray(cortesActualizados).map((corte) => ({
              ...corte,
              imagenUrl: corte.imagenUrl ? `${IMAGE_BASE_URL}${corte.imagenUrl}` : null,
            }));
            setCortes(processedCuts);
            toast.success("Corte procesado - Lista actualizada");
            closeModal();
            return;
          } catch (reloadErr) {
            console.error("Error al recargar después de fallo:", reloadErr);
            throw err; // Re-lanzar el error original
          }
        }
      }

      closeModal()
    } catch (err) {
      console.error('Error completo:', err);
      
      // Manejo adicional si falla
      try {
        const cortesActualizados = await fetchCuts();
        const processedCuts = ensureArray(cortesActualizados).map((corte) => ({
          ...corte,
          imagenUrl: corte.imagenUrl ? `${IMAGE_BASE_URL}${corte.imagenUrl}` : null,
        }));
        setCortes(processedCuts);
        toast.success("Corte procesado - Lista actualizada");
        closeModal(); // Cerrar modal si la actualización fue exitosa
      } catch (refreshErr) {
        console.error('Error al actualizar lista:', refreshErr);
      }
      
      let errorMessage = 'Error al guardar';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setSubmitting(false)
      clearTimeout(timeoutId); 
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData((prev) => ({
        ...prev,
        imagen: file
      }))
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, imagen: null }))
    setPreviewImage(null)
  }

  const handleDelete = async (cutId) => {
    try {
      await deleteCut(cutId)
      setCortes((prev) => prev.filter(c => c.idCorte !== cutId))
      toast.success("Corte eliminado con éxito")
    } catch (err) {
      console.error("Error al eliminar el corte:", err)
      toast.error(err.message || "Error al eliminar el corte")
    }
  }

  // Filtrar cortes por término de búsqueda - Add safety check
  const filteredCortes = Array.isArray(cortes) 
    ? cortes.filter((corte) =>
        corte?.estilo?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    )
  }

  if (error && !showModal) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md shadow-sm">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    )
  }

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-800 mb-2">Gestión de Cortes</h1>
          <p className="text-zinc-500">Administra los cortes de cabello disponibles</p>
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <Button
            onClick={() => openModal()}
            className="bg-gradient-to-r from-zinc-800 to-black hover:from-black hover:to-zinc-900 text-white font-medium py-2 px-4 rounded-md flex items-center gap-2 transition-colors"
          >
            <Plus size={18} /> Nuevo Corte
          </Button>

          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-zinc-400" />
            </div>
            <Input
              type="text"
              placeholder="Buscar por estilo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full bg-white border border-zinc-300 text-zinc-900 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors placeholder-zinc-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredCortes.length > 0 ? (
            filteredCortes.map((corte) => (
              <div
                key={corte.idCorte}
                className="bg-white rounded-lg shadow-md overflow-hidden border border-zinc-200 hover:shadow-lg transition-shadow duration-300"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={corte.imagenUrl || "https://via.placeholder.com/300x200?text=Sin+imagen"}
                    alt={`Corte ${corte.estilo || 'Sin nombre'}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = "https://via.placeholder.com/300x200?text=Sin+imagen"
                    }}
                  />
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-semibold text-zinc-800 text-center">
                    {corte.estilo || 'Sin nombre'}
                  </h3>

                  <div className="flex justify-center gap-4 mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openModal(corte.idCorte)}
                      className="text-zinc-600 hover:text-zinc-900"
                    >
                      <Pencil size={16} className="mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(corte.idCorte)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 size={16} className="mr-1" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              <p className="text-zinc-500">
                {searchTerm
                  ? "No se encontraron cortes con ese nombre"
                  : "No hay cortes registrados"}
              </p>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div
              className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden animate-in fade-in-90 zoom-in-90 duration-200"
              style={{ maxHeight: "90vh" }}
            >
              <div className="bg-gradient-to-r from-zinc-800 to-black px-6 py-5 relative">
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-zinc-600 to-zinc-800"></div>
                <div className="flex items-center gap-3">
                  {editingCutId !== null ? (
                    <div className="p-2 bg-white/10 rounded-lg">
                      <Pencil className="text-white h-6 w-6" />
                    </div>
                  ) : (
                    <div className="p-2 bg-white/10 rounded-lg">
                      <PlusCircleIcon className="text-white h-6 w-6" />
                    </div>
                  )}
                  <h2 className="text-xl font-bold text-white">
                    {editingCutId !== null ? "Editar Corte" : "Nuevo Corte"}
                  </h2>
                </div>
                <p className="text-white/80 text-sm mt-1">
                  {editingCutId !== null
                    ? "Actualiza la información del corte"
                    : "Complete el formulario para registrar un nuevo corte"}
                </p>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto" style={{ maxHeight: "calc(90vh - 180px)" }}>
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r-md">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-red-500"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="estilo">Estilo</Label>
                    <Input
                      id="estilo"
                      type="text"
                      name="estilo"
                      value={formData.estilo}
                      onChange={handleChange}
                      placeholder="Ej: Corte clásico"
                      required
                      className="w-full mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Imagen del Corte</label>
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-300 rounded-lg p-6 cursor-pointer hover:border-zinc-400 transition-colors mt-1">
                      {previewImage ? (
                        <div className="relative">
                          <img
                            src={previewImage}
                            alt="Vista previa"
                            className="h-40 object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-2 right-2 bg-white/80 hover:bg-white p-1 rounded-full shadow-sm"
                          >
                            <X size={16} className="text-zinc-700" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload size={24} className="text-zinc-400 mb-2" />
                          <p className="text-sm text-zinc-500 text-center">
                            Arrastra una imagen o haz clic para seleccionar Imagen
                          </p>
                          <p className="text-xs text-zinc-400 mt-1">
                            Formatos: JPG, PNG
                          </p>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                            id="cut-image"
                          />
                        </>
                      )}
                    </div>
                    <Label
                      htmlFor="cut-image"
                      className="mt-2 inline-block text-sm font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 px-3 py-1 rounded-md cursor-pointer transition-colors"
                    >
                      {previewImage ? "Cambiar imagen" : "Seleccionar imagen"}
                    </Label>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-50 px-6 py-4 flex justify-end gap-3 border-t border-zinc-200">
                <Button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  variant="outline"
                  className="text-zinc-700 border-zinc-300 hover:bg-zinc-100"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={submitting || !formData.estilo}
                  className="bg-gradient-to-r from-zinc-800 to-black hover:from-black hover:to-zinc-900 text-white"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {editingCutId !== null ? "Actualizando..." : "Guardando..."}
                    </>
                  ) : (
                    <>
                      {editingCutId !== null ? (
                        <>
                          <Check size={16} className="mr-1" />
                          Actualizar
                        </>
                      ) : (
                        <>
                          <Plus size={16} className="mr-1" />
                          Guardar
                        </>
                      )}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default TableCortes