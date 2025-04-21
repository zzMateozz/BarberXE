import React, { useState } from "react";
import { Routes, Route } from "react-router-dom"; 
import Sidebar from "../components/Admin/Sidebar.jsx";       
import Navbar from "../components/Admin/Navbar.jsx";       
import TableEmployees from "../components/Admin/CrudEmployees.jsx";
import TableClients from "../components/Admin/CrudClient.jsx";
import TableServices from "../components/Admin/CrudService.jsx";
import TableIngresos from "../components/Admin/CrudIncome.jsx";
import TableEgresos from "../components/Admin/CrudEgress.jsx";
import LineChart1 from "../components/Admin/Grafic.jsx";
import TableCortes from "../components/Admin/CrudCortes.jsx";
import TableCitas from "../components/Admin/CrudQuotes.jsx";
import ArqueoDeCaja from "../components/Admin/CrudArqueo.jsx";

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
        <div className={`p-6 transition-all duration-300 ${isCollapsed ? "ml-16" : "ml-64"}`}>
          <Routes>
            <Route path="/" element={<LineChart1 isCollapsed={isCollapsed} />} />
            <Route path="/Empleados" element={<TableEmployees isCollapsed={isCollapsed} />} />
            <Route path="/Clientes" element={<TableClients isCollapsed={isCollapsed} />} />
            <Route path="/Servicios" element={<TableServices isCollapsed={isCollapsed} />} />
            <Route path="/Cortes" element={<TableCortes isCollapsed={isCollapsed} />} />
            <Route path="/Citas" element={<TableCitas isCollapsed={isCollapsed} />} />
            <Route path="/Caja/Ingreso" element={<TableIngresos isCollapsed={isCollapsed} />} />
            <Route path="/Caja/Egreso" element={<TableEgresos isCollapsed={isCollapsed} />} />
            <Route path="/Caja/Arqueo" element={<ArqueoDeCaja isCollapsed={isCollapsed} />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
