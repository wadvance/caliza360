import { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  Map, 
  UserCheck, 
  Package, 
  FileText, 
  BarChart3,
  LogOut,
  Menu,
  X,
  Settings,
  DollarSign,
  Sun,
  Moon,
  UserCog,
  Boxes,
  ClipboardCheck,
  Send,
  StickyNote,
  Wallet,
  MessageCircle,
} from 'lucide-react'
import { useState, useEffect } from 'react'

interface LayoutProps {
  children: ReactNode
}

const menuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, screen: 'dashboard' },
  { path: '/trucks', label: 'Camiones', icon: Truck, screen: 'trucks' },
  { path: '/drivers', label: 'Conductores', icon: UserCheck, screen: 'drivers' },
  { path: '/trips', label: 'Viajes', icon: Map, screen: 'trips' },
  { path: '/proformas', label: 'Proformas de Carga', icon: Boxes, screen: 'proformas' },
  { path: '/controls', label: 'Controles Cantera/Planta', icon: ClipboardCheck, screen: 'controls' },
  { path: '/dispatches', label: 'Despachos de Producción', icon: Send, screen: 'dispatches' },
  { path: '/live-map', label: 'Mapa en Vivo', icon: Map, screen: 'live-map' },
  { path: '/clients', label: 'Clientes', icon: Users, screen: 'clients' },
  { path: '/suppliers', label: 'Proveedores', icon: Package, screen: 'suppliers' },
  { path: '/inventory', label: 'Inventario', icon: Package, screen: 'inventory' },
  { path: '/invoices', label: 'Facturación', icon: FileText, screen: 'invoices' },
  { path: '/accounting', label: 'Contabilidad', icon: DollarSign, screen: 'accounting' },
  { path: '/payroll', label: 'Nómina', icon: Users, screen: 'payroll' },
  { path: '/notes', label: 'Notas de Oficina', icon: StickyNote, screen: 'notes' },
  { path: '/whatsapp', label: 'Mensajería WhatsApp', icon: MessageCircle, screen: 'whatsapp' },
  { path: '/petty-cash', label: 'Caja Menuda', icon: Wallet, screen: 'petty-cash' },
  { path: '/reports', label: 'Reportes', icon: BarChart3, screen: 'reports' },
  { path: '/settings', label: 'Configuración', icon: Settings, screen: 'settings' },
  { path: '/settings/users', label: 'Usuarios', icon: UserCog, screen: 'users' },
  { path: '/settings/email', label: 'Config. Correos', icon: Settings, screen: 'settings-email' },
]

export default function Layout({ children }: LayoutProps) {
  const { user, screens, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dark, setDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('caliza-theme')
    if (saved) return saved === 'dark'
    return true
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('caliza-theme', dark ? 'dark' : 'light')
  }, [dark])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 dark:bg-gray-900 dark:border-gray-800 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-800">
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">Caliza Los Osos</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {menuItems
              .filter((item) => screens.includes(item.screen))
              .map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* User info and logout */}
          <div className="border-t border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-3 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 bg-white border-b border-gray-200 px-4 lg:px-6 dark:bg-gray-900 dark:border-gray-800">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex-1" />
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDark(v => !v)}
              title={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className="p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800"
            >
              {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {new Date().toLocaleDateString('es-MX', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
