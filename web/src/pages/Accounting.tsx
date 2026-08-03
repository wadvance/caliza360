import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoicesApi } from '../services/api'
import { DollarSign, AlertTriangle, CheckCircle } from 'lucide-react'
import AccountingTable from '../components/accounting/AccountingTable'

export default function Accounting() {
  const [activeTab, setActiveTab] = useState<'receivable' | 'payable'>('receivable')
  const queryClient = useQueryClient()

  const { data: receivable, isLoading: loadingReceivable } = useQuery({
    queryKey: ['accounts-receivable'],
    queryFn: () => invoicesApi.getAccountsReceivable(),
  })

  const { data: payable, isLoading: loadingPayable } = useQuery({
    queryKey: ['accounts-payable'],
    queryFn: () => invoicesApi.getAccountsPayable(),
  })

  const receivableData = receivable?.data || []
  const payableData = payable?.data || []
  const currentData = activeTab === 'receivable' ? receivableData : payableData
  const isLoading = activeTab === 'receivable' ? loadingReceivable : loadingPayable

  const totalPending = currentData
    .filter((a: any) => a.status === 'pending' || a.status === 'overdue')
    .reduce((sum: number, a: any) => sum + (a.balance || a.amount - a.paid_amount || 0), 0)
  const totalPaid = currentData
    .filter((a: any) => a.status === 'paid')
    .reduce((sum: number, a: any) => sum + (a.amount || 0), 0)
  const totalOverdue = currentData
    .filter((a: any) => a.status === 'overdue')
    .reduce((sum: number, a: any) => sum + (a.balance || a.amount - a.paid_amount || 0), 0)

  const handlePay = (id: string) => {
    queryClient.invalidateQueries({ queryKey: ['accounts-receivable', 'accounts-payable'] })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contabilidad</h1>

      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('receivable')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'receivable'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Cuentas por Cobrar
        </button>
        <button
          onClick={() => setActiveTab('payable')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'payable'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Cuentas por Pagar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded dark:bg-gray-900-lg shadow dark:bg-gray-900 dark:border dark:border-gray-800 p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-yellow-100"><AlertTriangle className="w-5 h-5 text-yellow-600" /></div>
            <div className="ml-3"><p className="text-sm text-gray-500">Pendiente</p><p className="text-lg font-semibold">${totalPending.toLocaleString()}</p></div>
          </div>
        </div>
        <div className="bg-white rounded dark:bg-gray-900-lg shadow dark:bg-gray-900 dark:border dark:border-gray-800 p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-green-100"><CheckCircle className="w-5 h-5 text-green-600" /></div>
            <div className="ml-3"><p className="text-sm text-gray-500">Pagado</p><p className="text-lg font-semibold">${totalPaid.toLocaleString()}</p></div>
          </div>
        </div>
        <div className="bg-white rounded dark:bg-gray-900-lg shadow dark:bg-gray-900 dark:border dark:border-gray-800 p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-red-100"><DollarSign className="w-5 h-5 text-red-600" /></div>
            <div className="ml-3"><p className="text-sm text-gray-500">Vencido</p><p className="text-lg font-semibold">${totalOverdue.toLocaleString()}</p></div>
          </div>
        </div>
      </div>

      <AccountingTable
        data={currentData}
        type={activeTab}
        isLoading={isLoading}
        onPay={handlePay}
      />
    </div>
  )
}