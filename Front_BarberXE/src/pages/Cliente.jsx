import React, { useState } from "react";
import { Routes, Route } from "react-router-dom"; 
import SidebarClient from "../components/Cliente/SidebarClient.jsx";       
import NavbarClient from "../components/Cliente/NavbarClient.jsx";         

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
        {/* Área principal: Se ajusta el padding/margen según el estado del sidebar */}
        <div className={`p-6 transition-all duration-300 ${isCollapsed ? "ml-16" : "ml-64"}`}>
          
        </div>
      </div>
    </div>
  );
};

export default ClientPage;
