import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../../services/api'
import ReportLayout, { StatCard, DateRange } from '../../components/reports/ReportLayout'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Package, TrendingUp, DollarSign } from 'lucide-react'

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

export default function ReportsMaterial() {
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

  const { data, isLoading } = useQuery({
    queryKey: ['report-material', startDate, endDate],
    queryFn: () => reportsApi.getMaterialReport(startDate, endDate),
  })

  const chartData = data?.data?.data || []
  const totalTons = chartData.reduce((sum: number, item: any) => sum + (item.total_tons || 0), 0)
  const totalRevenue = chartData.reduce((sum: number, item: any) => sum + (item.total_revenue || 0), 0)

  const handleExport = (format: 'pdf' | 'excel') => {
    const content = chartData.map((item: any) =>
      `${item.material_type}\t${item.total_tons}\t${item.total_trips}\t$${item.total_revenue}\t$${item.avg_price_per_ton}`
    ).join('\n')
    const header = 'Material\tToneladas\tViajes\tIngresos\tPrecio Prom./Ton\n'
    const blob = new Blob([header + content], { type: format === 'excel' ? 'text/tab-separated-values' : 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte-por-material.${format === 'excel' ? 'tsv' : 'txt'}`
    a.click()
  }

  return (
    <ReportLayout
      title="Reporte por Material"
      subtitle="Ventas por tipo de material"
      onExport={handleExport}
      filters={<DateRange startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Materiales" value={chartData.length} icon={<Package className="w-5 h-5 text-white" />} color="bg-teal-500" />
        <StatCard title="Total Toneladas" value={`${totalTons.toLocaleString()} ton`} icon={<TrendingUp className="w-5 h-5 text-white" />} color="bg-blue-500" />
        <StatCard title="Ingresos Totales" value={`$${totalRevenue.toLocaleString()}`} icon={<DollarSign className="w-5 h-5 text-white" />} color="bg-green-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Toneladas por Material</h3>
          {isLoading ? (
            <div className="h-80 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="material_type" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip formatter={(value: any) => [`${value} ton`, 'Toneladas']} />
                <Bar dataKey="total_tons" fill="#0D9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Distribución por Material</h3>
          {isLoading ? (
            <div className="h-80 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie data={chartData} dataKey="total_tons" nameKey="material_type" cx="50%" cy="50%" outerRadius={120} label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}>
                  {chartData.map((_: any, index: number) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`${value} ton`]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Detalle por Material</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Material', 'Toneladas', 'Viajes', 'Precio Prom./Ton', 'Ingreso Total'].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {chartData.map((item: any, i: number) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.material_type}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{item.total_tons?.toLocaleString()} ton</td>
                <td className="px-6 py-4 text-sm text-gray-900">{item.total_trips}</td>
                <td className="px-6 py-4 text-sm text-gray-900">${item.avg_price_per_ton?.toLocaleString()}</td>
                <td className="px-6 py-4 text-sm font-medium text-green-600">${item.total_revenue?.toLocaleString()}</td>
              </tr>
            ))}
            {chartData.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                  Sin datos para el período seleccionado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ReportLayout>
  )
}
