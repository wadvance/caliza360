import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../../services/api'
import ReportLayout, { StatCard, DateRange } from '../../components/reports/ReportLayout'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { DollarSign, TrendingUp, TrendingDown, Wallet } from 'lucide-react'

const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#2563EB', '#8B5CF6']

export default function ReportsFinancial() {
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

  const { data, isLoading } = useQuery({
    queryKey: ['report-financial', startDate, endDate],
    queryFn: () => reportsApi.getFinancialSummary(startDate, endDate),
  })

  const summary = data?.data || {}
  const revenue = summary.total_revenue || 0
  const expenses = summary.total_expenses || 0
  const profit = revenue - expenses
  const profitMargin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0'

  const expenseBreakdown = summary.expense_breakdown || []
  const monthlyData = summary.monthly_data || []

  const handleExport = (format: 'pdf' | 'excel') => {
    let content = `Resumen Financiero\n`
    content += `Periodo: ${startDate} - ${endDate}\n\n`
    content += `Ingresos Totales: $${revenue.toLocaleString()}\n`
    content += `Gastos Totales: $${expenses.toLocaleString()}\n`
    content += `Ganancia Neta: $${profit.toLocaleString()}\n`
    content += `Margen: ${profitMargin}%\n\n`
    content += `Desglose de Gastos:\n`
    expenseBreakdown.forEach((item: any) => {
      content += `  ${item.category}: $${item.amount.toLocaleString()}\n`
    })
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte-financiero.${format === 'excel' ? 'txt' : 'txt'}`
    a.click()
  }

  return (
    <ReportLayout
      title="Resumen Financiero"
      subtitle="Resumen general de ingresos, gastos y ganancia"
      onExport={handleExport}
      filters={<DateRange startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Ingresos Totales" value={`$${revenue.toLocaleString()}`} icon={<DollarSign className="w-5 h-5 text-white" />} color="bg-green-500" />
        <StatCard title="Gastos Totales" value={`$${expenses.toLocaleString()}`} icon={<TrendingDown className="w-5 h-5 text-white" />} color="bg-red-500" />
        <StatCard title="Ganancia Neta" value={`$${profit.toLocaleString()}`} icon={<TrendingUp className="w-5 h-5 text-white" />} color="bg-blue-500" />
        <StatCard title="Margen de Ganancia" value={`${profitMargin}%`} icon={<Wallet className="w-5 h-5 text-white" />} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Desglose de Gastos</h3>
          {isLoading ? (
            <div className="h-80 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
          ) : expenseBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie data={expenseBreakdown} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={120} label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                  {expenseBreakdown.map((_: any, index: number) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`$${value.toLocaleString()}`]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-400">Sin datos de gastos</div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Tendencia Mensual</h3>
          {isLoading ? (
            <div className="h-80 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
          ) : monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip formatter={(value: any) => [`$${value.toLocaleString()}`]} />
                <Legend />
                <Bar dataKey="revenue" name="Ingresos" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Gastos" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-400">Sin datos mensuales</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Resumen del Periodo</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">${revenue.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">Ingresos</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-red-600">${expenses.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">Gastos</p>
          </div>
          <div className="text-center">
            <p className={`text-3xl font-bold ${profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>${profit.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">Ganancia</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">{profitMargin}%</p>
            <p className="text-sm text-gray-500 mt-1">Margen</p>
          </div>
        </div>
      </div>
    </ReportLayout>
  )
}
