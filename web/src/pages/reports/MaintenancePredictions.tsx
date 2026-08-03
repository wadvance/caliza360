import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { aiApi } from '../../services/api'
import ReportLayout, { StatCard } from '../../components/reports/ReportLayout'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { AlertTriangle, CheckCircle, Clock, Wrench, Truck } from 'lucide-react'

export default function MaintenancePredictions() {
  const { data, isLoading } = useQuery({
    queryKey: ['ai-fleet-predictions'],
    queryFn: () => aiApi.getFleetPredictions(),
  })

  const predictions = data?.data?.data || []
  const alerts = predictions.filter((p: any) => p.alert)
  const critical = predictions.filter((p: any) => p.severity === 'critical')
  const high = predictions.filter((p: any) => p.severity === 'high')

  const chartData = predictions.map((p: any) => ({
    name: p.truck_plate,
    km_until: p.km_until_service || 0,
    severity: p.severity,
  }))

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default: return 'bg-green-100 text-green-800 border-green-300'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-600" />
      case 'high': return <AlertTriangle className="w-5 h-5 text-orange-600" />
      case 'medium': return <Clock className="w-5 h-5 text-yellow-600" />
      default: return <CheckCircle className="w-5 h-5 text-green-600" />
    }
  }

  return (
    <ReportLayout
      title="Predicción de Mantenimiento"
      subtitle="IA basada en kilometraje e historial de mantenimiento"
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Camiones Activos" value={predictions.length} icon={<Truck className="w-5 h-5 text-white" />} color="bg-blue-500" />
        <StatCard title="Con Alerta" value={alerts.length} icon={<AlertTriangle className="w-5 h-5 text-white" />} color="bg-orange-500" />
        <StatCard title="Críticos" value={critical.length} icon={<AlertTriangle className="w-5 h-5 text-white" />} color="bg-red-500" />
        <StatCard title="Urgentes" value={high.length} icon={<Clock className="w-5 h-5 text-white" />} color="bg-yellow-500" />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Kilómetros Hasta Próximo Mantenimiento</h3>
        {isLoading ? (
          <div className="h-80 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip formatter={(value: any) => [`${(value || 0).toLocaleString()} km`]} />
              <Bar dataKey="km_until" radius={[4, 4, 0, 0]}>
                {chartData.map((entry: any, index: number) => (
                  <rect key={index} fill={
                    entry.severity === 'critical' ? '#EF4444' :
                    entry.severity === 'high' ? '#F97316' :
                    entry.severity === 'medium' ? '#EAB308' : '#22C55E'
                  } />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Detalle por Camión</h3>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          predictions.map((pred: any, i: number) => (
            <div key={i} className={`bg-white rounded-lg shadow p-6 border-l-4 ${
              pred.severity === 'critical' ? 'border-red-500' :
              pred.severity === 'high' ? 'border-orange-500' :
              pred.severity === 'medium' ? 'border-yellow-500' : 'border-green-500'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getSeverityIcon(pred.severity)}
                  <div>
                    <h4 className="font-semibold text-lg">{pred.truck_plate}</h4>
                    <p className="text-sm text-gray-500">{pred.message}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(pred.severity)}`}>
                  {pred.severity?.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <p className="text-xs text-gray-500">Kilometraje Actual</p>
                  <p className="font-semibold">{pred.current_mileage?.toLocaleString()} km</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Próximo Servicio</p>
                  <p className="font-semibold">{pred.next_service_km?.toLocaleString()} km</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Km Restantes</p>
                  <p className={`font-semibold ${pred.km_until_service < 200 ? 'text-red-600' : pred.km_until_service < 500 ? 'text-orange-600' : 'text-green-600'}`}>
                    {pred.km_until_service?.toLocaleString()} km
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Fecha Estimada</p>
                  <p className="font-semibold">{pred.estimated_date}</p>
                </div>
              </div>

              {pred.recommended_actions && pred.recommended_actions.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-2">Acciones Recomendadas:</p>
                  <ul className="space-y-1">
                    {pred.recommended_actions.map((action: string, j: number) => (
                      <li key={j} className="text-sm text-gray-600 flex items-center gap-2">
                        <Wrench className="w-3 h-3 text-gray-400" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </ReportLayout>
  )
}
