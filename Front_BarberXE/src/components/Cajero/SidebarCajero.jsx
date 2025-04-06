import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import iconoCajero from "../../assets/barberia1.png";
import { 
  HomeIcon, 
  CalculatorIcon, DocumentCurrencyDollarIcon 
} from "@heroicons/react/24/outline";

const SidebarCajero = ({ isCollapsed }) => {
  const [showCajaOptions, setShowCajaOptions] = useState(false);

  return (
    <div
      className={`bg-gray-800 fixed h-full px-4 py-2 transition-all duration-300 box-border border border-gray-800 shadow-lg ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Contenedor del icono y título */}
      <div className="mb-6 flex items-center space-x-3 transition-all duration-300">
        <img
          src={iconoCajero}
          alt="BarberXE"
          className={`transition-all duration-300 ease-in-out ${
            isCollapsed ? "w-8 h-8" : "w-11 h-11 rotate-360"
          }`}
        />
        {!isCollapsed && <h1 className="text-2xl text-white font-bold">BarberXE</h1>}
      </div>

      <ul className="mt-3 text-white font-bold space-y-2">
        <li className="rounded-xl hover:shadow hover:bg-gray-700 py-3">
          <Link to="/" className="flex items-center gap-2">
            <HomeIcon className="h-6 w-6 text-white" />
            {!isCollapsed && <span>Home</span>}
          </Link>
        </li>
        {/* Ítem: Caja con submenú */}
        <li className={`rounded-xl hover:shadow py-3 ${!isCollapsed && !showCajaOptions ? "hover:bg-gray-700" : ""}`}>
          <button
            onClick={() => setShowCajaOptions(!showCajaOptions)}
            className="flex items-center gap-2 w-full text-left"
          >
            <CalculatorIcon className="h-6 w-6 text-white" />
            {!isCollapsed && <span>Caja</span>}
            {!isCollapsed && (
              <span className={`ml-auto transform transition-transform duration-300 ${showCajaOptions ? "rotate-180" : "rotate-0"}`}>
                <ChevronDown size={20} />
              </span>
            )}
          </button>
          {!isCollapsed && (
            <ul className={`ml-6 mt-4 space-y-2 overflow-hidden transition-all duration-300 ease-in-out ${showCajaOptions ? "opacity-100 max-h-[500px]" : "opacity-0 max-h-0"}`}>
              <li className="rounded-xl hover:bg-gray-700 py-2 px-2">
                <Link to="/Caja/Ingreso" className="flex items-center space-x-2">
                  <DocumentCurrencyDollarIcon className="h-6 w-6 text-white" />
                  <span>Ingreso</span>
                </Link>
              </li>
              <li className="rounded-xl hover:bg-gray-700 py-2 px-2">
                <Link to="/Caja/Egreso" className="flex items-center space-x-2">
                  <DocumentCurrencyDollarIcon className="h-6 w-6 text-white" />
                  <span>Egreso</span>
                </Link>
              </li>
              <li className="rounded-xl hover:bg-gray-700 py-2 px-2">
                <Link to="/Caja/Arqueo" className="flex items-center space-x-2">
                  <DocumentCurrencyDollarIcon className="h-6 w-6 text-white" />
                  <span>Arqueo de Caja</span>
                </Link>
              </li>
            </ul>
          )}
        </li>
      </ul>
    </div>
  );
};

export default SidebarCajero;