import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { authApi } from './services/api'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Trucks from './pages/Trucks'
import Drivers from './pages/Drivers'
import Trips from './pages/Trips'
import Clients from './pages/Clients'
import Inventory from './pages/Inventory'
import Invoices from './pages/Invoices'
import Reports from './pages/Reports'
import ReportsTonsByClient from './pages/reports/ReportsTonsByClient'
import ReportsProfitability from './pages/reports/ReportsProfitability'
import ReportsFuelConsumption from './pages/reports/ReportsFuelConsumption'
import ReportsOperationCosts from './pages/reports/ReportsOperationCosts'
import ReportsFinancial from './pages/reports/ReportsFinancial'
import ReportsTruckPerformance from './pages/reports/ReportsTruckPerformance'
import ReportsDriverPerformance from './pages/reports/ReportsDriverPerformance'
import MaintenancePredictions from './pages/reports/MaintenancePredictions'
import RouteOptimizer from './pages/reports/RouteOptimizer'
import ReportsMaterial from './pages/reports/ReportsMaterial'
import ReportsInventory from './pages/reports/ReportsInventory'
import LiveMap from './pages/LiveMap'
import EmailSettings from './pages/EmailSettings'
import Suppliers from './pages/Suppliers'
import Accounting from './pages/Accounting'
import Settings from './pages/Settings'
import Payroll from './pages/Payroll'
import Users from './pages/Users'
import Proformas from './pages/Proformas'
import Controls from './pages/Controls'
import Dispatches from './pages/Dispatches'
import Notes from './pages/Notes'
import PettyCash from './pages/PettyCash'
import WhatsApp from './pages/WhatsApp'
import { useAuthStore } from './store/authStore'

const queryClient = new QueryClient()

const routeScreens: Record<string, string> = {
  '/': 'dashboard',
  '/trucks': 'trucks',
  '/drivers': 'drivers',
  '/trips': 'trips',
  '/proformas': 'proformas',
  '/controls': 'controls',
  '/dispatches': 'dispatches',
  '/live-map': 'live-map',
  '/clients': 'clients',
  '/inventory': 'inventory',
  '/invoices': 'invoices',
  '/reports': 'reports',
  '/settings/email': 'settings-email',
  '/suppliers': 'suppliers',
  '/accounting': 'accounting',
  '/settings': 'settings',
  '/settings/users': 'users',
  '/payroll': 'payroll',
  '/notes': 'notes',
  '/petty-cash': 'petty-cash',
  '/whatsapp': 'whatsapp',
}

function resolveScreen(pathname: string): string | null {
  if (routeScreens[pathname]) return routeScreens[pathname]
  if (pathname.startsWith('/reports/')) return 'reports'
  return null
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, screens } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const required = resolveScreen(location.pathname)
  if (required && !screens.includes(required)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function ScreenSync() {
  const { isAuthenticated, setScreens } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) return
    authApi.me().then((res) => {
      setScreens(res.data.screens || [])
    }).catch(() => {})
  }, [isAuthenticated, setScreens])

  return null
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ScreenSync />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/trucks" element={<Trucks />} />
                    <Route path="/drivers" element={<Drivers />} />
                    <Route path="/trips" element={<Trips />} />
                    <Route path="/proformas" element={<Proformas />} />
                    <Route path="/controls" element={<Controls />} />
                    <Route path="/dispatches" element={<Dispatches />} />
                    <Route path="/live-map" element={<LiveMap />} />
                    <Route path="/clients" element={<Clients />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/invoices" element={<Invoices />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/reports/tons-by-client" element={<ReportsTonsByClient />} />
                    <Route path="/reports/profitability" element={<ReportsProfitability />} />
                    <Route path="/reports/fuel-consumption" element={<ReportsFuelConsumption />} />
                    <Route path="/reports/operation-costs" element={<ReportsOperationCosts />} />
                    <Route path="/reports/financial" element={<ReportsFinancial />} />
                    <Route path="/reports/truck-performance" element={<ReportsTruckPerformance />} />
                    <Route path="/reports/driver-performance" element={<ReportsDriverPerformance />} />
                    <Route path="/reports/maintenance" element={<MaintenancePredictions />} />
                    <Route path="/reports/route-optimizer" element={<RouteOptimizer />} />
                    <Route path="/reports/material-report" element={<ReportsMaterial />} />
                    <Route path="/reports/inventory-report" element={<ReportsInventory />} />
                    <Route path="/settings/email" element={<EmailSettings />} />
                    <Route path="/suppliers" element={<Suppliers />} />
                    <Route path="/accounting" element={<Accounting />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/settings/users" element={<Users />} />
                    <Route path="/payroll" element={<Payroll />} />
                    <Route path="/notes" element={<Notes />} />
                    <Route path="/petty-cash" element={<PettyCash />} />
                    <Route path="/whatsapp" element={<WhatsApp />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </QueryClientProvider>
  )
}

export default App
