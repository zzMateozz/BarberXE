import React, { useState, useEffect } from "react";
import { fetchServices, fetchAllCuts } from "../../../services/ServiceService.js";

const IMAGE_BASE_URL = "http://localhost:3000";

const CardServices = () => {
    const [services, setServices] = useState([]);
    const [cuts, setCuts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("services"); // 'services' o 'cuts'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                const [servicesData, cutsData] = await Promise.all([
                    fetchServices(),
                    fetchAllCuts()
                ]);

                // Filtrar solo servicios activos
                const activeServices = servicesData.filter(
                    service => service.estado?.toLowerCase() === "activo"
                );

                    // Mostrar todos los cortes (sin filtrar por estado)
                 const allCuts = cutsData;

                const processedServices = activeServices.map((service) => ({
                    ...service,
                    imagen: service.imagenUrl
                        ? `${IMAGE_BASE_URL}${service.imagenUrl}`
                        : null,
                    cortes: service.cortes || [],
                }));

                setServices(processedServices);
                setCuts(allCuts);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, []);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredServices = services.filter((service) =>
        service.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredCuts = cuts.filter((cut) =>
        cut.estilo.toLowerCase().includes(searchTerm.toLowerCase())
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
        <section className="py-12 lg:py-16">
            <div className="container mx-auto px-4">
                {/* Barra de búsqueda y pestañas */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setActiveTab("services")}
                            className={`px-4 py-2 rounded-t-lg font-medium ${activeTab === "services"
                                    ? "bg-red-500 text-white"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                }`}
                        >
                            Servicios
                        </button>
                        <button
                            onClick={() => setActiveTab("cuts")}
                            className={`px-4 py-2 rounded-t-lg font-medium ${activeTab === "cuts"
                                    ? "bg-red-500 text-white"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                }`}
                        >
                            Cortes
                        </button>
                    </div>

                    <input
                        type="text"
                        placeholder={`Buscar ${activeTab === "services" ? "servicios" : "cortes"}...`}
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="border border-gray-300 rounded-md py-2 px-4 w-full md:w-64 focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Contenido de las pestañas */}
                {activeTab === "services" ? (
                    <>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Nuestros Servicios</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredServices.length > 0 ? (
                                filteredServices.map((service, i) => (
                                    <div
                                        key={`service-${i}`}
                                        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full border border-gray-100"
                                    >
                                        <div className="h-48 overflow-hidden">
                                            <img
                                                src={
                                                    service.imagen ||
                                                    "https://via.placeholder.com/300x200?text=Servicio"
                                                }
                                                alt={service.nombre}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src =
                                                        "https://via.placeholder.com/300x200?text=Servicio";
                                                }}
                                            />
                                        </div>

                                        <div className="p-4 flex-grow">
                                            <h3 className="text-xl font-bold text-gray-800 mb-2">
                                                {service.nombre}
                                            </h3>

                                            <div className="flex justify-between items-center mb-2">
                                                <div>
                                                    <span className="text-gray-600 font-medium">Precio: </span>
                                                    <span className="text-red-600 font-bold">
                                                        ${service.precio}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600 font-medium">Duración: </span>
                                                    <span className="text-gray-800">
                                                        {service.duracion} min
                                                    </span>
                                                </div>
                                            </div>

                                            {service.cortes && service.cortes.length > 0 && (
                                                <div className="mt-3">
                                                    <p className="text-sm font-medium text-gray-700 mb-1">
                                                        Cortes incluidos:
                                                    </p>
                                                    <div className="flex flex-wrap gap-1">
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
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-10">
                                    <p className="text-gray-500 text-lg">
                                        {searchTerm
                                            ? "No se encontraron servicios activos con ese nombre"
                                            : "No hay servicios activos disponibles"}
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Nuestros Cortes</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredCuts.length > 0 ? (
                                filteredCuts.map((cut, i) => (
                                    <div
                                        key={`cut-${i}`}
                                        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full border border-gray-100"
                                    >
                                        <div className="h-48 overflow-hidden">
                                            <img
                                                src={
                                                    cut.imagenUrl
                                                        ? `${IMAGE_BASE_URL}${cut.imagenUrl}`
                                                        : "https://via.placeholder.com/300x200?text=Corte"
                                                }
                                                alt={cut.estilo}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src =
                                                        "https://via.placeholder.com/300x200?text=Corte";
                                                }}
                                            />
                                        </div>

                                        <div className="p-4 flex-grow">
                                            <h3 className="text-xl font-bold text-gray-800 mb-2">
                                                {cut.estilo}
                                            </h3>

                                            <div className="mb-3">
                                                <p className="text-gray-600">{cut.descripcion}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-10">
                                    <p className="text-gray-500 text-lg">
                                        {searchTerm
                                            ? "No se encontraron cortes activos con ese nombre"
                                            : "No hay cortes activos disponibles"}
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </section>
    );
};

export default CardServices;