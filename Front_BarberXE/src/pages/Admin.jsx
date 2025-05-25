import { useState } from "react"
import { Routes, Route, useLocation } from "react-router-dom"
import Sidebar from "../components/Admin/Navbar-Sidebar/Sidebar.jsx"
import Navbar from "../components/Admin/Navbar-Sidebar/Navbar.jsx"
import TableEmployees from "../components/Admin/Usuarios/CrudEmployees.jsx"
import TableClients from "../components/Admin/Usuarios/CrudClient.jsx"
import TableServices from "../components/Admin/Servicios-Cortes/CrudService.jsx"
import TableIngresos from "../components/Admin/Caja/CrudIncome.jsx"
import TableEgresos from "../components/Admin/Caja/CrudEgress.jsx"
import LineChart1 from "../components/Admin/Reportes/Grafic.jsx"
import TableCortes from "../components/Admin/Servicios-Cortes/CrudCortes.jsx"
import TableCitas from "../components/Admin/Citas/CrudQuotes.jsx"
import ArqueoDeCaja from "../components/Admin/Caja/CrudArqueo.jsx"

const AdminPage = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const location = useLocation()

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  // Verificar si la ruta actual es la raíz del admin
  const isAdminRoot = location.pathname === "/admin" || location.pathname === "/admin/"

  return (
    <div className="flex bg-zinc-100 min-h-screen">
      <Sidebar isCollapsed={isCollapsed} />
      <div className="flex-1 flex flex-col transition-all duration-300">
        <Navbar toggleSidebar={toggleSidebar} isCollapsed={isCollapsed} />
        <div className={`flex-1 p-6 transition-all duration-300 bg-zinc-100 ${isCollapsed ? "ml-16" : "ml-60"}`}>
          <Routes>
            {/* Ruta para /admin */}
            <Route index element={<LineChart1 isCollapsed={isCollapsed} />} />

            {/* Rutas anidadas bajo /admin */}
            <Route path="Empleados" element={<TableEmployees isCollapsed={isCollapsed} />} />
            <Route path="Clientes" element={<TableClients isCollapsed={isCollapsed} />} />
            <Route path="Servicios" element={<TableServices isCollapsed={isCollapsed} />} />
            <Route path="Cortes" element={<TableCortes isCollapsed={isCollapsed} />} />
            <Route path="Citas" element={<TableCitas isCollapsed={isCollapsed} />} />

            {/* Rutas anidadas para Caja */}
            <Route path="Caja/Ingreso" element={<TableIngresos isCollapsed={isCollapsed} />} />
            <Route path="Caja/Egreso" element={<TableEgresos isCollapsed={isCollapsed} />} />
            <Route path="Caja/Arqueo" element={<ArqueoDeCaja isCollapsed={isCollapsed} />} />

            {/* Redirección para rutas no encontradas */}
            <Route path="*" element={<LineChart1 isCollapsed={isCollapsed} />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

export default AdminPage
