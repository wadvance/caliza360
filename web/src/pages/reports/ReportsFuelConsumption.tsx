import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../../services/api'
import ReportLayout, { StatCard, DateRange } from '../../components/reports/ReportLayout'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Fuel, TrendingDown, Truck, DollarSign } from 'lucide-react'

export default function ReportsFuelConsumption() {
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

  const { data, isLoading } = useQuery({
    queryKey: ['report-fuel', startDate, endDate],
    queryFn: () => reportsApi.getFuelConsumption(startDate, endDate),
  })

  const chartData = data?.data?.data || []
  const totalFuel = chartData.reduce((sum: number, item: any) => sum + (item.fuel_consumed || 0), 0)
  const totalKm = chartData.reduce((sum: number, item: any) => sum + (item.total_km || 0), 0)
  const avgKmPerLiter = totalFuel > 0 ? (totalKm / totalFuel).toFixed(1) : '0'
  const totalFuelCost = chartData.reduce((sum: number, item: any) => sum + (item.fuel_cost || 0), 0)

  const handleExport = (format: 'pdf' | 'excel') => {
    const content = chartData.map((item: any) => 
      `${item.truck_plate}\t${item.fuel_consumed}L\t${item.total_km}km\t${item.km_per_liter}km/L\t$${item.fuel_cost}`
    ).join('\n')
    const header = 'Camión\tCombustible\tKilómetros\tRendimiento\tCosto\n'
    const blob = new Blob([header + content], { type: 'text/tab-separated-values' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte-combustible.${format === 'excel' ? 'tsv' : 'txt'}`
    a.click()
  }

  return (
    <ReportLayout
      title="Consumo de Combustible"
      subtitle="Análisis de consumo por camión y eficiencia de flota"
      onExport={handleExport}
      filters={<DateRange startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Combustible Total" value={`${totalFuel.toLocaleString()} L`} icon={<Fuel className="w-5 h-5 text-white" />} color="bg-yellow-500" />
        <StatCard title="Kilómetros Totales" value={`${totalKm.toLocaleString()} km`} icon={<Truck className="w-5 h-5 text-white" />} color="bg-blue-500" />
        <StatCard title="Rendimiento Promedio" value={`${avgKmPerLiter} km/L`} icon={<TrendingDown className="w-5 h-5 text-white" />} color="bg-green-500" />
        <StatCard title="Costo Combustible" value={`$${totalFuelCost.toLocaleString()}`} icon={<DollarSign className="w-5 h-5 text-white" />} color="bg-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Consumo por Camión</h3>
          {isLoading ? (
            <div className="h-80 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="truck_plate" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip formatter={(value: any) => [`${value} L`, 'Combustible']} />
                <Bar dataKey="fuel_consumed" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Rendimiento por Camión (km/L)</h3>
          {isLoading ? (
            <div className="h-80 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="truck_plate" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip formatter={(value: any) => [`${value} km/L`, 'Rendimiento']} />
                <Bar dataKey="km_per_liter" fill="#10B981" radius={[4, 4, 0, 0]} />
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
                {['Camión', 'Combustible (L)', 'Kilómetros', 'Rendimiento', 'Costo Total'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {chartData.map((item: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.truck_plate}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.fuel_consumed?.toLocaleString()} L</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{item.total_km?.toLocaleString()} km</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.km_per_liter >= 4 ? 'bg-green-100 text-green-800' : item.km_per_liter >= 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                      {item.km_per_liter} km/L
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">${item.fuel_cost?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ReportLayout>
  )
}
