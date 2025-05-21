import React, { useState, useEffect } from "react";
import { fetchEmployees, searchEmployeesByName } from "../../services/EmployeeService.js";
import { toast } from "react-toastify";

const styles = {
  searchContainer: "mb-6 flex justify-center",
  searchInput: "border border-gray-300 rounded-md py-2 px-4 w-full max-w-md focus:ring-2 focus:ring-blue-500",
  cardsContainer: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
  card: "bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300",
  cardActive: "border-l-4 border-green-500",
  cardInactive: "border-l-4 border-gray-300 opacity-70",
  cardImage: "w-full h-48 object-cover",
  cardBody: "p-4",
  cardTitle: "text-xl font-semibold text-gray-800",
  cardSubtitle: "text-gray-600 mb-2",
  cardStatusActive: "inline-block px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800",
  cardStatusInactive: "inline-block px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800",
  cardPhone: "text-gray-700 mt-2 flex items-center",
  phoneIcon: "w-4 h-4 mr-2 text-gray-500"
};

const BarberosCards = ({ isCollapsed }) => {
  const [barberos, setBarberos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Cargar barberos al montar el componente
  useEffect(() => {
    const loadBarberos = async () => {
      try {
        const data = await fetchEmployees();
        // Filtrar solo barberos activos
        const filteredData = data.filter(emp => 
          (emp.cargo === "Barbero" || !emp.cargo) && emp.estado === "activo"
        );
        setBarberos(filteredData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    loadBarberos();
  }, []);

  // Buscar barberos por nombre
  useEffect(() => {
    if (searchTerm) {
      const searchBarberos = async () => {
        try {
          const results = await searchEmployeesByName(searchTerm);
          // Filtrar resultados para mostrar solo barberos activos
          const filteredResults = results.filter(emp => 
            (emp.cargo === "Barbero" || !emp.cargo) && emp.estado === "activo"
          );
          setBarberos(filteredResults);
        } catch (err) {
          setError(err.message);
        }
      };

      const timer = setTimeout(() => {
        searchBarberos();
      }, 500);

      return () => clearTimeout(timer);
    } else {
      const reloadBarberos = async () => {
        try {
          const data = await fetchEmployees();
          const filteredData = data.filter(emp => 
            (emp.cargo === "Barbero" || !emp.cargo) && emp.estado === "activo"
          );
          setBarberos(filteredData);
        } catch (err) {
          setError(err.message);
        }
      };
      reloadBarberos();
    }
  }, [searchTerm]);

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
    <section className="py-8 lg:py-12">
      <div className="container mx-auto px-4">
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Buscar barberos por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {barberos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No se encontraron barberos activos</p>
          </div>
        ) : (
          <div className={styles.cardsContainer}>
            {barberos.map((barbero) => (
              <div 
                key={barbero.idEmpleado} 
                className={`${styles.card} ${barbero.estado === "activo" ? styles.cardActive : styles.cardInactive}`}
              >
                {/* Imagen de perfil del barbero - puedes reemplazar con una imagen real si está disponible */}
                <div className={styles.cardImage}>
                  <svg 
                    className="w-full h-full text-gray-300 bg-gray-100" 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{barbero.nombre} {barbero.apellido}</h3>
                  <p className={styles.cardSubtitle}>Barbero profesional</p>
                  
                  <span className={barbero.estado === "activo" ? styles.cardStatusActive : styles.cardStatusInactive}>
                    {barbero.estado === "activo" ? "Disponible" : "No disponible"}
                  </span>
                  
                  <p className={styles.cardPhone}>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={styles.phoneIcon} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" 
                      />
                    </svg>
                    {barbero.telefono}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default BarberosCards;