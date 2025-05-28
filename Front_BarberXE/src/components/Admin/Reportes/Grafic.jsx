"use client"
import React, { useEffect, useState } from "react";
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";
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
import { ArrowDown, ArrowUp, TrendingUp, Users, DollarSign, Scissors, Calendar, Activity } from "lucide-react"; 
import {
  fetchAllIngresos,
  fetchAllegresos
} from "@/services/ArqueoService";
import { fetchClients } from "@/services/ClientService";
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

// Paleta de colores rojo, negro y gris
const GRADIENT_COLORS = {
  primary: {
    bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', // Rojo
    light: 'rgba(239, 68, 68, 0.1)',
    main: '#ef4444'
  },
  success: {
    bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', // Rojo
    light: 'rgba(239, 68, 68, 0.1)',
    main: '#ef4444'
  },
  warning: {
    bg: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)', // Negro
    light: 'rgba(31, 41, 55, 0.1)',
    main: '#1f2937'
  },
  info: {
    bg: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)', // Gris
    light: 'rgba(107, 114, 128, 0.1)',
    main: '#6b7280'
  }
};

const CHART_COLORS = [
    'rgba(239, 68, 68, 0.8)',   // Rojo
    'rgba(31, 41, 55, 0.8)',    // Negro
    'rgba(107, 114, 128, 0.8)', // Gris
    'rgba(156, 163, 175, 0.8)', // Gris claro
    'rgba(239, 68, 68, 0.6)',   // Rojo más claro
    'rgba(31, 41, 55, 0.6)',    // Negro más claro
];

const CHART_BORDERS = [
    '#ef4444', '#1f2937', '#6b7280', '#9ca3af',
    '#f87171', '#374151'
];

