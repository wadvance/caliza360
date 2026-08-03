import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pettyCashApi } from '../services/api'
import {
  Plus,
  Trash2,
  Save,
  Pencil,
  Wallet,
  TrendingUp,
  TrendingDown,
  X,
  Scale
} from 'lucide-react'

const categoryLabels: Record<string, string> = {
  fondo_inicial: 'Fondo inicial',
  viaticos: 'Viáticos',
  combustible: 'Combustible',
  utiles_oficina: 'Útiles de oficina',
  mantenimiento: 'Mantenimiento',
  compras_menores: 'Compras menores',
  otros: 'Otros',
}

const emptyForm = {
  date: new Date().toISOString().slice(0, 10),
  concept: '',
  type: 'salida',
  amount: '',
  category: 'otros',
  responsible_person: '',
  reference: '',
  notes: '',
}

export default function PettyCash() {
  const queryClient = useQueryClient()
  const today = new Date().toISOString().slice(0, 10)
  const [type, setType] = useState('')
  const [category, setCategory] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [form, setForm] = useState<any>({ ...emptyForm })
  const [editing, setEditing] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)

  const { data: movements, isLoading } = useQuery({
    queryKey: ['petty-cash', type, category, startDate, endDate],
    queryFn: () => pettyCashApi.getAll({
      type: type || undefined,
      category: category || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    }).then((r) => r.data),
  })

  const { data: summary } = useQuery({
    queryKey: ['petty-cash-summary', startDate, endDate],
    queryFn: () => pettyCashApi.getSummary({
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    }).then((r) => r.data),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['petty-cash'] })

  const save = useMutation({
    mutationFn: (data: any) =>
      editing ? pettyCashApi.update(editing.id, data) : pettyCashApi.create(data),
    onSuccess: () => {
      invalidate()
      queryClient.invalidateQueries({ queryKey: ['petty-cash-summary'] })
      setShowModal(false)
      setEditing(null)
      setForm({ ...emptyForm })
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => pettyCashApi.delete(id),
    onSuccess: () => {
      invalidate()
      queryClient.invalidateQueries({ queryKey: ['petty-cash-summary'] })
    },
  })

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm, date: today })
    setShowModal(true)
  }

  const openEdit = (c: any) => {
    setEditing(c)
    setForm({
      date: (c.date || '').slice(0, 10) || today,
      concept: c.concept || '',
      type: c.type || 'salida',
      amount: c.amount ?? '',
      category: c.category || 'otros',
      responsible_person: c.responsible_person || '',
      reference: c.reference || '',
      notes: c.notes || '',
    })
    setShowModal(true)
  }

  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600"
  const labelCls = "block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"

  const summaryCards = [
    { label: 'Saldo actual', value: `$${Number(summary?.balance ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, color: Number(summary?.balance ?? 0) >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600', icon: Scale },
    { label: 'Entradas', value: `$${Number(summary?.total_entradas ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, color: 'bg-green-100 text-green-600', icon: TrendingUp },
    { label: 'Salidas', value: `$${Number(summary?.total_salidas ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, color: 'bg-red-100 text-red-600', icon: TrendingDown },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Caja Menuda</h1>
          <p className="text-sm text-gray-500">Control de fondos menores: entradas, salidas y saldo disponible</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select value={type} onChange={(e) => setType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600">
            <option value="">Todos los tipos</option>
            <option value="entrada">Entrada</option>
            <option value="salida">Salida</option>
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600">
            <option value="">Todas las categorías</option>
            {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            <Plus className="w-4 h-4" /> Registrar Movimiento
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryCards.map((c) => {
          const Icon = c.icon
          return (
            <div key={c.label} className="bg-white rounded-lg shadow p-5 dark:bg-gray-900 dark:border dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${c.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{c.label}</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{c.value}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Desde</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600" />
          <span>Hasta</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden dark:bg-gray-900 dark:border dark:border-gray-800">
        <div className="px-4 py-3 border-b border-gray-200 font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-200">
          Movimientos de caja {summary?.total_movements != null && `(${summary.total_movements})`}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (movements?.length || 0) === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            <Wallet className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            No hay movimientos registrados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Concepto</th>
                  <th className="px-3 py-2">Categoría</th>
                  <th className="px-3 py-2">Responsable</th>
                  <th className="px-3 py-2 text-right">Monto</th>
                  <th className="px-3 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {movements?.map((c: any) => (
                  <tr key={c.id} className="text-sm text-gray-700 dark:text-gray-300">
                    <td className="px-3 py-3">{new Date(c.date + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</td>
                    <td className="px-3 py-3">
                      <span className="font-medium">{c.concept}</span>
                      {c.reference && <span className="block text-xs text-gray-400">Ref: {c.reference}</span>}
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {categoryLabels[c.category] || c.category || '—'}
                      </span>
                    </td>
                    <td className="px-3 py-3">{c.responsible_person || '—'}</td>
                    <td className={`px-3 py-3 text-right font-semibold ${c.type === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                      {c.type === 'entrada' ? '+' : '−'}${Number(c.amount ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(c)} className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg dark:hover:bg-blue-900/20" title="Editar">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { if (confirm(`¿Eliminar el movimiento "${c.concept}"?`)) remove.mutate(c.id) }}
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
                <Wallet className="w-5 h-5 text-blue-600" />
                {editing ? 'Editar Movimiento' : 'Registrar Movimiento de Caja'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); save.mutate(form) }} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Fecha *</label>
                  <input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Tipo *</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className={inputCls}>
                    <option value="salida">Salida (egreso)</option>
                    <option value="entrada">Entrada (ingreso)</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Concepto *</label>
                  <input required value={form.concept} onChange={e => setForm({ ...form, concept: e.target.value })} className={inputCls} placeholder="Ej. Compra de café y agua para oficina" />
                </div>
                <div>
                  <label className={labelCls}>Monto ($) *</label>
                  <input required type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className={inputCls} placeholder="Ej. 85.50" />
                </div>
                <div>
                  <label className={labelCls}>Categoría</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={inputCls}>
                    {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Persona responsable</label>
                  <input value={form.responsible_person} onChange={e => setForm({ ...form, responsible_person: e.target.value })} className={inputCls} placeholder="Quién autorizó o recibió" />
                </div>
                <div>
                  <label className={labelCls}>Referencia (recibo, factura)</label>
                  <input value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} className={inputCls} placeholder="Ej. Recibo #1234" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Notas</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inputCls} rows={2} placeholder="Observaciones" />
                </div>
              </div>

              {save.isError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm dark:bg-red-900/30 dark:border-red-700 dark:text-red-200">
                  {(save.error as any)?.response?.data?.message || 'Error al guardar el movimiento.'}
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
