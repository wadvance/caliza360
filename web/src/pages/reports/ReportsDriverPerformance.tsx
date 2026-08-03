import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../../services/api'
import ReportLayout, { StatCard, DateRange } from '../../components/reports/ReportLayout'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Users, TrendingUp, Star, Clock } from 'lucide-react'

export default function ReportsDriverPerformance() {
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

  const { data, isLoading } = useQuery({
    queryKey: ['report-driver-performance', startDate, endDate],
    queryFn: () => reportsApi.getDriverPerformance(startDate, endDate),
  })

  const chartData = data?.data?.data || []
  const totalTrips = chartData.reduce((sum: number, item: any) => sum + (item.total_trips || 0), 0)
  const totalHours = chartData.reduce((sum: number, item: any) => sum + (item.total_hours || 0), 0)
  const avgRating = chartData.length > 0 ? (chartData.reduce((sum: number, item: any) => sum + (item.avg_rating || 0), 0) / chartData.length).toFixed(1) : '0'

  const handleExport = (format: 'pdf' | 'excel') => {
    const content = chartData.map((item: any) => 
      `${item.driver_name}\t${item.total_trips}\t${item.total_tons}ton\t${item.total_hours}h\t$${item.total_revenue}\t${item.avg_rating}\t${item.efficiency_score}`
    ).join('\n')
    const header = 'Conductor\tViajes\tToneladas\tHoras\tIngresos\tCalificación\tEficiencia\n'
    const blob = new Blob([header + content], { type: 'text/tab-separated-values' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte-rendimiento-conductores.${format === 'excel' ? 'tsv' : 'txt'}`
    a.click()
  }

  return (
    <ReportLayout
      title="Rendimiento de Conductores"
      subtitle="Análisis de productividad y eficiencia por conductor"
      onExport={handleExport}
      filters={<DateRange startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Conductores Activos" value={chartData.length} icon={<Users className="w-5 h-5 text-white" />} color="bg-blue-500" />
        <StatCard title="Viajes Totales" value={totalTrips} icon={<TrendingUp className="w-5 h-5 text-white" />} color="bg-green-500" />
        <StatCard title="Horas Totales" value={`${totalHours.toFixed(0)}h`} icon={<Clock className="w-5 h-5 text-white" />} color="bg-yellow-500" />
        <StatCard title="Calificación Promedio" value={`${avgRating}/5`} icon={<Star className="w-5 h-5 text-white" />} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Viajes por Conductor</h3>
          {isLoading ? (
            <div className="h-80 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="driver_name" type="category" width={120} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="total_trips" name="Viajes" fill="#2563EB" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Eficiencia por Conductor</h3>
          {isLoading ? (
            <div className="h-80 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="driver_name" type="category" width={120} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="efficiency_score" name="Eficiencia" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Detalle por Conductor</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Conductor', 'Viajes', 'Toneladas', 'Horas', 'Ingresos', 'Calificación', 'Eficiencia'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {chartData.map((item: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.driver_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.total_trips}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.total_tons?.toLocaleString()} ton</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.total_hours?.toFixed(1)}h</td>
                  <td className="px-4 py-3 text-sm font-medium text-green-600">${item.total_revenue?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      {item.avg_rating?.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.efficiency_score >= 80 ? 'bg-green-100 text-green-800' : item.efficiency_score >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                      {item.efficiency_score}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ReportLayout>
  )
}
