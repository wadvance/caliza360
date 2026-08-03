import { DollarSign, Edit2, CheckCircle } from 'lucide-react'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { invoicesApi } from '../../services/api'

interface Props {
  data: any[]
  type: 'receivable' | 'payable'
  isLoading: boolean
  onPay: (id: string) => void
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  partial: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  partial: 'Parcial',
  paid: 'Pagado',
  overdue: 'Vencido',
}

export default function AccountingTable({ data, type, isLoading, onPay }: Props) {
  const queryClient = useQueryClient()
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const payMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      type === 'receivable'
        ? invoicesApi.markAsPaid(id, { amount })
        : invoicesApi.markAsPaid(id, { amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts-receivable', 'accounts-payable'] })
      setSelectedId(null)
      setPaymentAmount(0)
    },
  })

  const handlePay = (id: string) => {
    setSelectedId(id)
    setPaymentAmount(0)
  }

  const confirmPay = () => {
    if (selectedId && paymentAmount > 0) {
      payMutation.mutate({ id: selectedId, amount: paymentAmount })
      onPay(selectedId)
    }
  }

  const columns = type === 'receivable'
    ? ['Cliente', 'Factura', 'Monto', 'Pagado', 'Saldo', 'Vence', 'Estado', 'Acciones']
    : ['Proveedor', 'Factura', 'Monto', 'Pagado', 'Saldo', 'Vence', 'Estado', 'Acciones']

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" /></div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No hay registros</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((item: any) => {
                  const balance = item.balance || (item.amount - item.paid_amount)
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {type === 'receivable' ? (item.client_name || item.client?.name) : (item.supplier_name || item.supplier?.name)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.invoice_number || item.invoice?.number || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.amount?.toLocaleString() || '0'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.paid_amount?.toLocaleString() || '0'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          ${balance?.toLocaleString() || '0'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.due_date ? new Date(item.due_date).toLocaleDateString('es-MX') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[item.status] || 'bg-gray-100 text-gray-800'}`}>
                          {statusLabels[item.status] || item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {item.status !== 'paid' && (
                          <button onClick={() => handlePay(item.id)} className="text-blue-600 hover:text-blue-900 flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            Registrar Pago
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Registrar Pago</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto del Pago</label>
              <input
                type="number"
                value={paymentAmount}
                onChange={e => setPaymentAmount(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                step="0.01"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setSelectedId(null)} className="px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50">
                Cancelar
              </button>
              <button
                onClick={confirmPay}
                disabled={paymentAmount <= 0 || payMutation.isPending}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {payMutation.isPending ? 'Procesando...' : 'Confirmar Pago'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}