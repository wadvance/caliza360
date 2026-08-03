import { useQuery } from '@tanstack/react-query'
import { dashboardApi, proformasApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useState } from 'react'
import SecretaryDashboard from './SecretaryDashboard'
import SupervisorDashboard from './SupervisorDashboard'
import AccountantDashboard from './AccountantDashboard'
import { 
  Truck, 
  Users, 
  Map, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Package,
  FileText,
  Radio,
  Boxes,
  Clock,
  UserCheck,
  X
} from 'lucide-react'

export default function Dashboard() {
  const { screens, user } = useAuthStore()

  if (user?.role === 'secretary') {
    return <SecretaryDashboard />
  }

  if (user?.role === 'supervisor') {
    return <SupervisorDashboard />
  }

  if (user?.role === 'accountant') {
    return <AccountantDashboard />
  }

  const { data: dashboard, isLoading, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.getDashboard(),
    refetchInterval: 15000,
  })

  const hasProformas = screens.includes('proformas')

  const { data: arrivalsData, isLoading: arrivalsLoading } = useQuery({
    queryKey: ['caliza-arrivals'],
    queryFn: () => dashboardApi.getCalizaArrivals(),
    refetchInterval: 15000,
  })

  const { data: proformasSummaryData } = useQuery({
    queryKey: ['proformas-summary'],
    queryFn: () => proformasApi.getSummary().then((r) => r.data),
    enabled: hasProformas,
  })

  const [selectedDriver, setSelectedDriver] = useState<{ id: string; name: string } | null>(null)

  const { data: driverDailyData, isLoading: driverLoading } = useQuery({
    queryKey: ['driver-daily', selectedDriver?.id],
    queryFn: () => dashboardApi.getDriverDailyTrips(selectedDriver!.id),
    enabled: !!selectedDriver,
  })

  const formatTime = (value: any) => {
    if (!value) return '—'
    const d = new Date(value)
    return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (value: any) => {
    if (!value) return '—'
    return new Date(value).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const arrivals = arrivalsData?.data
  const driverDaily = driverDailyData?.data

  const statusLabel: Record<string, string> = {
    scheduled: 'Programado',
    in_transit: 'En ruta',
    delivered: 'Entregado',
    returned: 'Regresado',
    cancelled: 'Cancelado',
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const data = dashboard?.data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard en Vivo</h1>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-2 text-sm text-gray-500 ${isFetching ? 'opacity-60' : ''}`}>
            <span className={`w-2 h-2 rounded-full ${isFetching ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`} />
            {isFetching ? 'Actualizando...' : `Actualizado ${new Date(dataUpdatedAt).toLocaleTimeString('es-MX')}`}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <Radio className="w-3.5 h-3.5" /> Auto-refresco 15s
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-900 dark:border dark:border-gray-800">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Map className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Viajes Hoy</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{data?.summary?.total_trips || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-900 dark:border dark:border-gray-800">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <Package className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Toneladas</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{data?.summary?.total_tons || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-900 dark:border dark:border-gray-800">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-emerald-100 text-emerald-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Ingresos</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                ${(data?.summary?.total_income || 0).toLocaleString('es-MX')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-900 dark:border dark:border-gray-800">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Gastos</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                ${(data?.summary?.total_expenses || 0).toLocaleString('es-MX')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Resources and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resources */}
        <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-900 dark:border dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recursos Activos</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Truck className="w-5 h-5 text-gray-400 mr-3" />
                <span className="text-gray-600">Camiones Activos</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">{data?.resources?.active_trucks || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="w-5 h-5 text-gray-400 mr-3" />
                <span className="text-gray-600">Conductores Activos</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">{data?.resources?.active_drivers || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Map className="w-5 h-5 text-gray-400 mr-3" />
                <span className="text-gray-600">Viajes en Curso</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">{data?.resources?.trips_in_progress || 0}</span>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-900 dark:border dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Alertas</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mr-3" />
                <span className="text-gray-600">Stock Bajo</span>
              </div>
              <span className="font-semibold text-yellow-600">{data?.alerts?.low_stock || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-3" />
                <span className="text-gray-600">Stock Crítico</span>
              </div>
              <span className="font-semibold text-red-600">{data?.alerts?.critical_stock || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-orange-500 mr-3" />
                <span className="text-gray-600">Cuentas por Cobrar</span>
              </div>
              <span className="font-semibold text-orange-600">{data?.alerts?.pending_receivable || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="w-5 h-5 text-red-500 mr-3" />
                <span className="text-gray-600">Facturas Vencidas</span>
              </div>
              <span className="font-semibold text-red-600">{data?.alerts?.overdue_invoices || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Profit Summary */}
      <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-900 dark:border dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resumen del Día</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-500">Ingresos</p>
            <p className="text-2xl font-bold text-green-600">
              ${(data?.summary?.total_income || 0).toLocaleString('es-MX')}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Gastos</p>
            <p className="text-2xl font-bold text-red-600">
              ${(data?.summary?.total_expenses || 0).toLocaleString('es-MX')}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Ganancia</p>
            <p className={`text-2xl font-bold ${(data?.summary?.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${(data?.summary?.profit || 0).toLocaleString('es-MX')}
            </p>
          </div>
        </div>
      </div>

      {/* Caliza Arrivals */}
      <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-900 dark:border dark:border-gray-800">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-100 text-amber-600">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Llegadas de Caliza (Hoy)</h2>
              <p className="text-xs text-gray-500">Camiones que llegaron cargados de caliza</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <span className="text-gray-600 dark:text-gray-400">
              Llegadas: <strong className="text-gray-900 dark:text-white">{arrivals?.total_arrivals || 0}</strong>
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              Total carga: <strong className="text-gray-900 dark:text-white">{Number(arrivals?.total_tons || 0).toLocaleString('es-MX')} ton</strong>
            </span>
            {hasProformas && (
              <span className="text-gray-600 dark:text-gray-400">
                Sacos salidos: <strong className="text-amber-600">{Number(proformasSummaryData?.total_sacks || 0).toLocaleString('es-MX')}</strong>
              </span>
            )}
          </div>
        </div>

        {arrivalsLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (arrivals?.arrivals?.length || 0) === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Aún no hay camiones que hayan llegado con caliza hoy.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="px-3 py-2">Camión</th>
                  <th className="px-3 py-2">Camionero</th>
                  <th className="px-3 py-2 text-right">Carga (ton)</th>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Hora llegada</th>
                  <th className="px-3 py-2">Cliente</th>
                  <th className="px-3 py-2 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {arrivals?.arrivals?.map((a: any) => (
                  <tr key={a.id} className="text-sm text-gray-700 dark:text-gray-300">
                    <td className="px-3 py-3 font-medium">{a.truck_plate || '—'}</td>
                    <td className="px-3 py-3">{a.driver_name || '—'}</td>
                    <td className="px-3 py-3 text-right font-semibold">{Number(a.load_tons || 0).toLocaleString('es-MX')}</td>
                    <td className="px-3 py-3">{formatDate(a.arrived_at)}</td>
                    <td className="px-3 py-3">{formatTime(a.arrived_at)}</td>
                    <td className="px-3 py-3">{a.client_name || '—'}</td>
                    <td className="px-3 py-3 text-right">
                      <button
                        onClick={() => setSelectedDriver({ id: String(a.driver_id), name: a.driver_name })}
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Viajes del día
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Driver daily trips modal */}
      {selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedDriver(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col dark:bg-gray-900 dark:border dark:border-gray-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                  {selectedDriver.name || 'Camionero'}
                </h3>
                <p className="text-sm text-gray-500">
                  Viajes y cargas de hoy · {new Date().toLocaleDateString('es-MX')}
                </p>
              </div>
              <button
                onClick={() => setSelectedDriver(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-amber-100 text-amber-600">
                    <Boxes className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Veces cargado</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{driverDaily?.total_loads ?? '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-green-100 text-green-600">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total carga (ton)</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                      {Number(driverDaily?.total_tons || 0).toLocaleString('es-MX')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-blue-100 text-blue-600">
                    <Map className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Viajes del día</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{driverDaily?.trips?.length ?? '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {driverLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (driverDaily?.trips?.length || 0) === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No hay viajes registrados hoy para este camionero.
                </div>
              ) : (
                <div className="space-y-3">
                  {driverDaily?.trips?.map((t: any) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                          <Truck className="w-4 h-4" /> {t.truck_plate || '—'}
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{t.material_type}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {Number(t.load_tons || 0).toLocaleString('es-MX')} ton
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          t.status === 'returned'
                            ? 'bg-green-100 text-green-700'
                            : t.status === 'delivered'
                            ? 'bg-blue-100 text-blue-700'
                            : t.status === 'in_transit'
                            ? 'bg-yellow-100 text-yellow-700'
                            : t.status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {statusLabel[t.status] || t.status}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3.5 h-3.5" />
                          Salida {formatTime(t.departure_time)} · Llegada {formatTime(t.return_time || t.arrival_time)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
