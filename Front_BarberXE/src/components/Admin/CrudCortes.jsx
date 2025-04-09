import React, { useState, useEffect } from "react";
import { Pencil, Trash2, Upload } from "lucide-react";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import {
    fetchCuts,
    createCut,
    updateCut,
    deleteCut,
} from "../../services/CortesServices.js"; // Asegúrate de que la ruta sea correcta
const IMAGE_BASE_URL = 'http://localhost:3000';

const TableCortes = () => {
    const [cortes, setCortes] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        estilo: "",
        imagen: "",
    });

    const [previewImage, setPreviewImage] = useState(null);
    const [editIndex, setEditIndex] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCortes = async () => {
            setLoading(true);
            try {
                const data = await fetchCuts();
                // Asegurarnos que las URLs de imagen son completas
                const cortesConImagenes = data.map(corte => ({
                    ...corte,
                    imagenUrl: corte.imagenUrl ? `${IMAGE_BASE_URL}${corte.imagenUrl}` : null
                }));
                setCortes(cortesConImagenes);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        loadCortes();
    }, []);

    const openModal = (index = null) => {
        setShowModal(true);
        if (index !== null) {
        setFormData(cortes[index]);
        setPreviewImage(cortes[index].imagen);
        setEditIndex(index);
        } else {
        setFormData({ estilo: "", imagen: "" });
        setPreviewImage(null);
        setEditIndex(null);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setFormData({ estilo: "", imagen: "" });
        setPreviewImage(null);
        setEditIndex(null);
        setError(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
        ...prev,
        [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('estilo', formData.estilo);
            
            // Solo agregar servicios si existen
            if (formData.servicioIds) {
                formDataToSend.append('servicioIds', JSON.stringify(formData.servicioIds));
            }
            
            // Verifica que la imagen exista antes de agregarla
            if (formData.imagen instanceof File) {
                formDataToSend.append('servicioIds', JSON.stringify(formData.servicioIds));
            }
    
            let response;
            if (editIndex !== null) {
                response = await updateCut(cortes[editIndex].idCorte, formDataToSend);
                
                // Crear URL temporal para la previsualización inmediata
                let newImageUrl = cortes[editIndex].imagenUrl;
                if (formData.imagen instanceof File) {
                    newImageUrl = URL.createObjectURL(formData.imagen);
                } else if (response.imagenUrl) {
                    newImageUrl = `${IMAGE_BASE_URL}${response.imagenUrl}`;
                }
    
                setCortes(prev => prev.map((item, idx) => 
                    idx === editIndex ? {
                        ...response,
                        imagenUrl: newImageUrl
                    } : item
                ));
            } else {
                response = await createCut(formDataToSend);
                
                // Crear URL temporal para la previsualización inmediata
                let newImageUrl = null;
                if (formData.imagen instanceof File) {
                    newImageUrl = URL.createObjectURL(formData.imagen);
                } else if (response.imagenUrl) {
                    newImageUrl = `${IMAGE_BASE_URL}${response.imagenUrl}`;
                }
    
                setCortes(prev => [...prev, {
                    ...response,
                    imagenUrl: newImageUrl
                }]);
            }
            
            closeModal();
        } catch (err) {
            console.error("Error al enviar datos:", err);
            setError(err.message || "Error al guardar el corte");
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData((prev) => ({
                ...prev,
                imagen: file  // Guarda el objeto File directamente
            }));
            
            // Crear URL para previsualización
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDelete = async (index) => {
        try {
        await deleteCut(cortes[index].idCorte);
        setCortes((prev) => prev.filter((_, i) => i !== index));
        } catch (err) {
        setError(err.message);
        }
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredCortes = cortes.filter((corte) =>
        corte.estilo.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                placeholder="Buscar estilo..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="border border-gray-300 rounded-md py-2 px-3 focus:ring-2 focus:ring-blue-500"
            />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {filteredCortes.map((corte, i) => (
                        <div key={i} className="bg-gray-100 rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                            {corte.imagenUrl ? (
                                <img
                                    src={corte.imagenUrl}
                                    alt={`Corte ${corte.estilo}`}
                                    className="w-full h-40 object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://via.placeholder.com/300x200?text=Imagen+no+disponible';
                                    }}
                                />
                            ) : (
                                <div className="w-full h-40 bg-gray-200 flex items-center justify-center">
                                    <span className="text-gray-500">Sin imagen</span>
                                </div>
                            )}
                            <div className="p-4">
                                <h3 className="text-xl font-semibold">{corte.estilo}</h3>
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

                {showModal && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black/75 bg-opacity-50 z-50">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-6 border border-gray-200">
                            <h2 className="text-2xl font-semibold flex items-center gap-2">
                                <PlusCircleIcon className="w-6 h-6 text-red-500" />{" "}
                                {editIndex !== null ? "Editar Corte" : "Añadir Corte"}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <input
                                    type="text"
                                    name="estilo"
                                    value={formData.estilo}
                                    onChange={handleChange}
                                    placeholder="Estilo"
                                    required
                                    className="w-full border p-2 rounded-md"
                                />
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

export default TableCortes;
