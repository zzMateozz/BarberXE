"use client"
import React, { useState, useEffect } from "react"
import { Pencil, Trash2, Search, Plus, Upload, X, Check } from "lucide-react"
import { PlusCircleIcon } from "@heroicons/react/24/outline"
import {
  fetchServices,
  createService,
  updateService,
  deleteService,
  fetchAllCuts,
} from "../../../services/ServiceService.js"
import { toast } from "react-toastify"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const IMAGE_BASE_URL = "http://localhost:3000"

const TableServices = () => {
  const [services, setServices] = useState([])
  const [allCuts, setAllCuts] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [showCutsModal, setShowCutsModal] = useState(false)
  const [selectedCuts, setSelectedCuts] = useState([])
  const [formData, setFormData] = useState({
    nombre: "",
    precio: "",
    duracion: "",
    estado: "activo",
    imagen: null,
    corteIds: [],
  })
  const [previewImage, setPreviewImage] = useState(null)
  const [editingServiceId, setEditingServiceId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      try {
        const [servicesData, cutsData] = await Promise.all([
          fetchServices(),
          fetchAllCuts(),
        ])

        const processedData = servicesData.map((service) => ({
          ...service,
          imagen: service.imagenUrl ? `${IMAGE_BASE_URL}${service.imagenUrl}` : null,
          cortes: service.cortes || [],
        }))

        setServices(processedData)
        setAllCuts(cutsData)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadInitialData()
  }, [])

  // Abrir modal de servicio
  const openModal = (serviceId = null) => {
    setShowModal(true)
    setEditingServiceId(serviceId)

    if (serviceId !== null) {
      const service = services.find((s) => s.idServicio === serviceId)
      if (service) {
        setFormData({
          nombre: service.nombre,
          precio: service.precio,
          duracion: service.duracion,
          estado: service.estado,
          imagen: null,
          corteIds: service.cortes.map((c) => c.idCorte),
        })
        setSelectedCuts(service.cortes)
        setPreviewImage(service.imagen)
      }
    } else {
      setFormData({
        nombre: "",
        precio: "",
        duracion: "",
        estado: "activo",
        imagen: null,
        corteIds: [],
      })
      setSelectedCuts([])
      setPreviewImage(null)
    }
    setError(null)
  }

  // Abrir modal de selección de cortes
  const openCutsModal = () => {
    setShowCutsModal(true)
  }

  // Alternar selección de corte
  const toggleCutSelection = (cut) => {
    setSelectedCuts((prev) => {
      const isSelected = prev.some((c) => c.idCorte === cut.idCorte)
      if (isSelected) {
        return prev.filter((c) => c.idCorte !== cut.idCorte)
      } else {
        return [...prev, cut]
      }
    })
  }

  // Confirmar selección de cortes
  const confirmCutsSelection = () => {
    setFormData((prev) => ({
      ...prev,
      corteIds: selectedCuts.map((c) => c.idCorte),
    }))
    setShowCutsModal(false)
  }

  // Cerrar modal
  const closeModal = () => {
    setShowModal(false)
    setFormData({
      nombre: "",
      precio: "",
      duracion: "",
      estado: "activo",
      imagen: null,
      corteIds: [],
    })
    setSelectedCuts([])
    setPreviewImage(null)
    setEditingServiceId(null)
    setError(null)
  }

  // Manejar cambios en los inputs
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Manejar cambio de imagen
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData((prev) => ({
        ...prev,
        imagen: file,
      }))

      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Eliminar imagen seleccionada
  const removeImage = () => {
    setFormData((prev) => ({ ...prev, imagen: null }))
    setPreviewImage(null)
  }

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    const timeoutId = setTimeout(() => {
      setSubmitting(false);
      toast.warning("La operación está tardando más de lo esperado");
    }, 10000);

    try {
      const formDataToSend = new FormData()
      formDataToSend.append("nombre", formData.nombre)
      formDataToSend.append("precio", formData.precio)
      formDataToSend.append("duracion", formData.duracion)
      formDataToSend.append("estado", formData.estado)

      if (formData.imagen instanceof File) {
        formDataToSend.append("imagen", formData.imagen)
      }

      if (selectedCuts.length > 0) {
        formDataToSend.append("corteIds", JSON.stringify(selectedCuts.map((c) => c.idCorte)))
      }

      if (editingServiceId !== null) {
        const updatedService = await updateService(editingServiceId, formDataToSend)

        let newImageUrl = services.find(s => s.idServicio === editingServiceId).imagen
        if (formData.imagen instanceof File) {
          newImageUrl = URL.createObjectURL(formData.imagen)
        } else if (updatedService.imagenUrl) {
          newImageUrl = `${IMAGE_BASE_URL}${updatedService.imagenUrl}`
        }

        setServices((prev) =>
          prev.map((service) =>
            service.idServicio === editingServiceId
              ? {
                ...updatedService,
                imagen: newImageUrl,
                cortes: selectedCuts,
              }
              : service
          )
        )
        toast.success("Servicio actualizado con éxito")
      } else {
        const newService = await createService(formDataToSend)

        let newImageUrl = null
        if (formData.imagen instanceof File) {
          newImageUrl = URL.createObjectURL(formData.imagen)
        } else if (newService.imagenUrl) {
          newImageUrl = `${IMAGE_BASE_URL}${newService.imagenUrl}`
        }

        setServices((prev) => [
          ...prev,
          {
            ...newService,
            imagen: newImageUrl,
            cortes: selectedCuts,
          },
        ])
        toast.success("Servicio creado con éxito")
      }
      closeModal()
    } catch (err) {
      console.error("Error al guardar el servicio:", err)
      setError(err.message || "Error al guardar el servicio")
      toast.error(err.message || "Error al guardar el servicio")
    } finally {
      setSubmitting(false)
      clearTimeout(timeoutId);
    }
  }

  // Eliminar servicio
  const handleDelete = async (serviceId) => {
    try {
      await deleteService(serviceId)
      setServices((prev) => prev.filter((s) => s.idServicio !== serviceId))
      toast.success("Servicio eliminado con éxito")
    } catch (err) {
      console.error("Error al eliminar el servicio:", err)
      toast.error(err.message || "Error al eliminar el servicio")
    }
  }

  // Filtrar servicios por término de búsqueda
  const filteredServices = services.filter((service) =>
    service.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Mostrar loading
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    )
  }

  // Mostrar error
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
          <h1 className="text-2xl font-semibold text-zinc-800 mb-2">Gestión de Servicios</h1>
          <p className="text-zinc-500">Administra los servicios de tu barbería</p>
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <Button
            onClick={() => openModal()}
            className="bg-gradient-to-r from-zinc-800 to-black hover:from-black hover:to-zinc-900 text-white font-medium py-2 px-4 rounded-md flex items-center gap-2 transition-colors"
          >
            <Plus size={18} /> Nuevo Servicio
          </Button>

          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-zinc-400" />
            </div>
            <Input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full bg-white border border-zinc-300 text-zinc-900 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors placeholder-zinc-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredServices.length > 0 ? (
            filteredServices.map((service) => (
              <div
                key={service.idServicio}
                className="bg-white rounded-lg shadow-md overflow-hidden border border-zinc-200 hover:shadow-lg transition-shadow duration-300 flex flex-col"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={
                      service.imagen ||
                      "https://via.placeholder.com/400x300?text=Sin+imagen"
                    }
                    alt={service.nombre}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src =
                        "https://via.placeholder.com/400x300?text=Sin+imagen"
                    }}
                  />
                  <div className="absolute top-2 right-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${service.estado === "activo"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                        }`}
                    >
                      {service.estado === "activo" ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-grow">
                  <h3 className="text-lg font-semibold text-zinc-800 mb-1">
                    {service.nombre}
                  </h3>
                  <div className="flex items-center gap-2 text-zinc-600 mb-2">
                    <span className="font-medium">${service.precio}</span>
                    <span className="text-zinc-400">•</span>
                    <span>{service.duracion} min</span>
                  </div>

                  {service.cortes && service.cortes.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-zinc-500 mb-1">Cortes incluidos:</p>
                      <div className="flex flex-wrap gap-1">
                        {service.cortes.map((corte) => (
                          <span
                            key={corte.idCorte}
                            className="bg-zinc-100 text-zinc-700 text-xs px-2 py-1 rounded"
                          >
                            {corte.estilo}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-zinc-100 flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openModal(service.idServicio)}
                    className="text-zinc-600 hover:text-zinc-900"
                  >
                    <Pencil size={16} className="mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(service.idServicio)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 size={16} className="mr-1" />
                    Eliminar
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              <p className="text-zinc-500">
                {searchTerm
                  ? "No se encontraron servicios con ese nombre"
                  : "No hay servicios registrados"}
              </p>
            </div>
          )}
        </div>

        {/* Modal de Servicio */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div
              className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden animate-in fade-in-90 zoom-in-90 duration-200"
              style={{ maxHeight: "90vh" }}
            >
              {/* Encabezado con gradiente negro */}
              <div className="bg-gradient-to-r from-zinc-800 to-black px-6 py-5 relative">
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-zinc-600 to-zinc-800"></div>
                <div className="flex items-center gap-3">
                  {editingServiceId !== null ? (
                    <div className="p-2 bg-white/10 rounded-lg">
                      <Pencil className="text-white h-6 w-6" />
                    </div>
                  ) : (
                    <div className="p-2 bg-white/10 rounded-lg">
                      <PlusCircleIcon className="text-white h-6 w-6" />
                    </div>
                  )}
                  <h2 className="text-xl font-bold text-white">
                    {editingServiceId !== null ? "Editar Servicio" : "Nuevo Servicio"}
                  </h2>
                </div>
                <p className="text-white/80 text-sm mt-1">
                  {editingServiceId !== null
                    ? "Actualiza la información del servicio"
                    : "Complete el formulario para registrar un nuevo servicio"}
                </p>
              </div>

              {/* Contenido con scroll */}
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

                {/* Formulario */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Nombre</label>
                    <Input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      placeholder="Ej: Corte clásico"
                      required
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Precio ($)</label>
                      <Input
                        type="number"
                        name="precio"
                        value={formData.precio}
                        onChange={handleChange}
                        placeholder="Ej: 25000"
                        min="0"
                        step="1000"
                        required
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Duración (min)</label>
                      <Input
                        type="number"
                        name="duracion"
                        value={formData.duracion}
                        onChange={handleChange}
                        placeholder="Ej: 30"
                        min="1"
                        required
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Estado</label>
                    <select
                      name="estado"
                      value={formData.estado}
                      onChange={handleChange}
                      className="w-full border border-zinc-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-800 focus:border-zinc-800"
                      required
                    >
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Cortes asociados</label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={openCutsModal}
                      className="w-full justify-start"
                    >
                      {selectedCuts.length > 0
                        ? `${selectedCuts.length} corte(s) seleccionado(s)`
                        : "Seleccionar cortes"}
                    </Button>

                    {selectedCuts.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedCuts.map((corte) => (
                          <span
                            key={corte.idCorte}
                            className="inline-flex items-center bg-zinc-100 text-zinc-700 text-sm px-2 py-1 rounded"
                          >
                            {corte.estilo}
                            <button
                              type="button"
                              onClick={() => toggleCutSelection(corte)}
                              className="ml-1 text-zinc-500 hover:text-zinc-700"
                            >
                              <X size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1">Imagen del servicio</label>
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-300 rounded-lg p-6 cursor-pointer hover:border-zinc-400 transition-colors">
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
                            id="service-image"
                          />
                        </>
                      )}
                    </div>
                    <label
                      htmlFor="service-image"
                      className="mt-2 inline-block text-sm font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 px-3 py-1 rounded-md cursor-pointer transition-colors"
                    >
                      {previewImage ? "Cambiar imagen" : "Seleccionar imagen"}
                    </label>
                  </div>
                </div>
              </div>

              {/* Footer con botones */}
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
                  disabled={submitting || !formData.nombre || !formData.precio || !formData.duracion}
                  className="bg-gradient-to-r from-zinc-800 to-black hover:from-black hover:to-zinc-900 text-white"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {editingServiceId !== null ? "Actualizando..." : "Guardando..."}
                    </>
                  ) : (
                    <>
                      {editingServiceId !== null ? (
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

        {/* Modal de Selección de Cortes */}
        {showCutsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden animate-in fade-in-90 zoom-in-90 duration-200">
              <div className="bg-gradient-to-r from-zinc-800 to-black px-6 py-5 relative">
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-zinc-600 to-zinc-800"></div>
                <h2 className="text-xl font-bold text-white">Seleccionar Cortes</h2>
                <p className="text-white/80 text-sm mt-1">
                  Selecciona los cortes que incluye este servicio
                </p>
              </div>

              <div className="p-6 max-h-96 overflow-y-auto">
                {allCuts.length > 0 ? (
                  <div className="space-y-2">
                    {allCuts.map((corte) => (
                      <div
                        key={corte.idCorte}
                        className={`p-3 border rounded-md cursor-pointer transition-colors ${selectedCuts.some((c) => c.idCorte === corte.idCorte)
                            ? "bg-zinc-100 border-zinc-300"
                            : "bg-white border-zinc-200 hover:bg-zinc-50"
                          }`}
                        onClick={() => toggleCutSelection(corte)}
                      >
                        <div className="flex items-center">
                          <div
                            className={`h-4 w-4 rounded border flex items-center justify-center mr-3 ${selectedCuts.some((c) => c.idCorte === corte.idCorte)
                                ? "bg-zinc-800 border-zinc-800"
                                : "border-zinc-300"
                              }`}
                          >
                            {selectedCuts.some((c) => c.idCorte === corte.idCorte) && (
                              <Check size={12} className="text-white" />
                            )}
                          </div>
                          <span className="text-zinc-700">{corte.estilo}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-500 text-center py-4">No hay cortes disponibles</p>
                )}
              </div>

              <div className="bg-zinc-50 px-6 py-4 flex justify-end gap-3 border-t border-zinc-200">
                <Button
                  type="button"
                  onClick={() => setShowCutsModal(false)}
                  variant="outline"
                  className="text-zinc-700 border-zinc-300 hover:bg-zinc-100"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={confirmCutsSelection}
                  className="bg-gradient-to-r from-zinc-800 to-black hover:from-black hover:to-zinc-900 text-white"
                >
                  <Check size={16} className="mr-1" />
                  Confirmar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default TableServices