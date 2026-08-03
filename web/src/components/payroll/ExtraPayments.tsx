import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { extraPaymentsApi, driversApi, payrollApi } from '../../services/api'
import {
  Plus,
  Trash2,
  Save,
  Pencil,
  BadgeDollarSign,
  X,
  Users,
  Wallet
} from 'lucide-react'

const emptyForm = {
  driver_id: '',
  payroll_id: '',
  concept: '',
  description: '',
  amount: '',
  payment_date: new Date().toISOString().slice(0, 10),
  status: 'paid',
}

const statusLabels: Record<string, string> = { pending: 'Pendiente', paid: 'Pagado' }

export default function ExtraPayments() {
  const queryClient = useQueryClient()
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState<any>({ ...emptyForm })
  const [editing, setEditing] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)

  const { data: payments, isLoading } = useQuery({
    queryKey: ['extra-payments'],
    queryFn: () => extraPaymentsApi.getAll().then((r) => r.data),
  })

  const { data: summary } = useQuery({
    queryKey: ['extra-payments-summary'],
    queryFn: () => extraPaymentsApi.getSummary().then((r) => r.data),
  })

  const { data: drivers } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => driversApi.getAll().then((r) => r.data),
  })

  const { data: payrolls } = useQuery({
    queryKey: ['payrolls'],
    queryFn: () => payrollApi.getAll().then((r) => r.data),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['extra-payments'] })

  const save = useMutation({
    mutationFn: (data: any) =>
      editing ? extraPaymentsApi.update(editing.id, data) : extraPaymentsApi.create(data),
    onSuccess: () => {
      invalidate()
      queryClient.invalidateQueries({ queryKey: ['extra-payments-summary'] })
      setShowModal(false)
      setEditing(null)
      setForm({ ...emptyForm })
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => extraPaymentsApi.delete(id),
    onSuccess: () => {
      invalidate()
      queryClient.invalidateQueries({ queryKey: ['extra-payments-summary'] })
    },
  })

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm, payment_date: today })
    setShowModal(true)
  }

  const openEdit = (p: any) => {
    setEditing(p)
    setForm({
      driver_id: String(p.driver_id || ''),
      payroll_id: p.payroll_id ? String(p.payroll_id) : '',
      concept: p.concept || '',
      description: p.description || '',
      amount: p.amount ?? '',
      payment_date: (p.payment_date || '').slice(0, 10) || today,
      status: p.status || 'paid',
    })
    setShowModal(true)
  }

  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600"
  const labelCls = "block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Pagos Extra (fuera de la nómina base)</h2>
          <p className="text-sm text-gray-500">Bonos, horas extra y apoyos dentro de los parámetros de la nómina</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus className="w-4 h-4" /> Nuevo Pago Extra
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-5 dark:bg-gray-900 dark:border dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600"><BadgeDollarSign className="w-5 h-5" /></div>
            <div>
              <p className="text-sm text-gray-500">Total pagos extra</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">${Number(summary?.total_amount ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5 dark:bg-gray-900 dark:border dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-green-100 text-green-600"><Wallet className="w-5 h-5" /></div>
            <div>
              <p className="text-sm text-gray-500">Pagos registrados</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{summary?.total_payments ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5 dark:bg-gray-900 dark:border dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-amber-100 text-amber-600"><Users className="w-5 h-5" /></div>
            <div>
              <p className="text-sm text-gray-500">Conductores con pagos</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{summary?.by_driver?.length ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {summary?.by_driver?.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-900 dark:border dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" /> Resumen por conductor
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {summary.by_driver.map((d: any, i: number) => (
              <div key={i} className="p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{d.driver?.name || 'Sin asignar'}</p>
                <p className="text-sm text-gray-500">
                  <strong className="text-blue-600">${Number(d.total_amount ?? 0).toLocaleString('es-MX')}</strong> · {d.total_payments} pago(s)
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden dark:bg-gray-900 dark:border dark:border-gray-800">
        <div className="px-4 py-3 border-b border-gray-200 font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-200">
          Pagos extra registrados
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (payments?.length || 0) === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            <BadgeDollarSign className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            No hay pagos extra registrados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Conductor</th>
                  <th className="px-3 py-2">Concepto</th>
                  <th className="px-3 py-2">Período de nómina</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2 text-right">Monto</th>
                  <th className="px-3 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {payments?.map((p: any) => (
                  <tr key={p.id} className="text-sm text-gray-700 dark:text-gray-300">
                    <td className="px-3 py-3">{new Date(p.payment_date + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="px-3 py-3 font-medium">{p.driver?.name || '—'}</td>
                    <td className="px-3 py-3">
                      {p.concept}
                      {p.description && <span className="block text-xs text-gray-400 truncate max-w-xs">{p.description}</span>}
                    </td>
                    <td className="px-3 py-3 text-xs">{p.payroll?.period || '—'}</td>
                    <td className="px-3 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        p.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                      }`}>
                        {statusLabels[p.status] || p.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-green-600">${Number(p.amount ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(p)} className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg dark:hover:bg-blue-900/20" title="Editar">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { if (confirm(`¿Eliminar el pago "${p.concept}"?`)) remove.mutate(p.id) }}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/20" title="Eliminar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col dark:bg-gray-900 dark:border dark:border-gray-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <BadgeDollarSign className="w-5 h-5 text-blue-600" />
                {editing ? 'Editar Pago Extra' : 'Nuevo Pago Extra'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); save.mutate(form) }} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Conductor *</label>
                  <select required value={form.driver_id} onChange={e => setForm({ ...form, driver_id: e.target.value })} className={inputCls}>
                    <option value="">Seleccionar conductor</option>
                    {(drivers ?? []).map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Período de nómina (opcional)</label>
                  <select value={form.payroll_id} onChange={e => setForm({ ...form, payroll_id: e.target.value })} className={inputCls}>
                    <option value="">Sin asignar</option>
                    {(payrolls ?? []).map((p: any) => (
                      <option key={p.id} value={p.id}>{p.period} · {p.driver?.name || ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Concepto *</label>
                  <input required value={form.concept} onChange={e => setForm({ ...form, concept: e.target.value })} className={inputCls} placeholder="Ej. Bono de producción" />
                </div>
                <div>
                  <label className={labelCls}>Monto ($) *</label>
                  <input required type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className={inputCls} placeholder="Ej. 500.00" />
                </div>
                <div>
                  <label className={labelCls}>Fecha de pago *</label>
                  <input required type="date" value={form.payment_date} onChange={e => setForm({ ...form, payment_date: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Estado *</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inputCls}>
                    <option value="paid">Pagado</option>
                    <option value="pending">Pendiente</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Descripción</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={inputCls} rows={2} placeholder="Detalle del pago extra" />
                </div>
              </div>

              {save.isError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm dark:bg-red-900/30 dark:border-red-700 dark:text-red-200">
                  {(save.error as any)?.response?.data?.message || 'Error al guardar el pago extra.'}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                  Cancelar
                </button>
                <button type="submit" disabled={save.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
                  <Save className="w-4 h-4" /> {save.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
