import { useNavigate } from 'react-router-dom'
import { BarChart3, TrendingUp, Fuel, DollarSign, Truck, Users, Package, FileText, Brain, Route } from 'lucide-react'

const reports = [
  { id: 'tons-by-client', title: 'Toneladas por Cliente', desc: 'Análisis de toneladas transportadas por cliente', icon: BarChart3, color: 'bg-blue-100 text-blue-600' },
  { id: 'profitability', title: 'Rentabilidad por Viaje', desc: 'Ingresos, costos y ganancia por viaje', icon: TrendingUp, color: 'bg-green-100 text-green-600' },
  { id: 'fuel-consumption', title: 'Consumo de Combustible', desc: 'Análisis de consumo por camión y ruta', icon: Fuel, color: 'bg-yellow-100 text-yellow-600' },
  { id: 'operation-costs', title: 'Costos de Operación', desc: 'Desglose de costos operativos', icon: DollarSign, color: 'bg-red-100 text-red-600' },
  { id: 'financial', title: 'Resumen Financiero', desc: 'Resumen general de finanzas', icon: FileText, color: 'bg-purple-100 text-purple-600' },
  { id: 'truck-performance', title: 'Rendimiento de Camiones', desc: 'Productividad y eficiencia por camión', icon: Truck, color: 'bg-indigo-100 text-indigo-600' },
  { id: 'driver-performance', title: 'Rendimiento de Conductores', desc: 'Productividad y eficiencia por conductor', icon: Users, color: 'bg-pink-100 text-pink-600' },
  { id: 'material-report', title: 'Reporte por Material', desc: 'Ventas por tipo de material', icon: Package, color: 'bg-teal-100 text-teal-600' },
  { id: 'inventory-report', title: 'Reporte de Inventario', desc: 'Estado actual del inventario', icon: Package, color: 'bg-orange-100 text-orange-600' },
  { id: 'maintenance', title: 'Predicción de Mantenimiento', desc: 'IA: Predicción de mantenimiento por kilometraje', icon: Brain, color: 'bg-violet-100 text-violet-600' },
  { id: 'route-optimizer', title: 'Optimizador de Rutas', desc: 'IA: Mejor ruta, costo y horario para viajes', icon: Route, color: 'bg-cyan-100 text-cyan-600' },
]

export default function Reports() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reportes</h1>
        <p className="text-gray-500">Selecciona un reporte para ver el análisis detallado</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <div
            key={report.id}
            onClick={() => navigate(`/reports/${report.id}`)}
            className="bg-white rounded dark:bg-gray-900-lg shadow dark:bg-gray-900 dark:border dark:border-gray-800 p-6 hover:shadow-lg transition-all cursor-pointer border border-transparent hover:border-blue-200 group"
          >
            <div className="flex items-center mb-4">
              <div className={`p-3 rounded-full ${report.color} group-hover:scale-110 transition-transform`}>
                <report.icon className="w-6 h-6" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">{report.title}</h3>
            </div>
            <p className="text-gray-500 text-sm">{report.desc}</p>
            <div className="mt-4 text-sm text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              Ver reporte →
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