const Home = () => { 
  const [stats, setStats] = useState({
    ingresos: { total: 0 },
    egresos: { total: 0 },
    empleados: { total: 0, activos: 0, inactivos: 0 },
    clientes: { total: 0 }, 
    totalServices: 0,      
    totalCuts: 0,          
  });

  const [ingresosData, setIngresosData] = useState(null);
  const [egresosData, setEgresosData] = useState(null);
  const [empleadosData, setEmpleadosData] = useState(null);
  const [ingresosEgresosChartData, setIngresosEgresosChartData] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Opciones mejoradas para gráficos
  const modernChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#4B5563',
          font: {
            size: 12,
            weight: '500'
          },
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#F9FAFB',
        bodyColor: '#F9FAFB',
        borderColor: '#374151',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            if (context.parsed.y !== null) {
              return context.dataset.label + ': ' + new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                minimumFractionDigits: 0
              }).format(context.parsed.y);
            }
            return '';
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          borderColor: '#E5E7EB'
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(229, 231, 235, 0.5)',
          borderColor: '#E5E7EB'
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11
          }
        }
      }
    }
  };

  // Opciones para gráficos de dona
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#4B5563',
          font: {
            size: 11,
            weight: '500'
          },
          usePointStyle: true,
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#F9FAFB',
        bodyColor: '#F9FAFB',
        borderColor: '#374151',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8
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

  // Componente de tarjeta mejorada
  const StatsCard = ({ title, value, change, previousValue, icon: Icon, gradient, subtitle }) => (
    <div className="relative bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Gradiente de fondo */}
      <div 
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: gradient }}
      />
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div 
              className="p-3 rounded-xl"
              style={{ background: gradient.replace('100%', '20%') }}
            >
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
              <p className="text-gray-400 text-xs">{subtitle}</p>
            </div>
          </div>
          
          {change !== undefined && (
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
              change >= 0 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {change >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="text-2xl font-bold text-gray-900">
            {typeof value === 'number' && title.toLowerCase().includes('ingreso') || title.toLowerCase().includes('egreso') 
              ? formatMoney(value) 
              : value.toLocaleString()}
          </div>
          
          {previousValue !== undefined && (
            <p className="text-gray-500 text-sm">
              Anterior: {typeof previousValue === 'number' && (title.toLowerCase().includes('ingreso') || title.toLowerCase().includes('egreso'))
                ? formatMoney(previousValue)
                : previousValue.toLocaleString()}
            </p>
          )}
        </div>
      </div>
      
      {/* Decoración inferior */}
      <div className="absolute bottom-0 right-0 w-20 h-20 opacity-5">
        <Icon className="w-full h-full" />
      </div>
    </div>
  );

  // Cargar datos (misma lógica que antes)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
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

        const ingresosRes = ensureArray(ingresosResRaw);
        const egresosRes = ensureArray(egresosResRaw);
        const clientesRes = ensureArray(clientesResRaw);
        const empleadosRes = ensureArray(empleadosResRaw);
        const serviciosRes = ensureArray(serviciosResRaw); 
        const cortesRes = ensureArray(cortesResRaw);       

        const now = new Date(); 

        // Calcular ingresos totales
        const ingresosTotal = ingresosRes.reduce((sum, i) => sum + (Number(i.monto) || 0), 0);
        
        // Calcular egresos totales
        const egresosTotal = egresosRes.reduce((sum, e) => sum + (Number(e.monto) || 0), 0);
        
        setStats({
          ingresos: {
            total: ingresosTotal
          },
          egresos: {
            total: egresosTotal
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

        // Gráfico de Ingresos Semanales (con gradiente)
        const dailyIngresos = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
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

        // Crear gradiente para el gráfico de línea
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.3)');
        gradient.addColorStop(1, 'rgba(239, 68, 68, 0.05)');

        setIngresosData({
            labels: dayLabelsOrdered,
            datasets: [{
                label: 'Ingresos diarios',
                data: dayLabelsOrdered.map((_, index) => {
                    const dayIndex = (index + 1) % 7; 
                    return dailyIngresos[dayIndex];
                }),
                backgroundColor: gradient,
                borderColor: GRADIENT_COLORS.primary.main,
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointRadius: 6,
                pointBackgroundColor: GRADIENT_COLORS.primary.main,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 8,
            }]
        });

        // Egresos por Categoría
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
            backgroundColor: egresosLabels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
            borderColor: egresosLabels.map((_, i) => CHART_BORDERS[i % CHART_BORDERS.length]),
            borderWidth: 2,
            hoverOffset: 8
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
            backgroundColor: [CHART_COLORS[0], CHART_COLORS[1]],
            borderColor: [CHART_BORDERS[0], CHART_BORDERS[1]],
            borderWidth: 2,
            hoverOffset: 8
          }]
        });

        // Gráfico de Ingresos vs Egresos Totales
        setIngresosEgresosChartData({
            labels: ['Ingresos Totales', 'Egresos Totales'],
            datasets: [{
                label: 'Monto total',
                data: [ingresosTotal, egresosTotal],
                backgroundColor: [CHART_COLORS[0], CHART_COLORS[1]],
                borderColor: [CHART_BORDERS[0], CHART_BORDERS[1]],
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
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
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Cargando dashboard...</p>
        <p className="text-gray-400 text-sm">Obteniendo datos del sistema</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-200 max-w-md w-full text-center">
        <div className="bg-red-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Activity className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar datos</h3>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Tarjetas de estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Ingresos Totales"
          subtitle="Total de todos los ingresos"
          value={stats.ingresos.total}
          icon={DollarSign}
          gradient={GRADIENT_COLORS.success.bg}
        />
        
        <StatsCard
          title="Egresos Totales"
          subtitle="Total de todos los egresos"
          value={stats.egresos.total}
          icon={TrendingUp}
          gradient={GRADIENT_COLORS.warning.bg}
        />
        
        <StatsCard
          title="Total Clientes"
          subtitle="Clientes registrados"
          value={stats.clientes.total}
          icon={Users}
          gradient={GRADIENT_COLORS.info.bg}
        />
        
        <StatsCard
          title="Servicios Totales"
          subtitle={`${stats.totalServices} servicios, ${stats.totalCuts} cortes`}
          value={stats.totalServices + stats.totalCuts}
          icon={Scissors}
          gradient={GRADIENT_COLORS.primary.bg}
        />
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Gráfico de ingresos */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Ingresos Semanales</h3>
              <p className="text-gray-500 text-sm">Tendencia de ingresos por día</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="h-80">
            {ingresosData && <Line data={ingresosData} options={modernChartOptions} />}
          </div>
        </div>

        {/* Gráfico de distribución de egresos */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Distribución de Egresos</h3>
              <p className="text-gray-500 text-sm">Por categorías de gastos</p>
            </div>
            <div className="p-2 bg-pink-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-pink-600" />
            </div>
          </div>
          <div className="h-80">
            {egresosData && <Doughnut data={egresosData} options={doughnutOptions} />}
          </div>
        </div>
      </div>

      {/* Fila inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de ingresos vs egresos totales */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Ingresos vs Egresos</h3>
              <p className="text-gray-500 text-sm">Comparación de totales</p>
            </div>
            <div className="p-2 bg-red-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <div className="h-64">
            {ingresosEgresosChartData && <Bar data={ingresosEgresosChartData} options={modernChartOptions} />}
          </div>
          <div className="flex justify-center space-x-6 mt-4 text-sm text-gray-600">
            <span>Ingresos: <strong className="text-red-600">{formatMoney(stats.ingresos.total)}</strong></span>
            <span>Egresos: <strong className="text-gray-800">{formatMoney(stats.egresos.total)}</strong></span>
          </div>
        </div>

        {/* Gráfico de empleados */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Estado de Empleados</h3>
              <p className="text-gray-500 text-sm">Distribución por estado</p>
            </div>
            <div className="p-2 bg-gray-50 rounded-lg">
              <Users className="w-5 h-5 text-gray-600" />
            </div>
          </div>
          <div className="h-64">
            {empleadosData && <Doughnut data={empleadosData} options={doughnutOptions} />}
          </div>
          <div className="flex justify-center space-x-6 mt-4 text-sm text-gray-600">
            <span>Activos: <strong className="text-red-600">{stats.empleados.activos}</strong></span>
            <span>Inactivos: <strong className="text-gray-800">{stats.empleados.inactivos}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;