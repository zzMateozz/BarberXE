import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Home, Calculator, ChevronDown, ChevronRight } from "lucide-react"
import iconoAdmin from "../../../assets/barberia1.png"

const SidebarCajero = ({ isCollapsed }) => {
  const [showCajaOptions, setShowCajaOptions] = useState(false)
  const location = useLocation()

  const isActive = (path) => {
    return location.pathname.includes(path)
  }

  const NavItem = ({ to, icon, label, active, onClick, children }) => {
    const Icon = icon

    return (
      <li>
        {to ? (
          <Link
            to={to}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-md transition-colors ${
              active
                ? "bg-zinc-800/70 text-white border-l-2 border-red-500"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/40"
            }`}
          >
            <Icon size={18} className="min-w-[18px]" />
            {!isCollapsed && <span className="text-[13px] font-medium">{label}</span>}
          </Link>
        ) : (
          <button
            onClick={onClick}
            className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-md transition-colors ${
              active
                ? "bg-zinc-800/70 text-white border-l-2 border-red-500"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/40"
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon size={18} className="min-w-[18px]" />
              {!isCollapsed && <span className="text-[13px] font-medium">{label}</span>}
            </div>
            {!isCollapsed && (
              <ChevronDown size={16} className={`transition-transform ${showCajaOptions ? "rotate-180" : ""}`} />
            )}
          </button>
        )}
        {children}
      </li>
    )
  }

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
            src={iconoAdmin || "/placeholder.svg"}
            alt="BarberXE"
            className={`transition-all duration-300 ${isCollapsed ? "w-8 h-8" : "w-10 h-10"}`}
          />
          {!isCollapsed && <h1 className="ml-2 text-[15px] font-semibold text-white">BarberXE</h1>}
        </div>

        {/* Menú */}
        <nav className="mt-2 px-2 flex-1">
          <ul className="space-y-1">
            <NavItem to="/cajero" icon={Home} label="Home" active={location.pathname === "/cajero"} />
            
            <NavItem
              icon={Calculator}
              label="Caja"
              active={isActive("/cajero/caja")}
              onClick={() => !isCollapsed && setShowCajaOptions(!showCajaOptions)}
            >
              {!isCollapsed && (
                <ul
                  className={`mt-1 ml-5 pl-2 border-l border-zinc-700 space-y-1 overflow-hidden transition-all duration-200 ${
                    showCajaOptions ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <li>
                    <Link
                      to="/cajero/caja/ingresos"
                      className={`flex items-center gap-1 px-2 py-1.5 text-[12px] rounded-md ${
                        isActive("/cajero/caja/ingresos")
                          ? "bg-zinc-800/70 text-white border-l border-red-500/70"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-800/40"
                      }`}
                    >
                      <ChevronRight size={14} />
                      <span>Ingresos</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/cajero/caja/egresos"
                      className={`flex items-center gap-1 px-2 py-1.5 text-[12px] rounded-md ${
                        isActive("/cajero/caja/egresos")
                          ? "bg-zinc-800/70 text-white border-l border-red-500/70"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-800/40"
                      }`}
                    >
                      <ChevronRight size={14} />
                      <span>Egresos</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/cajero/caja/arqueo"
                      className={`flex items-center gap-1 px-2 py-1.5 text-[12px] rounded-md ${
                        isActive("/cajero/caja/arqueo")
                          ? "bg-zinc-800/70 text-white border-l border-red-500/70"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-800/40"
                      }`}
                    >
                      <ChevronRight size={14} />
                      <span>Arqueo</span>
                    </Link>
                  </li>
                </ul>
              )}
            </NavItem>
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-2 mt-auto">
          {!isCollapsed && <div className="text-[11px] text-zinc-500 text-center">BarberXE v1.0</div>}
        </div>
      </div>
    </aside>
  )
}

export default SidebarCajero