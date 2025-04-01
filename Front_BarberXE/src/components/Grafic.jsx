import React from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Registramos los componentes necesarios de Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Home = () => {
  // Datos del gráfico de personas que usan la plataforma
  const usersData = {
    labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    datasets: [
      {
        label: 'Usuarios activos',
        data: [150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700], // Número de usuarios activos por mes
        borderColor: '#4CAF50', // Color de la línea
        backgroundColor: 'rgba(76, 175, 80, 0.1)', // Fondo de la línea
        borderWidth: 2,
        tension: 0.3, // Curvatura de la línea
      }
    ]
  };

  // Datos del gráfico de ventas
  const salesData = {
    labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    datasets: [
      {
        label: 'Ventas mensuales',
        data: [1200, 1500, 1800, 2000, 2300, 2600, 2800, 3000, 3200, 3400, 3600, 3800], // Ventas por mes
        borderColor: '#FF5733', // Color de la línea
        backgroundColor: 'rgba(255, 87, 51, 0.1)', // Fondo de la línea
        borderWidth: 2,
        tension: 0.3, // Curvatura de la línea
      }
    ]
  };

  return (
    <div className="container mx-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
      {/* Tarjeta de personas que usan la plataforma */}
      <div className="w-full p-4 bg-white rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300">
        <div className="text-xl font-semibold text-gray-800">Usuarios Activos</div>
        <p className="text-gray-600 mt-2">Número de usuarios activos en la plataforma por mes</p>

        {/* Gráfico de usuarios activos dentro de la tarjeta */}
        <div className="mt-6 h-96">
          <Line
            data={usersData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: {
                  ticks: {
                    autoSkip: true, // Automáticamente salta algunas etiquetas
                    maxRotation: 45, // Rota las etiquetas a 45 grados
                    minRotation: 45, // Rota las etiquetas a 45 grados
                  },
                },
              },
            }}
            height={400}
          />
        </div>
      </div>

      {/* Tarjeta de ventas */}
      <div className="w-full p-4 bg-white rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300">
        <div className="text-xl font-semibold text-gray-800">Ventas</div>
        <p className="text-gray-600 mt-2">Ventas mensuales durante el año</p>

        {/* Gráfico de ventas dentro de la tarjeta */}
        <div className="mt-6 h-96">
          <Line
            data={salesData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: {
                  ticks: {
                    autoSkip: true, // Automáticamente salta algunas etiquetas
                    maxRotation: 45, // Rota las etiquetas a 45 grados
                    minRotation: 45, // Rota las etiquetas a 45 grados
                  },
                },
              },
            }}
            height={400}
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
