import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../../services/api'
import ReportLayout, { StatCard } from '../../components/reports/ReportLayout'
import { Package, Boxes, DollarSign, AlertTriangle, AlertOctagon } from 'lucide-react'

export default function ReportsInventory() {
  const { data, isLoading } = useQuery({
    queryKey: ['report-inventory'],
    queryFn: () => reportsApi.getInventoryReport(),
  })

  const items = data?.data?.items || []
  const summary = data?.data?.summary || {}

  const handleExport = (format: 'pdf' | 'excel') => {
    const content = items.map((item: any) =>
      `${item.material_type}\t${item.location}\t${item.current_stock}\t${item.min_stock}\t$${item.unit_cost}\t${item.status}`
    ).join('\n')
    const header = 'Material\tUbicación\tStock Actual\tStock Mínimo\tCosto Unitario\tEstado\n'
    const blob = new Blob([header + content], { type: format === 'excel' ? 'text/tab-separated-values' : 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte-inventario.${format === 'excel' ? 'tsv' : 'txt'}`
    a.click()
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case 'critical': return 'Crítico'
      case 'low': return 'Bajo'
      default: return 'Normal'
    }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-100 text-red-700'
      case 'low': return 'bg-amber-100 text-amber-700'
      default: return 'bg-green-100 text-green-700'
    }
  }

  return (
    <ReportLayout
      title="Reporte de Inventario"
      subtitle="Estado actual del inventario de materiales"
      onExport={handleExport}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Materiales" value={summary.total_items ?? 0} icon={<Package className="w-5 h-5 text-white" />} color="bg-orange-500" />
        <StatCard title="Stock Total" value={`${Number(summary.total_stock ?? 0).toLocaleString()} u`} icon={<Boxes className="w-5 h-5 text-white" />} color="bg-blue-500" />
        <StatCard title="Valor Inventario" value={`$${Number(summary.total_value ?? 0).toLocaleString()}`} icon={<DollarSign className="w-5 h-5 text-white" />} color="bg-green-500" />
        <StatCard title="Stock Bajo" value={summary.low_stock_count ?? 0} icon={<AlertTriangle className="w-5 h-5 text-white" />} color="bg-amber-500" />
        <StatCard title="Stock Crítico" value={summary.critical_stock_count ?? 0} icon={<AlertOctagon className="w-5 h-5 text-white" />} color="bg-red-500" />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Detalle del Inventario</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Material', 'Ubicación', 'Stock Actual', 'Stock Mínimo', 'Costo Unitario', 'Valor Total', 'Estado'].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600" />
                </td>
              </tr>
            )}
            {!isLoading && items.map((item: any, i: number) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.material_type}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{item.location || '—'}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{item.current_stock}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{item.min_stock}</td>
                <td className="px-6 py-4 text-sm text-gray-900">${Number(item.unit_cost || 0).toLocaleString()}</td>
                <td className="px-6 py-4 text-sm text-gray-900">${Number((item.current_stock || 0) * (item.unit_cost || 0)).toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${statusColor(item.status)}`}>
                    {statusLabel(item.status)}
                  </span>
                </td>
              </tr>
            ))}
            {!isLoading && items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                  No hay ítems en el inventario.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ReportLayout>
  )
}
