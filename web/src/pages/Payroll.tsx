import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { payrollApi } from '../services/api'
import { Plus, DollarSign, Users, Clock, BadgeDollarSign } from 'lucide-react'
import PayrollTable from '../components/payroll/PayrollTable'
import PayrollFormModal from '../components/payroll/PayrollFormModal'
import ExtraPayments from '../components/payroll/ExtraPayments'

export default function Payroll() {
  const [showModal, setShowModal] = useState(false)
  const [tab, setTab] = useState<'payrolls' | 'extra'>('payrolls')
  const queryClient = useQueryClient()

  const { data: payrolls, isLoading } = useQuery({
    queryKey: ['payrolls'],
    queryFn: () => payrollApi.getAll(),
  })

  const payrollData = payrolls?.data || []
  const totalPayroll = payrollData.reduce((sum: number, p: any) => sum + (p.net_pay || 0), 0)
  const avgPerEmployee = payrollData.length > 0 ? totalPayroll / payrollData.length : 0
  const pendingPayments = payrollData.filter((p: any) => p.status === 'approved').length

  const tabCls = (active: boolean) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      active
        ? 'bg-blue-600 text-white'
        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
    }`

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nómina</h1>
        {tab === 'payrolls' && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nueva Nómina
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => setTab('payrolls')} className={tabCls(tab === 'payrolls')}>
          <span className="inline-flex items-center gap-1.5"><DollarSign className="w-4 h-4" /> Nóminas</span>
        </button>
        <button onClick={() => setTab('extra')} className={tabCls(tab === 'extra')}>
          <span className="inline-flex items-center gap-1.5"><BadgeDollarSign className="w-4 h-4" /> Pagos Extra</span>
        </button>
      </div>

      {tab === 'extra' ? (
        <ExtraPayments />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded dark:bg-gray-900-lg shadow dark:bg-gray-900 dark:border dark:border-gray-800 p-4">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-blue-100"><DollarSign className="w-5 h-5 text-blue-600" /></div>
                <div className="ml-3"><p className="text-sm text-gray-500">Total Nómina</p><p className="text-lg font-semibold">${totalPayroll.toLocaleString()}</p></div>
              </div>
            </div>
            <div className="bg-white rounded dark:bg-gray-900-lg shadow dark:bg-gray-900 dark:border dark:border-gray-800 p-4">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-green-100"><Users className="w-5 h-5 text-green-600" /></div>
                <div className="ml-3"><p className="text-sm text-gray-500">Promedio por Empleado</p><p className="text-lg font-semibold">${avgPerEmployee.toLocaleString()}</p></div>
              </div>
            </div>
            <div className="bg-white rounded dark:bg-gray-900-lg shadow dark:bg-gray-900 dark:border dark:border-gray-800 p-4">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-yellow-100"><Clock className="w-5 h-5 text-yellow-600" /></div>
                <div className="ml-3"><p className="text-sm text-gray-500">Pagos Pendientes</p><p className="text-lg font-semibold">{pendingPayments}</p></div>
              </div>
            </div>
          </div>

          <PayrollTable
            payrolls={payrollData}
            isLoading={isLoading}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ['payrolls'] })}
          />
        </>
      )}

      {showModal && (
        <PayrollFormModal onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}