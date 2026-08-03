import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../../services/api'
import ReportLayout, { StatCard, DateRange } from '../../components/reports/ReportLayout'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Truck } from 'lucide-react'

export default function ReportsProfitability() {
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

  const { data, isLoading } = useQuery({
    queryKey: ['report-profitability', startDate, endDate],
    queryFn: () => reportsApi.getTripProfitability(startDate, endDate),
  })

  const chartData = data?.data?.data || []
  const totalRevenue = chartData.reduce((sum: number, item: any) => sum + (item.revenue || 0), 0)
  const totalCosts = chartData.reduce((sum: number, item: any) => sum + (item.costs || 0), 0)
  const totalProfit = totalRevenue - totalCosts
  const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  const handleExport = (format: 'pdf' | 'excel') => {
    const content = chartData.map((item: any) => 
      `${item.trip_id}\t${item.client_name}\t${item.date}\t${item.tons}\t$${item.revenue}\t$${item.costs}\t$${item.profit}\t${item.margin}%`
    ).join('\n')
    const header = 'Viaje\tCliente\tFecha\tToneladas\tIngresos\tCostos\tGanancia\tMargen\n'
    const blob = new Blob([header + content], { type: 'text/tab-separated-values' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte-rentabilidad.${format === 'excel' ? 'tsv' : 'txt'}`
    a.click()
  }

  return (
    <ReportLayout
      title="Rentabilidad por Viaje"
      subtitle="Análisis de ingresos, costos y ganancia por viaje"
      onExport={handleExport}
      filters={<DateRange startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Ingresos Totales" value={`$${totalRevenue.toLocaleString()}`} icon={<DollarSign className="w-5 h-5 text-white" />} color="bg-green-500" />
        <StatCard title="Costos Totales" value={`$${totalCosts.toLocaleString()}`} icon={<TrendingDown className="w-5 h-5 text-white" />} color="bg-red-500" />
        <StatCard title="Ganancia Neta" value={`$${totalProfit.toLocaleString()}`} icon={<TrendingUp className="w-5 h-5 text-white" />} color="bg-blue-500" />
        <StatCard title="Margen Promedio" value={`${avgMargin.toFixed(1)}%`} icon={<Truck className="w-5 h-5 text-white" />} color="bg-purple-500" />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Ingresos vs Costos por Viaje</h3>
        {isLoading ? (
          <div className="h-80 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData.slice(-15)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="trip_id" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip formatter={(value: any, name: any) => [`$${value.toLocaleString()}`, name]} />
              <Legend />
              <Bar dataKey="revenue" name="Ingresos" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="costs" name="Costos" fill="#EF4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name="Ganancia" fill="#2563EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Tendencia de Margen (%)</h3>
        {isLoading ? (
          <div className="h-60 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.slice(-20)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="trip_id" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip formatter={(value: any) => [`${value}%`, 'Margen']} />
              <Line type="monotone" dataKey="margin" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Detalle de Viajes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Viaje', 'Cliente', 'Fecha', 'Toneladas', 'Ingresos', 'Costos', 'Ganancia', 'Margen'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {chartData.map((item: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">#{item.trip_id?.toString().substring(0, 8)}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.client_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.date}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.tons}</td>
                  <td className="px-4 py-3 text-sm text-green-600 font-medium">${item.revenue?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-red-600">${item.costs?.toLocaleString()}</td>
                  <td className={`px-4 py-3 text-sm font-medium ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${item.profit?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.margin >= 20 ? 'bg-green-100 text-green-800' : item.margin >= 10 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                      {item.margin}%
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
