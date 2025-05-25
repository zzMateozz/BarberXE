import React, { useState, useEffect } from "react";
import { fetchEmployees, searchEmployeesByName } from "../../../services/EmployeeService.js";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, User, Loader2 } from "lucide-react";


const IMAGE_BASE_URL = "http://localhost:3000";

const BarberosCards = ({ isCollapsed }) => {
  const [barberos, setBarberos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [imageVersion, setImageVersion] = useState(0); // Control de versiones de imagen

  // Cargar barberos al montar el componente
  useEffect(() => {
    const loadBarberos = async () => {
      try {
        const data = await fetchEmployees();
        const filteredData = data.filter(emp =>
          (emp.cargo === "Barbero" || !emp.cargo) && emp.estado === "activo"
        );
        setBarberos(filteredData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadBarberos();
  }, []);

  // Buscar barberos por nombre
  useEffect(() => {
    if (searchTerm.trim() === "") {
      const loadAllBarberos = async () => {
        try {
          setIsSearching(true);
          const data = await fetchEmployees();
          const filteredData = data.filter(emp =>
            (emp.cargo === "Barbero" || !emp.cargo) && emp.estado === "activo"
          );
          setBarberos(filteredData);
          setImageVersion(prev => prev + 1); // Incrementar versión de imágenes
        } catch (err) {
          setError(err.message);
        } finally {
          setIsSearching(false);
        }
      };
      loadAllBarberos();
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchEmployeesByName(searchTerm);
        const filteredResults = results.filter(emp =>
          (emp.cargo === "Barbero" || !emp.cargo) && emp.estado === "activo"
        );
        setBarberos(filteredResults);
        setImageVersion(prev => prev + 1); // Incrementar versión de imágenes
      } catch (err) {
        setError(err.message);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const getImageUrl = (url) => {
    if (!url) return null;

    // Si la url ya es absoluta, no la modifiques
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url + `?v=${imageVersion}`;
    }

    // Si es relativa, limpiala y concatena
    const cleanUrl = url.replace(/^\/+/, "");
    return `${IMAGE_BASE_URL}/${cleanUrl}?v=${imageVersion}`;
  };



  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
        {[...Array(8)].map((_, i) => (
          <Card key={`skeleton-${i}`} className="bg-gray-50">
            <CardHeader>
              <Skeleton className="h-48 w-full bg-gray-200" />
              <Skeleton className="h-6 w-3/4 bg-gray-200" />
              <Skeleton className="h-4 w-full bg-gray-200" />
              <Skeleton className="h-4 w-1/2 bg-gray-200" />
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
    <section className="py-8 lg:py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="w-full md:w-auto">
            <h2 className="text-2xl font-bold text-gray-800">Nuestros Barberos</h2>
          </div>

          <Input
            type="text"
            placeholder="Buscar barberos por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64"
          />
        </div>

        {isSearching ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : barberos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {searchTerm
                ? "No se encontraron barberos con ese nombre"
                : "No hay barberos disponibles"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {barberos.map((barbero) => (
              <Card
                key={`${barbero.idEmpleado}-${imageVersion}`}
                className="hover:shadow-lg transition-shadow h-full flex flex-col bg-gray-50 border-gray-200"
              >
                <div className="relative w-full h-48 overflow-hidden bg-gray-200">
                  {barbero.imagenPerfil ? (
                    <img
                      key={`img-${barbero.idEmpleado}-${getImageUrl(barbero.imagenPerfil)}`}
                      src={getImageUrl(barbero.imagenPerfil)}
                      alt={`${barbero.nombre} ${barbero.apellido}`}
                      className="absolute inset-0 w-full h-full object-cover object-center"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNjg2ODY4IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTIwIDIxdi0yYTQgNCAwIDAgMC00LTRIOGE0IDQgMCAwIDAtNCA0djIiLz48Y2lyY2xlIGN4PSIxMiIgY3k9IjciIHI9IjQiLz48L3N2Zz4=';
                        e.currentTarget.className = 'absolute inset-0 w-full h-full object-contain p-8 bg-gray-200';
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                      <User className="w-1/3 h-1/3 text-gray-400" />
                    </div>
                  )}
                </div>

                <CardHeader>
                  <CardTitle className="text-xl text-gray-800">
                    {barbero.nombre} {barbero.apellido}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Barbero profesional
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-grow">
                  <div className="flex items-center text-sm text-gray-700">
                    <Phone className="w-4 h-4 mr-2 text-gray-500" />
                    {barbero.telefono || "No disponible"}
                  </div>
                </CardContent>

                <CardFooter>
                  <Badge variant="secondary" className="w-full text-center">
                    {barbero.estado === "activo" ? "Disponible" : "No disponible"}
                  </Badge>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default BarberosCards;