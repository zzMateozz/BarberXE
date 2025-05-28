"use client"

import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Menu, User, LogOut } from "lucide-react"
import { toast } from "react-toastify"
import { LoginService } from "../../../services/LoginService"
const Navbar = ({ toggleSidebar, isCollapsed }) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  // Cerrar el dropdown cuando se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleLogout = async () => {
    try {
      console.log("Iniciando proceso de logout...");

      // Usar el LoginService que ya tienes configurado
      await LoginService.logout();

      console.log("Logout exitoso - token enviado a blacklist");
      toast.success("Sesión cerrada correctamente");

      // Redirigir al login
      navigate('/login');

    } catch (error) {
      console.error("Error en logout:", error);

      // Limpiar localStorage incluso si hay error en el servidor
      localStorage.removeItem('authData');
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');

      toast.error("Error al cerrar sesión, pero se limpió la sesión local");
      navigate('/login');
    }
  };

  return (
    <header
      className={`bg-zinc-900 border-b border-zinc-800 px-4 h-14 flex justify-between items-center transition-all duration-300 ${isCollapsed ? "ml-16" : "ml-60"
        }`}
    >
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={18} />
        </button>
        <h1 className="ml-4 text-base font-medium text-white">Cliente</h1>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowUserDropdown(!showUserDropdown)}
          className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors flex items-center gap-2"
          aria-label="User menu"
        >
          <User size={18} />
        </button>

        {showUserDropdown && (
          <div className="absolute right-0 mt-2 w-48 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-5 duration-200">
            <div className="px-4 py-3 border-b border-zinc-700">
              <p className="text-xs text-zinc-400">Sesión iniciada como</p>
              <p className="text-sm font-medium text-white truncate">
                {
                  JSON.parse(localStorage.getItem('authData'))?.nombre || 'Cliente'
                }
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
            >
              <LogOut size={16} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

export default Navbar