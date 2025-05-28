import React from "react";
import { Link, useLocation } from "react-router-dom";
import iconoClient from "../../../assets/barberia1.png";
import { HomeIcon, CalendarIcon, UserGroupIcon } from "@heroicons/react/24/outline";

const SidebarClient = ({ isCollapsed }) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <aside
      className={`bg-zinc-900 fixed h-full transition-all duration-300 ease-in-out border-r border-zinc-800 ${
        isCollapsed ? "w-16" : "w-60"
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className={`flex items-center ${isCollapsed ? "justify-center py-4" : "px-3 py-4"}`}>
          <img
            src={iconoClient}
            alt="BarberXE"
            className={`transition-all duration-300 ${isCollapsed ? "w-8 h-8" : "w-10 h-10"}`}
          />
          {!isCollapsed && <h1 className="ml-2 text-[15px] font-semibold text-white">BarberXE</h1>}
        </div>

        {/* Navigation */}
        <nav className="mt-2 px-2 flex-1">
          <ul className="space-y-1">
            <li>
              <Link
                to="/cliente/servicios"
                className={`flex items-center gap-2 px-3 py-2.5 rounded-md transition-colors ${
                  isActive("/cliente/servicios")
                    ? "bg-zinc-800/70 text-white border-l-2 border-red-500"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/40"
                }`}
              >
                <HomeIcon className="h-[18px] w-[18px] min-w-[18px]" />
                {!isCollapsed && <span className="text-[13px] font-medium">Home</span>}
              </Link>
            </li>

            <li>
              <Link
                to="/cliente/barberos"
                className={`flex items-center gap-2 px-3 py-2.5 rounded-md transition-colors ${
                  isActive("/cliente/barberos")
                    ? "bg-zinc-800/70 text-white border-l-2 border-red-500"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/40"
                }`}
              >
                <UserGroupIcon className="h-[18px] w-[18px] min-w-[18px]" />
                {!isCollapsed && <span className="text-[13px] font-medium">Barberos</span>}
              </Link>
            </li>

            <li>
              <Link
                to="/cliente/citas"
                className={`flex items-center gap-2 px-3 py-2.5 rounded-md transition-colors ${
                  isActive("/cliente/citas")
                    ? "bg-zinc-800/70 text-white border-l-2 border-red-500"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/40"
                }`}
              >
                <CalendarIcon className="h-[18px] w-[18px] min-w-[18px]" />
                {!isCollapsed && <span className="text-[13px] font-medium">Citas</span>}
              </Link>
            </li>
          </ul>
        </nav>
           {/* Footer */}
        <div className="p-2 mt-auto">
          {!isCollapsed && <div className="text-[11px] text-zinc-500 text-center">BarberXE v1.0</div>}
        </div>
      </div>
    </aside>
  );
};

export default SidebarClient;