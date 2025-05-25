"use client"
import React, { useEffect, useState } from "react";
import { Bar, Line, Pie } from "react-chartjs-2";
import { 
  Chart as ChartJS,
  Filler,
  CategoryScale, 
  LinearScale, 
  BarElement, 
  PointElement, 
  LineElement, 
  ArcElement,
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { ArrowDown, ArrowUp } from "lucide-react"; 
import {
  fetchAllIngresos,
  fetchAllegresos
} from "@/services/ArqueoService";
import { fetchClients } from "@/services/ClientService";
// Asegúrate de que tu ServiceService contenga estas dos funciones:
// fetchServices() para servicios generales y fetchAllCuts() para los cortes.
import { fetchEmployees } from "@/services/EmployeeService";
import { fetchServices, fetchAllCuts } from "@/services/ServiceService";


// Registrar componentes de Chart.js
ChartJS.register(
  Filler,
  CategoryScale, 
  LinearScale, 
  BarElement,
  PointElement, 
  LineElement, 
  ArcElement,
  Title, 
  Tooltip, 
  Legend
);

// Helper para asegurar que los datos sean arrays
const ensureArray = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.data && Array.isArray(data.data)) return data.data;
    if (data.items && Array.isArray(data.items)) return data.items;
    return [];
};

// Paleta de colores actualizada: Rojo más claro y Zinc-700
const ZINC_700_RGBA = 'rgba(63, 63, 70, 0.8)'; // #3f3f46 con 0.8 de opacidad
const ZINC_700_BORDER = '#3f3f46';

const LIGHT_RED_RGBA = 'rgba(255, 1, 56, 0.8)'; // Un rojo más claro (similar a Chart.js default)
const LIGHT_RED_BORDER = 'rgb(255, 99, 132)';

const PASTEL_CHART_COLORS = [
    LIGHT_RED_RGBA,             // Rojo más claro (para servicios, ingresos, activos empleados)
    ZINC_700_RGBA,              // Zinc-700 (para cortes, egresos, inactivos empleados)
    'rgba(255, 159, 64, 0.8)',  // Naranja
    'rgba(75, 192, 192, 0.8)',  // Turquesa
    'rgba(153, 102, 255, 0.8)', // Púrpura
    'rgba(201, 203, 207, 0.8)', // Gris claro
];

const PASTEL_CHART_BORDERS = [
    LIGHT_RED_BORDER,
    ZINC_700_BORDER,
    'rgb(255, 159, 64)',
    'rgb(75, 192, 192)',
    'rgb(153, 102, 255)',
    'rgb(201, 203, 207)',
];


