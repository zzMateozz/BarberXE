import React, { useState } from "react";
import { Routes, Route } from "react-router-dom"; // Maneja las rutas
import Sidebar from "../components/Sidebar";       // Sidebar siempre visible
import Navbar from "../components/Navbar";         // Navbar siempre visible
import TableEmployees from "../components/CrudEmployees.jsx"; // Componente a mostrar
import TableClients from "../components/CrudClient.jsx";
import TableServices from "../components/CrudService.jsx";
import TableIngresos from "../components/CrudIncome.jsx";
import TableEgresos from "../components/CrudEgress.jsx";
import LineChart1 from "../components/Grafic.jsx";

const AdminPage = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="flex">
      <Sidebar isCollapsed={isCollapsed} />
      <div className="flex-1 ml-0 transition-all duration-300">
        <Navbar toggleSidebar={toggleSidebar} isCollapsed={isCollapsed} />

        {/* Área principal: Se ajusta el padding/margen según el estado del sidebar */}
        <div className={`p-6 transition-all duration-300 ${isCollapsed ? "ml-16" : "ml-64"}`}>
          <Routes>
            {/* Define la ruta para Empleados */}
            <Route path="/" element={<LineChart1 isCollapsed={isCollapsed} />} />
            <Route path="/Empleados" element={<TableEmployees isCollapsed={isCollapsed} />} />
            <Route path="/Clientes" element={<TableClients isCollapsed={isCollapsed} />} />
            <Route path="/Servicios" element={<TableServices isCollapsed={isCollapsed} />} />
            <Route path="/Caja/Ingreso" element={<TableIngresos isCollapsed={isCollapsed} />} />
            <Route path="/Caja/Egreso" element={<TableEgresos isCollapsed={isCollapsed} />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
