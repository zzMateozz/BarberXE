import React, { useState } from "react";
import { Pencil, Trash2, Upload } from "lucide-react";
import { PlusCircleIcon } from "@heroicons/react/24/outline";

const TableServices = () => {
  const [services, setServices] = useState([
    {
      id: 1,
      nombre: "Afeitado",
      precio: "$10,000",
      duracion: "20 Min",
      estado: "Activo",
      imagen: "https://img.freepik.com/foto-gratis/cliente-haciendo-corte-pelo-salon-peluqueria_1303-20861.jpg",
    },
  ]);

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
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setFormData((prev) => ({ ...prev, imagen: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editIndex !== null) {
      setServices((prev) =>
        prev.map((service, i) => (i === editIndex ? formData : service))
      );
    } else {
      setServices((prev) => [...prev, { ...formData, id: prev.length + 1 }]);
    }
    closeModal();
  };

  const handleDelete = (index) => {
    setServices((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredServices = services.filter((service) =>
    Object.values(service).some((val) =>
      val.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

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
            placeholder="Buscar..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="border border-gray-300 rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Grid de tarjetas */}
        {/* Grid de tarjetas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredServices.map((service, i) => (
            <div
              key={i}
              className="bg-gray-100 rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300"
            >
              <img
                src={service.imagen}
                alt={service.nombre}
                className="w-full h-40 object-cover"
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
          ))}
        </div>

        {/* Modal de formulario */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/75 bg-opacity-50 z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-6 border border-gray-200">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <PlusCircleIcon className="w-6 h-6 text-red-500" />{" "}
                {editIndex !== null ? "Editar Servicio" : "Añadir Servicio"}
              </h2>
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

                {/* Subida de imagen con icono */}
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
                    alt="Preview"
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
