import React, { useState, useEffect } from "react";
import { Pencil, Trash2, Upload, X } from "lucide-react";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import {
  fetchServices,
  createService,
  updateService,
  deleteService,
  fetchAllCuts,
} from "../../services/ServiceService.js";

const IMAGE_BASE_URL = "http://localhost:3000";

const TableServices = () => {
  const [services, setServices] = useState([]);
  const [allCuts, setAllCuts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showCutsModal, setShowCutsModal] = useState(false);
  const [selectedCuts, setSelectedCuts] = useState([]);
  const [formData, setFormData] = useState({
    nombre: "",
    precio: "",
    duracion: "",
    estado: "activo",
    imagen: null,
    corteIds: [],
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [servicesData, cutsData] = await Promise.all([
          fetchServices(),
          fetchAllCuts(),
        ]);

        const processedData = servicesData.map((service) => ({
          ...service,
          imagen: service.imagenUrl
            ? `${IMAGE_BASE_URL}${service.imagenUrl}`
            : null,
          cortes: service.cortes || [],
        }));

        setServices(processedData);
        setAllCuts(cutsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // Abrir modal de servicio
  const openModal = (index = null) => {
    setShowModal(true);
    if (index !== null) {
      const service = services[index];
      setFormData({
        ...service,
        corteIds: service.cortes.map((c) => c.idCorte),
      });
      setSelectedCuts(service.cortes);
      setPreviewImage(service.imagen);
      setEditIndex(index);
    } else {
      setFormData({
        nombre: "",
        precio: "",
        duracion: "",
        estado: "activo",
        imagen: null,
        corteIds: [],
      });
      setSelectedCuts([]);
      setPreviewImage(null);
      setEditIndex(null);
    }
  };

  // Abrir modal de selección de cortes
  const openCutsModal = () => {
    setShowCutsModal(true);
  };

  // Alternar selección de corte
  const toggleCutSelection = (cut) => {
    setSelectedCuts((prev) => {
      const isSelected = prev.some((c) => c.idCorte === cut.idCorte);
      if (isSelected) {
        return prev.filter((c) => c.idCorte !== cut.idCorte);
      } else {
        return [...prev, cut];
      }
    });
  };

  // Confirmar selección de cortes
  const confirmCutsSelection = () => {
    setFormData((prev) => ({
      ...prev,
      corteIds: selectedCuts.map((c) => c.idCorte),
    }));
    setShowCutsModal(false);
  };

  // Cerrar modal
  const closeModal = () => {
    setShowModal(false);
    setFormData({
      nombre: "",
      precio: "",
      duracion: "",
      estado: "activo",
      imagen: null,
      corteIds: [],
    });
    setSelectedCuts([]);
    setPreviewImage(null);
    setEditIndex(null);
    setError(null);
  };

  // Manejar cambios en los inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Manejar cambio de imagen
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        imagen: file,
      }));

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("nombre", formData.nombre);
      formDataToSend.append("precio", formData.precio);
      formDataToSend.append("duracion", formData.duracion);
      formDataToSend.append("estado", formData.estado);

      if (formData.imagen instanceof File) {
        formDataToSend.append("imagen", formData.imagen);
      }

      if (selectedCuts.length > 0) {
        formDataToSend.append(
          "corteIds",
          JSON.stringify(selectedCuts.map((c) => c.idCorte))
        );
      }

      if (editIndex !== null) {
        const updatedService = await updateService(
          services[editIndex].idServicio,
          formDataToSend
        );

        let newImageUrl = services[editIndex].imagen;
        if (formData.imagen instanceof File) {
          newImageUrl = URL.createObjectURL(formData.imagen);
        } else if (updatedService.imagenUrl) {
          newImageUrl = `${IMAGE_BASE_URL}${updatedService.imagenUrl}`;
        }

        setServices((prev) =>
          prev.map((service, i) =>
            i === editIndex
              ? {
                  ...updatedService,
                  imagen: newImageUrl,
                  cortes: selectedCuts,
                }
              : service
          )
        );
      } else {
        const newService = await createService(formDataToSend);

        let newImageUrl = null;
        if (formData.imagen instanceof File) {
          newImageUrl = URL.createObjectURL(formData.imagen);
        } else if (newService.imagenUrl) {
          newImageUrl = `${IMAGE_BASE_URL}${newService.imagenUrl}`;
        }

        setServices((prev) => [
          ...prev,
          {
            ...newService,
            imagen: newImageUrl,
            cortes: selectedCuts,
          },
        ]);
      }
      closeModal();
    } catch (err) {
      console.error("Error al guardar el servicio:", err);
      setError(err.message || "Error al guardar el servicio");
    }
  };

  // Eliminar servicio
  const handleDelete = async (index) => {
    try {
      await deleteService(services[index].idServicio);
      setServices((prev) => prev.filter((_, i) => i !== index));
    } catch (err) {
      console.error("Error al eliminar el servicio:", err);
      setError(err.message || "Error al eliminar el servicio");
    }
  };

  // Manejar cambio en el buscador
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredServices = services.filter((service) =>
    service.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Mostrar loading
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  // Mostrar error
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
            placeholder="Buscar nombre..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="border border-gray-300 rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-x-1 gap-y-8 px-1 py-6">
          {filteredServices.length > 0 ? (
            filteredServices.map((service, i) => (
              <div
                key={i}
                className="w-64 bg-gray-100 rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300 flex flex-col h-full" // Añade flex flex-col h-full
              >
                <div className="flex-grow">
                  <img
                    src={
                      service.imagen ||
                      "https://via.placeholder.com/300x200?text=Imagen+no+disponible"
                    }
                    alt={service.nombre}
                    className="w-full h-70 object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        "https://via.placeholder.com/300x200?text=Imagen+no+disponible";
                    }}
                  />
                  <div className="p-4">
                    <h3 className="text-xl font-semibold">{service.nombre}</h3>
                    <p className="text-gray-700 mt-1">
                      <strong>Precio:</strong> ${service.precio}
                    </p>
                    <p className="text-gray-700">
                      <strong>Duración:</strong> {service.duracion} min
                    </p>

                    {service.cortes && service.cortes.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">
                          Cortes incluidos:
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {service.cortes.map((corte) => (
                            <span
                              key={corte.idCorte}
                              className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                            >
                              {corte.estilo}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <span
                      className={`inline-block px-3 py-1 mt-2 text-sm font-semibold rounded-full ${
                        service.estado === "activo"
                          ? "bg-green-300 text-green-800"
                          : "bg-red-300 text-red-800"
                      }`}
                    >
                      {service.estado === "activo" ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </div>

          
                <div className="p-4 mt-auto">
                  <div className="flex justify-center gap-8">
                    <button
                      onClick={() => openModal(i)}
                      className="text-blue-500 hover:text-blue-700 hover:scale-110 transition-transform duration-200"
                    >
                      <Pencil size={22} />
                    </button>
                    <button
                      onClick={() => handleDelete(i)}
                      className="text-red-500 hover:text-red-700 hover:scale-110 transition-transform duration-200"
                    >
                      <Trash2 size={22} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              <p className="text-gray-500 text-lg">
                {isSearching
                  ? "No se encontraron servicios con ese nombre"
                  : "No hay servicios registrados"}
              </p>
            </div>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/75 bg-opacity-50 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-6 border border-gray-200">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <PlusCircleIcon className="w-6 h-6 text-red-500" />{" "}
                {editIndex !== null ? "Editar Servicio" : "Añadir Servicio"}
              </h2>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Nombre"
                  required
                  className="w-full border p-2 rounded-md"
                />
                <input
                  type="number"
                  name="precio"
                  value={formData.precio}
                  onChange={handleChange}
                  placeholder="Precio"
                  required
                  min="0"
                  step="0.01"
                  className="w-full border p-2 rounded-md"
                />
                <input
                  type="number"
                  name="duracion"
                  value={formData.duracion}
                  onChange={handleChange}
                  placeholder="Duración (minutos)"
                  required
                  min="1"
                  className="w-full border p-2 rounded-md"
                />
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  className="w-full border p-2 rounded-md"
                  required
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cortes asociados
                  </label>
                  <button
                    type="button"
                    onClick={openCutsModal}
                    className="w-full border border-gray-300 rounded-md p-2 text-left bg-white hover:bg-gray-50 transition-colors"
                  >
                    {selectedCuts.length > 0
                      ? `${selectedCuts.length} corte(s) seleccionado(s)`
                      : "Seleccionar cortes"}
                  </button>

                  
                  {selectedCuts.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedCuts.map((corte) => (
                        <span
                          key={corte.idCorte}
                          className="inline-flex items-center bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded"
                        >
                          {corte.estilo}
                          <button
                            type="button"
                            onClick={() => toggleCutSelection(corte)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            <X size={16} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <label className="border p-4 rounded-md flex flex-col items-center cursor-pointer">
                  <Upload size={32} className="text-gray-500" />
                  <span className="text-gray-500">Subir imagen</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                {previewImage && (
                  <img
                    src={previewImage}
                    alt="Vista previa"
                    className="w-full h-40 object-cover mt-2 rounded-lg"
                  />
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

     
        {showCutsModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/75 bg-opacity-50 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-6 border border-gray-200">
              <h2 className="text-2xl font-semibold">Seleccionar Cortes</h2>

              <div className="max-h-96 overflow-y-auto">
                {allCuts.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2">
                    {allCuts.map((corte) => (
                      <div
                        key={corte.idCorte}
                        className={`p-3 border rounded-md cursor-pointer transition-colors ${
                          selectedCuts.some((c) => c.idCorte === corte.idCorte)
                            ? "bg-blue-100 border-blue-300"
                            : "bg-white border-gray-200 hover:bg-gray-50"
                        }`}
                        onClick={() => toggleCutSelection(corte)}
                      >
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedCuts.some(
                              (c) => c.idCorte === corte.idCorte
                            )}
                            readOnly
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                          <span className="ml-3">{corte.estilo}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No hay cortes disponibles</p>
                )}
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowCutsModal(false)}
                  className="px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmCutsSelection}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default TableServices;
