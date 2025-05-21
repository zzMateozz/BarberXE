import React from "react";
import { Link } from "react-router-dom";
import iconoClient from "../../assets/barberia1.png";
import { HomeIcon, CalendarIcon, UserGroupIcon} from "@heroicons/react/24/outline";

const SidebarClient = ({ isCollapsed }) => {

  return (
    <div
      className={`bg-gray-800 fixed h-full px-4 py-2 transition-all duration-300 box-border border border-gray-800 shadow-lg ${isCollapsed ? "w-16" : "w-64"
        }`}
    >
      {/* Contenedor del icono y título */}
      <div className="mb-6 flex items-center space-x-3 transition-all duration-300">
        <img
          src={iconoClient}
          alt="BarberXE"
          className={`transition-all duration-300 ease-in-out ${isCollapsed ? "w-8 h-8" : "w-11 h-11 rotate-360"
            }`}
        />
        {!isCollapsed && <h1 className="text-2xl text-white font-bold">BarberXE</h1>}
      </div>

      <ul className="mt-3 text-white font-bold space-y-2">
        <li className="rounded-xl hover:shadow hover:bg-gray-700 py-3">
          <Link to="/cliente/servicios" className="flex items-center gap-2">
            <HomeIcon className="h-6 w-6 text-white" />
            {!isCollapsed && <span>Home</span>}
          </Link>
        </li>


        <li className="rounded-xl hover:shadow hover:bg-gray-700 py-3">
          <Link to="/cliente/barberos" className="flex items-center gap-2">
            <UserGroupIcon className="h-6 w-6 text-white" />
            {!isCollapsed && <span>Barberos</span>}
          </Link>
        </li>


        <li className="rounded-xl hover:shadow hover:bg-gray-700 py-3">
          <Link to="/cliente/citas" className="flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-white" />
            {!isCollapsed && <span>Citas</span>}
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default SidebarClient;
