import React, { useState } from "react";
import { Routes, Route } from "react-router-dom"; 
import SidebarCajero from "../components/Cajero/Navbar-Sidebar/SidebarCajero.jsx";       
import NavbarCajero from "../components/Cajero/Navbar-Sidebar/NavbarCajero.jsx";   
import ArqueoDeCaja from "../components/Cajero/Caja/CrudArqueo.jsx";     

const CajeroPage = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="flex">
      <SidebarCajero isCollapsed={isCollapsed} />
      <div className="flex-1 ml-0 transition-all duration-300">
        <NavbarCajero toggleSidebar={toggleSidebar} isCollapsed={isCollapsed} />
        <div className={`p-6 transition-all duration-300 ${isCollapsed ? "ml-16" : "ml-64"}`}>
        <Routes>
           {/* <Route path="Caja/Ingreso" element={<TableIngresos isCollapsed={isCollapsed} />} />
            <Route path="Caja/Egreso" element={<TableEgresos isCollapsed={isCollapsed} />} /> */}
            <Route path="Caja/Arqueo" element={<ArqueoDeCaja isCollapsed={isCollapsed} />} />
        </Routes>
        </div>
      </div>
    </div>
  );
};

export default CajeroPage;
