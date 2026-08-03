import { useMutation, useQueryClient } from '@tanstack/react-query'
import { payrollApi } from '../../services/api'
import { Edit2, CheckCircle, DollarSign } from 'lucide-react'

interface Props {
  payrolls: any[]
  isLoading: boolean
  onRefresh: () => void
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  approved: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
}

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  approved: 'Aprobado',
  paid: 'Pagado',
}

export default function PayrollTable({ payrolls, isLoading, onRefresh }: Props) {
  const queryClient = useQueryClient()

  const approveMutation = useMutation({
    mutationFn: (id: string) => payrollApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrolls'] })
      onRefresh()
    },
  })

  const payMutation = useMutation({
    mutationFn: (id: string) => payrollApi.markAsPaid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrolls'] })
      onRefresh()
    },
  })

  const handleApprove = (id: string) => {
    if (confirm('¿Aprobar esta nómina?')) {
      approveMutation.mutate(id)
    }
  }

  const handlePay = (id: string) => {
    if (confirm('¿Marcar como pagada?')) {
      payMutation.mutate(id)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {isLoading ? (
        <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" /></div>
      ) : payrolls.length === 0 ? (
        <div className="p-8 text-center text-gray-500">No hay registros de nómina</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Empleado', 'Periodo', 'Salario Base', 'Horas Extra', 'Bonificaciones', 'Deducciones', 'Neto', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payrolls.map((payroll: any) => (
                <tr key={payroll.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-medium">
                        {payroll.driver_name?.charAt(0) || payroll.driver?.name?.charAt(0) || 'E'}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{payroll.driver_name || payroll.driver?.name || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{payroll.period || 'N/A'}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">${payroll.base_salary?.toLocaleString() || '0'}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{payroll.overtime_hours || 0}h</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600">+${payroll.bonuses?.toLocaleString() || '0'}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600">-${payroll.deductions?.toLocaleString() || '0'}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">${payroll.net_pay?.toLocaleString() || '0'}</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[payroll.status] || 'bg-gray-100 text-gray-800'}`}>
                      {statusLabels[payroll.status] || payroll.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {payroll.status === 'draft' && (
                        <button onClick={() => handleApprove(payroll.id)} className="text-blue-600 hover:text-blue-900" title="Aprobar">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {payroll.status === 'approved' && (
                        <button onClick={() => handlePay(payroll.id)} className="text-green-600 hover:text-green-900" title="Marcar como pagada">
                          <DollarSign className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}