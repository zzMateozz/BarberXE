import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Home, Users, Calendar, Calculator, FileText, ChevronDown, ChevronRight } from "lucide-react"
import iconoAdmin from "../../../assets/barberia1.png"

const Sidebar = ({ isCollapsed }) => {
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

        {/* Navigation */}
        <nav className="mt-2 px-2 flex-1">
          <ul className="space-y-1">
            {!isCollapsed && (
              <li className="px-2 py-1.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Principal
              </li>
            )}
            <NavItem to="/admin" icon={Home} label="Home" active={location.pathname === "/admin"} />

            {!isCollapsed && (
              <li className="px-2 py-1.5 mt-2 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Gestión
              </li>
            )}
            <NavItem to="/admin/Empleados" icon={Users} label="Empleados" active={isActive("/admin/Empleados")} />

            <NavItem to="/admin/Clientes" icon={Users} label="Clientes" active={isActive("/admin/Clientes")} />

            <NavItem to="/admin/Servicios" icon={FileText} label="Servicios" active={isActive("/admin/Servicios")} />

            <NavItem to="/admin/Cortes" icon={FileText} label="Cortes" active={isActive("/admin/Cortes")} />

            {!isCollapsed && (
              <li className="px-2 py-1.5 mt-2 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Agenda
              </li>
            )}
            <NavItem to="/admin/Citas" icon={Calendar} label="Citas" active={isActive("/admin/Citas")} />

            {!isCollapsed && (
              <li className="px-2 py-1.5 mt-2 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Finanzas
              </li>
            )}
            <NavItem
              icon={Calculator}
              label="Caja"
              active={isActive("/admin/Caja")}
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
                      to="/admin/Caja/Ingreso"
                      className={`flex items-center gap-1 px-2 py-1.5 text-[12px] rounded-md ${
                        isActive("/admin/Caja/Ingreso")
                          ? "bg-zinc-800/70 text-white border-l border-red-500/70"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-800/40"
                      }`}
                    >
                      <ChevronRight size={14} />
                      <span>Ingreso</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/admin/Caja/Egreso"
                      className={`flex items-center gap-1 px-2 py-1.5 text-[12px] rounded-md ${
                        isActive("/admin/Caja/Egreso")
                          ? "bg-zinc-800/70 text-white border-l border-red-500/70"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-800/40"
                      }`}
                    >
                      <ChevronRight size={14} />
                      <span>Egreso</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/admin/Caja/Arqueo"
                      className={`flex items-center gap-1 px-2 py-1.5 text-[12px] rounded-md ${
                        isActive("/admin/Caja/Arqueo")
                          ? "bg-zinc-800/70 text-white border-l border-red-500/70"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-800/40"
                      }`}
                    >
                      <ChevronRight size={14} />
                      <span>Arqueo de Caja</span>
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

export default Sidebar