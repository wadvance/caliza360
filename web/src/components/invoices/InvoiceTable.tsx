import { Edit2, Trash2, FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { InvoiceData } from '../../pages/Invoices'

interface Props {
  invoices: InvoiceData[]
  isLoading: boolean
  onEdit: (invoice: InvoiceData) => void
  onDelete: (id: string) => void
}

const statusConfig: Record<string, { color: string; text: string; icon: any }> = {
  draft: { color: 'bg-gray-100 text-gray-800', text: 'Borrador', icon: FileText },
  sent: { color: 'bg-blue-100 text-blue-800', text: 'Enviada', icon: Clock },
  paid: { color: 'bg-green-100 text-green-800', text: 'Pagada', icon: CheckCircle },
  overdue: { color: 'bg-red-100 text-red-800', text: 'Vencida', icon: AlertTriangle },
  cancelled: { color: 'bg-gray-100 text-gray-800', text: 'Cancelada', icon: FileText },
}

export default function InvoiceTable({ invoices, isLoading, onEdit, onDelete }: Props) {
  const totalSales = invoices.filter(i => i.type === 'sale').reduce((sum, i) => sum + (i.total || 0), 0)
  const totalPurchases = invoices.filter(i => i.type === 'purchase').reduce((sum, i) => sum + (i.total || 0), 0)
  const overdue = invoices.filter(i => i.status === 'overdue').length

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-green-100"><FileText className="w-5 h-5 text-green-600" /></div>
            <div className="ml-3"><p className="text-sm text-gray-500">Ventas</p><p className="text-lg font-semibold">${totalSales.toLocaleString()}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-orange-100"><FileText className="w-5 h-5 text-orange-600" /></div>
            <div className="ml-3"><p className="text-sm text-gray-500">Compras</p><p className="text-lg font-semibold">${totalPurchases.toLocaleString()}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-red-100"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
            <div className="ml-3"><p className="text-sm text-gray-500">Vencidas</p><p className="text-lg font-semibold">{overdue}</p></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" /></div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No hay facturas</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Folio', 'Tipo', 'Cliente/Proveedor', 'Total', 'Fecha', 'Vencimiento', 'Estado', 'Acciones'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((inv) => {
                  const s = statusConfig[inv.status] || statusConfig.draft
                  const Icon = s.icon
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{inv.invoice_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${inv.type === 'sale' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                          {inv.type === 'sale' ? 'Venta' : 'Compra'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {inv.client?.name || inv.supplier?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${inv.total?.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inv.issue_date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inv.due_date}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${s.color}`}>{s.text}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button onClick={() => onEdit(inv)} className="text-green-600 hover:text-green-900"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => onDelete(inv.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
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
