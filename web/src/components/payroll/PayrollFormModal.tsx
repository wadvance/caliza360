import { useState } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { payrollApi, driversApi } from '../../services/api'

interface Props {
  onClose: () => void
}

const defaultData = {
  driver_id: '',
  period: '',
  start_date: '',
  end_date: '',
  base_salary: 0,
  overtime_hours: 0,
  overtime_rate: 50,
  bonuses: 0,
  deductions: 0,
}

export default function PayrollFormModal({ onClose }: Props) {
  const [form, setForm] = useState(defaultData)
  const queryClient = useQueryClient()

  const { data: drivers } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => driversApi.getAll(),
  })

  const mutation = useMutation({
    mutationFn: (data: any) => payrollApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrolls'] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const overtimePay = form.overtime_hours * form.overtime_rate
    const taxes = (form.base_salary + overtimePay + form.bonuses) * 0.16
    const netPay = form.base_salary + overtimePay + form.bonuses - form.deductions - taxes
    mutation.mutate({ ...form, overtime_pay: overtimePay, taxes, net_pay: netPay })
  }

  const overtimePay = form.overtime_hours * form.overtime_rate
  const taxes = (form.base_salary + overtimePay + form.bonuses) * 0.16
  const netPay = form.base_salary + overtimePay + form.bonuses - form.deductions - taxes

  const ic = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
  const lc = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Nueva Nómina</h2>
              <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={lc}>Empleado *</label>
                <select required value={form.driver_id} onChange={e => setForm({...form, driver_id: e.target.value})} className={ic}>
                  <option value="">Seleccionar empleado</option>
                  {drivers?.data?.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={lc}>Periodo *</label>
                <input type="text" required value={form.period} onChange={e => setForm({...form, period: e.target.value})} className={ic} placeholder="Ej: Enero 2026" />
              </div>
              <div>
                <label className={lc}>Fecha Inicio *</label>
                <input type="date" required value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className={ic} />
              </div>
              <div>
                <label className={lc}>Fecha Fin *</label>
                <input type="date" required value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className={ic} />
              </div>
              <div>
                <label className={lc}>Salario Base *</label>
                <input type="number" required value={form.base_salary} onChange={e => setForm({...form, base_salary: parseFloat(e.target.value)})} className={ic} />
              </div>
              <div>
                <label className={lc}>Horas Extra</label>
                <input type="number" value={form.overtime_hours} onChange={e => setForm({...form, overtime_hours: parseFloat(e.target.value)})} className={ic} />
              </div>
              <div>
                <label className={lc}>Tarifa Hora Extra</label>
                <input type="number" value={form.overtime_rate} onChange={e => setForm({...form, overtime_rate: parseFloat(e.target.value)})} className={ic} />
              </div>
              <div>
                <label className={lc}>Bonificaciones</label>
                <input type="number" value={form.bonuses} onChange={e => setForm({...form, bonuses: parseFloat(e.target.value)})} className={ic} />
              </div>
              <div>
                <label className={lc}>Deducciones</label>
                <input type="number" value={form.deductions} onChange={e => setForm({...form, deductions: parseFloat(e.target.value)})} className={ic} />
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Resumen de Cálculo</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Horas Extra:</span><span>+${overtimePay.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Impuestos (16%):</span><span className="text-red-600">-${taxes.toLocaleString()}</span></div>
                <div className="flex justify-between col-span-2 border-t pt-2 mt-2"><span className="font-semibold">Neto:</span><span className="font-semibold text-green-600">${netPay.toLocaleString()}</span></div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3 rounded-b-xl">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={mutation.isPending} className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {mutation.isPending ? 'Guardando...' : 'Crear Nómina'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}