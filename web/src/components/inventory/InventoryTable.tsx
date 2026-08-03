import { Edit2, Trash2, ArrowDownCircle, ArrowUpCircle, Package, AlertTriangle } from 'lucide-react'
import { InventoryData } from '../../pages/Inventory'

interface Props {
  inventory: InventoryData[]
  isLoading: boolean
  onEdit: (item: InventoryData) => void
  onDelete: (id: string) => void
  onEntry: (item: InventoryData) => void
  onExit: (item: InventoryData) => void
}

const statusConfig: Record<string, { color: string; text: string }> = {
  normal: { color: 'bg-green-100 text-green-800', text: 'Normal' },
  low: { color: 'bg-yellow-100 text-yellow-800', text: 'Bajo' },
  critical: { color: 'bg-red-100 text-red-800', text: 'Crítico' },
}

export default function InventoryTable({ inventory, isLoading, onEdit, onDelete, onEntry, onExit }: Props) {
  const totalStock = inventory.reduce((sum, i) => sum + (i.current_stock || 0), 0)
  const totalValue = inventory.reduce((sum, i) => sum + (i.current_stock || 0) * (i.unit_cost || 0), 0)
  const lowStock = inventory.filter(i => i.current_stock <= i.min_stock).length

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-blue-100"><Package className="w-5 h-5 text-blue-600" /></div>
            <div className="ml-3"><p className="text-sm text-gray-500">Stock Total</p><p className="text-lg font-semibold">{totalStock.toLocaleString()}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-green-100"><Package className="w-5 h-5 text-green-600" /></div>
            <div className="ml-3"><p className="text-sm text-gray-500">Valor Total</p><p className="text-lg font-semibold">${totalValue.toLocaleString()}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-red-100"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
            <div className="ml-3"><p className="text-sm text-gray-500">Stock Bajo</p><p className="text-lg font-semibold">{lowStock}</p></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" /></div>
        ) : inventory.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No hay items en el inventario</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Nombre', 'Tipo', 'Ubicación', 'Stock', 'Mínimo', 'Máximo', 'Costo/U', 'Estado', 'Acciones'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventory.map((item) => {
                  const s = statusConfig[item.status] || statusConfig.normal
                  const unit = item.unit || 'ton'
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name || item.material_type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.material_type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.location}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.current_stock?.toLocaleString()} {unit}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.min_stock?.toLocaleString()} {unit}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.max_stock?.toLocaleString()} {unit}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.unit_cost?.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${s.color}`}>{s.text}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-1">
                          <button onClick={() => onEntry(item)} className="text-green-600 hover:text-green-900" title="Entrada">
                            <ArrowDownCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => onExit(item)} className="text-orange-600 hover:text-orange-900" title="Salida">
                            <ArrowUpCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => onEdit(item)} className="text-blue-600 hover:text-blue-900"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => onDelete(item.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
