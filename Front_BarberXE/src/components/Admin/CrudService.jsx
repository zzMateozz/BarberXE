import React, { useState, useEffect } from "react";
import { Pencil, Trash2, Upload, Search } from "lucide-react";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import {
  fetchServices,
  createService,
  updateService,
  deleteService,
  searchServicesByName
} from "../../services/ServiceService.js";

const IMAGE_BASE_URL = 'http://localhost:3000';

const TableServices = () => {
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    precio: "",
    duracion: "",
    estado: "Activo",
    imagen: "",
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Cargar servicios al montar el componente
  useEffect(() => {
    const loadServices = async () => {
      setLoading(true);
      try {
        const data = await fetchServices();
        const processedData = data.map(service => ({
          ...service,
          imagen: service.imagenUrl ? `${IMAGE_BASE_URL}${service.imagenUrl}` : service.imagen
        }));
        setServices(processedData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadServices();
  }, []);

  // Manejar búsqueda por nombre
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      // Si el término de búsqueda está vacío, cargar todos los servicios
      const data = await fetchServices();
      const processedData = data.map(service => ({
        ...service,
        imagen: service.imagenUrl ? `${IMAGE_BASE_URL}${service.imagenUrl}` : service.imagen
      }));
      setServices(processedData);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setLoading(true);
    try {
      const data = await searchServicesByName(searchTerm);
      const processedData = data.map(service => ({
        ...service,
        imagen: service.imagenUrl ? `${IMAGE_BASE_URL}${service.imagenUrl}` : service.imagen
      }));
      setServices(processedData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (index = null) => {
    setShowModal(true);
    if (index !== null) {
      setFormData(services[index]);
      setPreviewImage(services[index].imagen);
      setEditIndex(index);
    } else {
      setFormData({
        nombre: "",
        precio: "",
        duracion: "",
        estado: "Activo",
        imagen: "",
      });
      setPreviewImage(null);
      setEditIndex(null);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      nombre: "",
      precio: "",
      duracion: "",
      estado: "Activo",
      imagen: "",
    });
    setPreviewImage(null);
    setEditIndex(null);
    setError(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        imagen: file
      }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editIndex !== null) {
        const updatedService = await updateService(services[editIndex].id, formData);
        setServices(prev =>
          prev.map((service, i) => (i === editIndex ? {
            ...updatedService,
            imagen: updatedService.imagenUrl ? `${IMAGE_BASE_URL}${updatedService.imagenUrl}` : previewImage
          } : service))
        );
      } else {
        const newService = await createService(formData);
        setServices(prev => [...prev, {
          ...newService,
          imagen: newService.imagenUrl ? `${IMAGE_BASE_URL}${newService.imagenUrl}` : previewImage
        }]);
      }
      closeModal();
    } catch (err) {
      console.error("Error al guardar el servicio:", err);
      setError(err.message || "Error al guardar el servicio");
    }
  };

  const handleDelete = async (index) => {
    try {
      await deleteService(services[index].id);
      setServices((prev) => prev.filter((_, i) => i !== index));
    } catch (err) {
      console.error("Error al eliminar el servicio:", err);
      setError(err.message || "Error al eliminar el servicio");
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
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
          
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyPress={handleKeyPress}
              className="border border-gray-300 rounded-md py-2 px-3 pl-10 focus:ring-2 focus:ring-blue-500"
            />
            <Search 
              className="absolute left-3 text-gray-400" 
              size={18} 
              onClick={handleSearch}
            />
            {isSearching && (
              <button 
                onClick={async () => {
                  setSearchTerm("");
                  const data = await fetchServices();
                  const processedData = data.map(service => ({
                    ...service,
                    imagen: service.imagenUrl ? `${IMAGE_BASE_URL}${service.imagenUrl}` : service.imagen
                  }));
                  setServices(processedData);
                  setIsSearching(false);
                }}
                className="ml-2 text-sm text-red-500 hover:text-red-700"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {services.length > 0 ? (
            services.map((service, i) => (
              <div
                key={i}
                className="bg-gray-100 rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300"
              >
                <img
                  src={service.imagen || 'https://via.placeholder.com/300x200?text=Imagen+no+disponible'}
                  alt={service.nombre}
                  className="w-full h-40 object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/300x200?text=Imagen+no+disponible';
                  }}
                />
                <div className="p-4">
                  <h3 className="text-xl font-semibold">{service.nombre}</h3>
                  <p className="text-gray-700 mt-1">
                    <strong>Precio:</strong> {service.precio}
                  </p>
                  <p className="text-gray-700">
                    <strong>Duración:</strong> {service.duracion}
                  </p>
                  <span
                    className={`inline-block px-3 py-1 mt-2 text-sm font-semibold rounded-full ${
                      service.estado === "Activo"
                        ? "bg-green-300 text-green-800"
                        : "bg-red-300 text-red-800"
                    }`}
                  >
                    {service.estado}
                  </span>
                  <div className="flex justify-center text-center gap-8 mt-4">
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
                  type="text"
                  name="precio"
                  value={formData.precio}
                  onChange={handleChange}
                  placeholder="Precio"
                  required
                  className="w-full border p-2 rounded-md"
                />
                <input
                  type="text"
                  name="duracion"
                  value={formData.duracion}
                  onChange={handleChange}
                  placeholder="Duración"
                  required
                  className="w-full border p-2 rounded-md"
                />
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  className="w-full border p-2 rounded-md"
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>

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
      </div>
    </section>
  );
};

export default TableServices;