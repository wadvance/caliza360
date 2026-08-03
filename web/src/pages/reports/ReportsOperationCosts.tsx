import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../../services/api'
import ReportLayout, { StatCard, DateRange } from '../../components/reports/ReportLayout'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { DollarSign, Fuel, Wrench, Users, FileText } from 'lucide-react'

const COLORS = ['#2563EB', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

export default function ReportsOperationCosts() {
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

  const { data, isLoading } = useQuery({
    queryKey: ['report-operation-costs', startDate, endDate],
    queryFn: () => reportsApi.getOperationCosts(startDate, endDate),
  })

  const summary = data?.data || {}
  const categories = summary.categories || []
  const monthlyData = summary.monthly_data || []
  const totalCosts = categories.reduce((sum: number, item: any) => sum + (item.amount || 0), 0)

  const handleExport = (format: 'pdf' | 'excel') => {
    let content = `Costos de Operación\n`
    content += `Periodo: ${startDate} - ${endDate}\n\n`
    content += `Total: $${totalCosts.toLocaleString()}\n\n`
    content += `Desglose:\n`
    categories.forEach((item: any) => {
      content += `  ${item.category}: $${item.amount.toLocaleString()} (${item.percentage}%)\n`
    })
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte-costos-operacion.txt`
    a.click()
  }

  return (
    <ReportLayout
      title="Costos de Operación"
      subtitle="Desglose de costos operativos del negocio"
      onExport={handleExport}
      filters={<DateRange startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Costo Total" value={`$${totalCosts.toLocaleString()}`} icon={<DollarSign className="w-5 h-5 text-white" />} color="bg-red-500" />
        <StatCard title="Combustible" value={`$${categories.find((c: any) => c.category === 'Combustible')?.amount?.toLocaleString() || 0}`} icon={<Fuel className="w-5 h-5 text-white" />} color="bg-yellow-500" />
        <StatCard title="Mantenimiento" value={`$${categories.find((c: any) => c.category === 'Mantenimiento')?.amount?.toLocaleString() || 0}`} icon={<Wrench className="w-5 h-5 text-white" />} color="bg-blue-500" />
        <StatCard title="Sueldos" value={`$${categories.find((c: any) => c.category === 'Sueldos')?.amount?.toLocaleString() || 0}`} icon={<Users className="w-5 h-5 text-white" />} color="bg-green-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Distribución de Costos</h3>
          {isLoading ? (
            <div className="h-80 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
          ) : categories.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie data={categories} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={120} label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                  {categories.map((_: any, index: number) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`$${value.toLocaleString()}`]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-400">Sin datos</div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Costos por Categoría</h3>
          {isLoading ? (
            <div className="h-80 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={categories} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="category" type="category" width={120} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: any) => [`$${value.toLocaleString()}`]} />
                <Bar dataKey="amount" fill="#2563EB" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Detalle de Costos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Categoría', 'Monto', 'Porcentaje', 'Tendencia'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.map((item: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.category}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">${item.amount?.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${item.percentage}%` }} />
                      </div>
                      <span>{item.percentage}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${(item.trend || 0) >= 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {(item.trend || 0) >= 0 ? '+' : ''}{item.trend || 0}%
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
