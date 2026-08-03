import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../../services/api'
import ReportLayout, { StatCard, DateRange } from '../../components/reports/ReportLayout'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Truck, TrendingUp, Fuel, Wrench } from 'lucide-react'

export default function ReportsTruckPerformance() {
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

  const { data, isLoading } = useQuery({
    queryKey: ['report-truck-performance', startDate, endDate],
    queryFn: () => reportsApi.getTruckPerformance(startDate, endDate),
  })

  const chartData = data?.data?.data || []
  const totalTrips = chartData.reduce((sum: number, item: any) => sum + (item.total_trips || 0), 0)
  const totalTons = chartData.reduce((sum: number, item: any) => sum + (item.total_tons || 0), 0)
  const totalRevenue = chartData.reduce((sum: number, item: any) => sum + (item.total_revenue || 0), 0)

  const handleExport = (format: 'pdf' | 'excel') => {
    const content = chartData.map((item: any) => 
      `${item.truck_plate}\t${item.total_trips}\t${item.total_tons}ton\t$${item.total_revenue}\t${item.avg_tons_per_trip}ton/viaje\t$${item.revenue_per_km}/km`
    ).join('\n')
    const header = 'Camión\tViajes\tToneladas\tIngresos\tPromedio/Viaje\tIngreso/Km\n'
    const blob = new Blob([header + content], { type: 'text/tab-separated-values' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte-rendimiento-camiones.${format === 'excel' ? 'tsv' : 'txt'}`
    a.click()
  }

  return (
    <ReportLayout
      title="Rendimiento de Camiones"
      subtitle="Análisis de productividad y eficiencia por camión"
      onExport={handleExport}
      filters={<DateRange startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Camiones Activos" value={chartData.length} icon={<Truck className="w-5 h-5 text-white" />} color="bg-blue-500" />
        <StatCard title="Viajes Totales" value={totalTrips} icon={<TrendingUp className="w-5 h-5 text-white" />} color="bg-green-500" />
        <StatCard title="Toneladas Totales" value={`${totalTons.toLocaleString()} ton`} icon={<Truck className="w-5 h-5 text-white" />} color="bg-yellow-500" />
        <StatCard title="Ingresos Totales" value={`$${totalRevenue.toLocaleString()}`} icon={<Fuel className="w-5 h-5 text-white" />} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Viajes por Camión</h3>
          {isLoading ? (
            <div className="h-80 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="truck_plate" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total_trips" name="Viajes" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Ingresos por Camión</h3>
          {isLoading ? (
            <div className="h-80 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="truck_plate" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip formatter={(value: any) => [`$${value.toLocaleString()}`]} />
                <Bar dataKey="total_revenue" name="Ingresos" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Detalle por Camión</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Camión', 'Viajes', 'Toneladas', 'Ingresos', 'Promedio/Viaje', 'Ingreso/Km'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {chartData.map((item: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.truck_plate}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.total_trips}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.total_tons?.toLocaleString()} ton</td>
                  <td className="px-4 py-3 text-sm font-medium text-green-600">${item.total_revenue?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.avg_tons_per_trip} ton/viaje</td>
                  <td className="px-4 py-3 text-sm text-gray-900">${item.revenue_per_km}/km</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ReportLayout>
  )
}
