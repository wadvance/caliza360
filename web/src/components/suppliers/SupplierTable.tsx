import { Edit2, Trash2, Package, DollarSign } from 'lucide-react'
import { SupplierData } from '../../pages/Suppliers'

interface Props {
  suppliers: SupplierData[]
  isLoading: boolean
  onEdit: (supplier: SupplierData) => void
  onDelete: (id: string) => void
}

export default function SupplierTable({ suppliers, isLoading, onEdit, onDelete }: Props) {
  const totalPurchases = suppliers.reduce((sum, s) => sum + (s.total_purchases || 0), 0)
  const totalBalance = suppliers.reduce((sum, s) => sum + (s.outstanding_balance || 0), 0)

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-blue-100"><Package className="w-5 h-5 text-blue-600" /></div>
            <div className="ml-3"><p className="text-sm text-gray-500">Total Proveedores</p><p className="text-lg font-semibold">{suppliers.length}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-green-100"><DollarSign className="w-5 h-5 text-green-600" /></div>
            <div className="ml-3"><p className="text-sm text-gray-500">Compras Totales</p><p className="text-lg font-semibold">${totalPurchases.toLocaleString()}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-orange-100"><DollarSign className="w-5 h-5 text-orange-600" /></div>
            <div className="ml-3"><p className="text-sm text-gray-500">Saldos Pendientes</p><p className="text-lg font-semibold">${totalBalance.toLocaleString()}</p></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" /></div>
        ) : suppliers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No se encontraron proveedores</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Nombre', 'Empresa', 'Material', 'Teléfono', 'Compras', 'Saldo', 'Acciones'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-medium">
                          {supplier.name?.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{supplier.name}</p>
                          <p className="text-xs text-gray-500">{supplier.rfc || 'Sin RFC'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{supplier.company || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        <Package className="w-3 h-3" />
                        {supplier.material_type || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{supplier.phone || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${supplier.total_purchases?.toLocaleString() || '0'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${supplier.outstanding_balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                        ${supplier.outstanding_balance?.toLocaleString() || '0'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button onClick={() => onEdit(supplier)} className="text-green-600 hover:text-green-900"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => onDelete(supplier.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}