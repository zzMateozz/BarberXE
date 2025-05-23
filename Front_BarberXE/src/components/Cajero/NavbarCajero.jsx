import React, { useState } from "react";
import { FaBars } from "react-icons/fa";
import { UserCircleIcon } from "@heroicons/react/24/outline";

const NavbarCajero = ({ toggleSidebar, isCollapsed }) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const toggleUserDropdown = () => {
    setShowUserDropdown(!showUserDropdown);
  };

  return (
    <div
      className={`bg-gray-800 px-4 py-3 flex justify-between items-center transition-all duration-300 ${
        isCollapsed ? "ml-16" : "ml-64"
      }`}
    >
      <div className="flex items-center text-xl">
        <FaBars className="text-white mr-4 cursor-pointer" onClick={toggleSidebar} />
        <span className="text-white font-semibold">Cajero</span>
      </div>
      
      {/* Menú de usuario */}
      <div className="relative">
        <button 
          className="text-white focus:outline-none" 
          onClick={toggleUserDropdown}
        >
          <UserCircleIcon className="h-6 w-6 text-white" />
        </button>
        {showUserDropdown && (
          <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg py-2 z-50">
            <a 
              href="#"
              className="block px-4 py-2 text-gray-800 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              Cerrar sesión
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default NavbarCajero;
