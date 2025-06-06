import React, { useState } from "react";
import { Routes, Route } from "react-router-dom"; 
import SidebarClient from "../components/Cliente/Navbar-Sidebar/SidebarClient.jsx";       
import NavbarClient from "../components/Cliente/Navbar-Sidebar/NavbarClient.jsx";
import BarberosCards from "../components/Cliente/Empleados/CardEmployees.jsx";     
import TableCitas from "../components/Cliente/Servicios-Citas/TableCitas.jsx";
import CardServices from "../components/Cliente/Servicios-Citas/TableServices.jsx";

const ClientPage = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="flex">
      <SidebarClient isCollapsed={isCollapsed} />
      <div className="flex-1 ml-0 transition-all duration-300">
        <NavbarClient toggleSidebar={toggleSidebar} isCollapsed={isCollapsed} />
        <div className={`p-6 transition-all duration-300 ${isCollapsed ? "ml-16" : "ml-64"}`}>
          <Routes>
            <Route path="Barberos" element={<BarberosCards isCollapsed={isCollapsed} />} />
            <Route path="Servicios" element={<CardServices isCollapsed={isCollapsed} />} />
            <Route path="Citas" element={<TableCitas isCollapsed={isCollapsed} />} />
        </Routes>
          
        </div>
      </div>
    </div>
  );
};

export default ClientPage;
