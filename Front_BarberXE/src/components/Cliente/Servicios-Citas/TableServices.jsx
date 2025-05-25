import React, { useState, useEffect } from "react";
import { fetchServices, fetchAllCuts } from "../../../services/ServiceService.js";
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton";

const IMAGE_BASE_URL = "http://localhost:3000";

const CardServices = () => {
    const [services, setServices] = useState([]);
    const [cuts, setCuts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("services");
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

                // Procesar servicios con IDs únicos
                const processedServices = activeServices.map((service) => ({
                    ...service,
                    id: service.id || `service-${Math.random().toString(36).substr(2, 9)}`,
                    imagen: service.imagenUrl
                        ? `${IMAGE_BASE_URL}${service.imagenUrl}`
                        : null,
                    cortes: service.cortes || [],
                }));

                // Procesar cortes con IDs únicos
                const processedCuts = cutsData.map((cut) => ({
                    ...cut,
                    idCorte: cut.idCorte || `cut-${Math.random().toString(36).substr(2, 9)}`,
                }));

                setServices(processedServices);
                setCuts(processedCuts);
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

    // Filtrar servicios por nombre
    const filteredServices = services.filter((service) =>
        service.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filtrar cortes por estilo
    const filteredCuts = cuts.filter((cut) =>
        cut.estilo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
                {[...Array(8)].map((_, i) => (
                    <Card key={`skeleton-${i}`}>
                        <CardHeader>
                            <Skeleton className="h-48 w-full" />
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                    </Card>
                ))}
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
                    <Tabs
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="w-full md:w-auto"
                    >
                        <TabsList className="bg-black grid w-full grid-cols-2 p-1 rounded-lg h-12 gap-1">
                            <TabsTrigger
                                value="services"
                                className="data-[state=active]:bg-white data-[state=active]:text-black
                           data-[state=active]:font-semibold py-2 rounded-md transition-all 
                           duration-300 font-medium text-white hover:bg-gray-800"
                            >
                                Servicios
                            </TabsTrigger>
                            <TabsTrigger
                                value="cuts"
                                className="data-[state=active]:bg-white data-[state=active]:text-black
                           data-[state=active]:font-semibold py-2 rounded-md transition-all 
                           duration-300 font-medium text-white hover:bg-gray-800"
                            >
                                Cortes
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <Input
                        type="text"
                        placeholder={`Buscar ${activeTab === "services" ? "servicios" : "cortes"}...`}
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="w-full md:w-64"
                    />
                </div>

                {/* Contenido de las pestañas */}
                {activeTab === "services" ? (
                    <>
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Nuestros Servicios</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredServices.length > 0 ? (
                                filteredServices.map((service) => (
                                    <Card key={`service-${service.id}`} className="hover:shadow-lg transition-shadow h-full flex flex-col">
                                        <div className="h-48 overflow-hidden">
                                            <img
                                                src={service.imagen || "https://via.placeholder.com/300x200?text=Servicio"}
                                                alt={service.nombre}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = "https://via.placeholder.com/300x200?text=Servicio";
                                                }}
                                            />
                                        </div>
                                        <CardHeader>
                                            <CardTitle className="text-xl">{service.nombre}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex-grow space-y-2">
                                            <div className="flex justify-between">
                                                <div>
                                                    <span className="text-sm text-muted-foreground">Precio: </span>
                                                    <span className="font-bold text-primary">${service.precio}</span>
                                                </div>
                                                <div>
                                                    <span className="text-sm text-muted-foreground">Duración: </span>
                                                    <span>{service.duracion} min</span>
                                                </div>
                                            </div>

                                            {service.cortes?.length > 0 && (
                                                <div className="mt-2">
                                                    <p className="text-sm text-muted-foreground mb-1">Cortes incluidos:</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {service.cortes.map((corte) => (
                                                            <Badge key={`service-${service.id}-cut-${corte.idCorte}`} variant="outline">
                                                                {corte.estilo}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-10">
                                    <p className="text-muted-foreground text-lg">
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
                                filteredCuts.map((cut) => (
                                    <Card key={`cut-${cut.idCorte}`} className="hover:shadow-lg transition-shadow h-full flex flex-col">
                                        <div className="h-48 overflow-hidden">
                                            <img
                                                src={cut.imagenUrl ? `${IMAGE_BASE_URL}${cut.imagenUrl}` : "https://via.placeholder.com/300x200?text=Corte"}
                                                alt={cut.estilo}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = "https://via.placeholder.com/300x200?text=Corte";
                                                }}
                                            />
                                        </div>
                                        <CardHeader>
                                            <CardTitle className="text-xl">{cut.estilo}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex-grow">
                                            <CardDescription>{cut.descripcion}</CardDescription>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-10">
                                    <p className="text-muted-foreground text-lg">
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