const Home = () => { 
  const [stats, setStats] = useState({
    ingresos: { current: 0, change: 0, previous: 0 },
    egresos: { current: 0, change: 0, previous: 0 },
    empleados: { total: 0, activos: 0, inactivos: 0 },
    clientes: { total: 0 }, 
    totalServices: 0,      
    totalCuts: 0,          
  });

  const [ingresosData, setIngresosData] = useState(null);
  const [egresosData, setEgresosData] = useState(null);
  const [empleadosData, setEmpleadosData] = useState(null);
  const [servicesAndCutsTotalChartData, setServicesAndCutsTotalChartData] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Opciones comunes para gráficos
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#374151',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: '#1F2937',
        titleColor: '#F3F4F6',
        bodyColor: '#F3F4F6',
        borderColor: '#4B5563',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 4
      }
    },
    scales: {
      x: {
        grid: {
          color: '#E5E7EB',
          borderColor: '#E5E7EB'
        },
        ticks: {
          color: '#374151'
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#E5E7EB',
          borderColor: '#E5E7EB'
        },
        ticks: {
          color: '#374151'
        }
      }
    }
  };

  // Opciones específicas para la gráfica de barras de Totales (Servicios y Cortes)
  const totalBarChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: true, 
            position: 'top',
            labels: {
                color: '#374151',
                font: { size: 12 }
            }
        },
        tooltip: chartOptions.plugins.tooltip,
    },
    scales: {
        x: {
            grid: {
                display: false, 
                borderColor: '#E5E7EB'
            },
            ticks: {
                color: '#374151'
            }
        },
        y: {
            beginAtZero: true,
            grid: {
                color: '#E5E7EB',
                borderColor: '#E5E7EB'
            },
            ticks: {
                color: '#374151',
                stepSize: 1 
            }
        }
    }
  };


  // Formatear dinero
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Función para calcular el cambio porcentual de forma segura
  const calculateChangePercentage = (current, previous) => {
    if (previous === 0) {
      return current > 0 ? 100 : 0; 
    }
    const change = ((current - previous) / previous) * 100;
    return parseFloat(change.toFixed(1));
  };


  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Obtener todos los datos en paralelo
        const [
          ingresosResRaw, 
          egresosResRaw, 
          clientesResRaw, 
          empleadosResRaw, 
          serviciosResRaw, 
          cortesResRaw,    
        ] = await Promise.all([
          fetchAllIngresos(),
          fetchAllegresos(),
          fetchClients(),
          fetchEmployees(),
          fetchServices(), 
          fetchAllCuts(),  
        ]);

        // Asegurarse de que las respuestas sean arrays
        const ingresosRes = ensureArray(ingresosResRaw);
        const egresosRes = ensureArray(egresosResRaw);
        const clientesRes = ensureArray(clientesResRaw);
        const empleadosRes = ensureArray(empleadosResRaw);
        const serviciosRes = ensureArray(serviciosResRaw); 
        const cortesRes = ensureArray(cortesResRaw);       

        // --- Procesamiento de Estadísticas ---
        const now = new Date(); 
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Ingresos (para tarjetas de estadísticas)
        const ingresosMesActual = ingresosRes
          .filter(i => new Date(i.fecha).getMonth() === currentMonth && new Date(i.fecha).getFullYear() === currentYear)
          .reduce((sum, i) => sum + (Number(i.monto) || 0), 0);
        
        const ingresosMesAnterior = ingresosRes
          .filter(i => {
            const fecha = new Date(i.fecha);
            return fecha.getMonth() === (currentMonth === 0 ? 11 : currentMonth - 1) && 
                   fecha.getFullYear() === (currentMonth === 0 ? currentYear - 1 : currentYear);
          })
          .reduce((sum, i) => sum + (Number(i.monto) || 0), 0);
        
        const cambioIngresos = calculateChangePercentage(ingresosMesActual, ingresosMesAnterior);

        // Egresos (para tarjetas de estadísticas)
        const egresosMesActual = egresosRes
          .filter(e => new Date(e.fecha).getMonth() === currentMonth && new Date(e.fecha).getFullYear() === currentYear)
          .reduce((sum, e) => sum + (Number(e.monto) || 0), 0);
        
        const egresosMesAnterior = egresosRes
          .filter(e => {
            const fecha = new Date(e.fecha);
            return fecha.getMonth() === (currentMonth === 0 ? 11 : currentMonth - 1) && 
                   fecha.getFullYear() === (currentMonth === 0 ? currentYear - 1 : currentYear);
          })
          .reduce((sum, e) => sum + (Number(e.monto) || 0), 0);
        
        const cambioEgresos = calculateChangePercentage(egresosMesActual, egresosMesAnterior);
        
        // Actualizar estado de las estadísticas
        setStats({
          ingresos: {
            current: ingresosMesActual,
            change: cambioIngresos,
            previous: ingresosMesAnterior
          },
          egresos: {
            current: egresosMesActual,
            change: cambioEgresos,
            previous: egresosMesAnterior
          },
          empleados: {
            total: empleadosRes.length,
            activos: empleadosRes.filter(e => (e.estado || '').toLowerCase() === 'activo').length,
            inactivos: empleadosRes.filter(e => (e.estado || '').toLowerCase() !== 'activo').length
          },
          clientes: {
            total: clientesRes.length, 
          },
          totalServices: serviciosRes.length, 
          totalCuts: cortesRes.length,       
        });

        // --- Preparar datos para gráficos ---

        // Gráfico de Ingresos Semanales
        const dailyIngresos = {
            0: 0, // Domingo
            1: 0, // Lunes
            2: 0, // Martes
            3: 0, // Miércoles
            4: 0, // Jueves
            5: 0, // Viernes
            6: 0, // Sábado
        };
        const dayLabelsOrdered = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

        const dayOfWeekToday = now.getDay(); 
        const diffToMonday = dayOfWeekToday === 0 ? 6 : dayOfWeekToday - 1; 
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - diffToMonday);
        startOfWeek.setHours(0, 0, 0, 0); 

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); 
        endOfWeek.setHours(23, 59, 59, 999); 

        ingresosRes.forEach(ing => {
            try {
                const fechaIngreso = new Date(ing.fecha);
                if (fechaIngreso >= startOfWeek && fechaIngreso <= endOfWeek && fechaIngreso.getFullYear() === now.getFullYear() && !isNaN(fechaIngreso.getTime())) {
                    const dayOfWeek = fechaIngreso.getDay(); 
                    dailyIngresos[dayOfWeek] += Number(ing.monto) || 0;
                }
            } catch (e) {
                console.error('Error procesando fecha o monto de ingreso para gráfico:', ing, e);
            }
        });

        setIngresosData({
            labels: dayLabelsOrdered,
            datasets: [{
                label: 'Ingresos diarios',
                data: dayLabelsOrdered.map((_, index) => {
                    const dayIndex = (index + 1) % 7; 
                    return dailyIngresos[dayIndex];
                }),
                // Se elimina el 'backgroundColor' y se establece 'fill: false'
                borderColor: PASTEL_CHART_BORDERS[0],
                borderWidth: 2, // Un poco más gruesa para que se vea bien sin relleno
                tension: 0.1,
                fill: false, // ¡Cambio aquí para quitar el fondo!
                pointRadius: 3, // Puntos visibles en la línea
                pointBackgroundColor: PASTEL_CHART_BORDERS[0], // Color de los puntos
                pointBorderColor: '#fff',
                pointHoverRadius: 5,
            }]
        });


        // Egresos por Categoría (dinámico)
        const egresosPorCategoria = {};
        egresosRes.forEach(eg => {
            const categoria = eg.categoria || 'Sin categoría'; 
            egresosPorCategoria[categoria] = (egresosPorCategoria[categoria] || 0) + (Number(eg.monto) || 0);
        });
        const egresosLabels = Object.keys(egresosPorCategoria);
        const egresosValues = Object.values(egresosPorCategoria);

        setEgresosData({
          labels: egresosLabels,
          datasets: [{
            label: 'Distribución de egresos',
            data: egresosValues,
            backgroundColor: egresosLabels.map((_, i) => PASTEL_CHART_COLORS[i % PASTEL_CHART_COLORS.length]),
            borderColor: egresosLabels.map((_, i) => PASTEL_CHART_BORDERS[i % PASTEL_CHART_BORDERS.length]),
            borderWidth: 1
          }]
        });

        setEmpleadosData({
          labels: ['Activos', 'Inactivos'],
          datasets: [{
            label: 'Estado empleados',
            data: [
              empleadosRes.filter(e => (e.estado || '').toLowerCase() === 'activo').length,
              empleadosRes.filter(e => (e.estado || '').toLowerCase() !== 'activo').length
            ],
            backgroundColor: [
              PASTEL_CHART_COLORS[0], 
              PASTEL_CHART_COLORS[1]  
            ],
            borderWidth: 1
          }]
        });

        // Datos para la nueva gráfica de "Total de Servicios y Cortes"
        setServicesAndCutsTotalChartData({
            labels: ['Total Servicios', 'Total Cortes'],
            datasets: [{
                label: 'Cantidad',
                data: [serviciosRes.length, cortesRes.length],
                backgroundColor: [
                    PASTEL_CHART_COLORS[0], 
                    PASTEL_CHART_COLORS[1], 
                ],
                borderColor: [
                    PASTEL_CHART_BORDERS[0],
                    PASTEL_CHART_BORDERS[1],
                ],
                borderWidth: 1,
            }]
        });


      } catch (err) {
        console.error("Error fetching data:", err); 
        setError(err.message || "Error al cargar datos");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      <p className="ml-4 text-gray-600">Cargando datos del dashboard...</p>
    </div>
  );

  if (error) return (
    <div className="p-4 bg-red-100 text-red-700 rounded-md max-w-md mx-auto mt-8">
      Error: {error}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      {/* Primera fila - Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"> 
        {/* Ingresos */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Ingresos (este mes)</h3>
          <div className="flex items-end">
            <span className="text-2xl font-bold text-gray-900">{formatMoney(stats.ingresos.current)}</span>
            <span className={`flex items-center ml-2 text-sm ${stats.ingresos.change < 0 ? 'text-red-500' : 'text-green-500'}`}>
              {stats.ingresos.change < 0 ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
              {Math.abs(stats.ingresos.change)}%
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-2">Mes anterior: {formatMoney(stats.ingresos.previous)}</p>
        </div>

        {/* Egresos */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Egresos (este mes)</h3>
          <div className="flex items-end">
            <span className="text-2xl font-bold text-gray-900">{formatMoney(stats.egresos.current)}</span>
            <span className={`flex items-center ml-2 text-sm ${stats.egresos.change < 0 ? 'text-red-500' : 'text-green-500'}`}>
              {stats.egresos.change < 0 ? <ArrowDown size={16} /> : <ArrowUp size={16} />}
              {Math.abs(stats.egresos.change)}%
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-2">Mes anterior: {formatMoney(stats.egresos.previous)}</p>
        </div>

        {/* Total de Clientes */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total de Clientes</h3>
          <div className="flex items-end">
            <span className="text-2xl font-bold text-gray-900">{stats.clientes.total}</span>
          </div>
          <p className="text-gray-500 text-sm mt-2">Clientes registrados en total</p>
        </div>
      </div>

      {/* Segunda fila - Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Gráfico de ingresos */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium mb-4">Ingresos semanales</h3>
          <div className="h-64">
            {ingresosData && <Line data={ingresosData} options={chartOptions} />}
          </div>
        </div>

        {/* Gráfico de distribución de egresos */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium mb-4">Distribución de egresos</h3>
          <div className="h-64">
            {egresosData && <Pie data={egresosData} options={chartOptions} />}
          </div>
        </div>
      </div>

      {/* Tercera fila - Gráfico de Totales de Servicios y Cortes, y Empleados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8"> 
        {/* Gráfico de Total de Servicios y Cortes (Nuevo) */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium mb-4">Total de Servicios y Cortes</h3>
          <div className="h-48">
            {servicesAndCutsTotalChartData && <Bar data={servicesAndCutsTotalChartData} options={totalBarChartOptions} />}
          </div>
          <p className="text-gray-500 text-sm mt-2">Servicios: {stats.totalServices} | Cortes: {stats.totalCuts}</p>
        </div>

        {/* Gráfico de empleados */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 text-sm font-medium mb-4">Estado de empleados</h3>
          <div className="h-48">
            {empleadosData && <Pie data={empleadosData} options={chartOptions} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;