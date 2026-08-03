import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { controlsApi, trucksApi, driversApi } from '../services/api'
import {
  Plus,
  Trash2,
  Save,
  Pencil,
  ClipboardCheck,
  Truck,
  Weight,
  X,
  User
} from 'lucide-react'

const locationLabels: Record<string, string> = { cantera: 'Cantera', planta: 'Planta de Producción' }
const typeLabels: Record<string, string> = { entrada: 'Entrada', salida: 'Salida' }

const emptyForm = {
  date: new Date().toISOString().slice(0, 16),
  location: 'cantera',
  control_type: 'salida',
  truck_id: '',
  driver_id: '',
  weight_tons: '',
  responsible_person: '',
  notes: '',
}

export default function Controls() {
  const queryClient = useQueryClient()
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [location, setLocation] = useState('')
  const [form, setForm] = useState<any>({ ...emptyForm })
  const [editing, setEditing] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)

  const { data: controls, isLoading } = useQuery({
    queryKey: ['controls', date, location],
    queryFn: () => controlsApi.getAll({ date, location: location || undefined }).then((r) => r.data),
  })

  const { data: summary } = useQuery({
    queryKey: ['controls-summary', date],
    queryFn: () => controlsApi.getSummary(date).then((r) => r.data),
  })

  const { data: trucks } = useQuery({
    queryKey: ['trucks'],
    queryFn: () => trucksApi.getAll().then((r) => r.data),
  })

  const { data: drivers } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => driversApi.getAll().then((r) => r.data),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['controls'] })

  const save = useMutation({
    mutationFn: (data: any) =>
      editing ? controlsApi.update(editing.id, data) : controlsApi.create(data),
    onSuccess: () => {
      invalidate()
      queryClient.invalidateQueries({ queryKey: ['controls-summary'] })
      setShowModal(false)
      setEditing(null)
      setForm({ ...emptyForm })
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => controlsApi.delete(id),
    onSuccess: () => {
      invalidate()
      queryClient.invalidateQueries({ queryKey: ['controls-summary'] })
    },
  })

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm, date: `${today}T${new Date().toTimeString().slice(0, 5)}` })
    setShowModal(true)
  }

  const openEdit = (c: any) => {
    setEditing(c)
    setForm({
      date: (c.date || '').slice(0, 16),
      location: c.location || 'cantera',
      control_type: c.control_type || 'salida',
      truck_id: String(c.truck_id || ''),
      driver_id: String(c.driver_id || ''),
      weight_tons: c.weight_tons ?? '',
      responsible_person: c.responsible_person || '',
      notes: c.notes || '',
    })
    setShowModal(true)
  }

  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600"
  const labelCls = "block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"

  const summaryCards = [
    { label: 'Controles del día', value: summary?.total_controls ?? 0, icon: ClipboardCheck, color: 'bg-blue-100 text-blue-600' },
    { label: 'Toneladas registradas', value: Number(summary?.total_tons ?? 0).toLocaleString('es-MX'), icon: Weight, color: 'bg-green-100 text-green-600' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Controles Cantera / Planta</h1>
          <p className="text-sm text-gray-500">Registro de entrada, salida y pesaje en cada punto con persona responsable</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600" />
          <select value={location} onChange={(e) => setLocation(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600">
            <option value="">Todas las ubicaciones</option>
            <option value="cantera">Cantera</option>
            <option value="planta">Planta de Producción</option>
          </select>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            <Plus className="w-4 h-4" /> Nuevo Control
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {(summary?.by_location?.length || 0) > 0 && (
        <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-900 dark:border dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-blue-600" /> Controles por punto
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {summary?.by_location?.map((c: any, i: number) => (
              <div key={i} className="p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {locationLabels[c.location] || c.location} · {typeLabels[c.control_type] || c.control_type}
                </p>
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span><strong className="text-gray-900 dark:text-white">{c.total_controls}</strong> controles</span>
                  <span><strong className="text-green-600">{Number(c.total_tons ?? 0).toLocaleString('es-MX')}</strong> ton</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden dark:bg-gray-900 dark:border dark:border-gray-800">
        <div className="px-4 py-3 border-b border-gray-200 font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-200">
          Registros de {new Date(date + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (controls?.length || 0) === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            <ClipboardCheck className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            No hay controles registrados para esta fecha.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="px-3 py-2">Control</th>
                  <th className="px-3 py-2">Hora</th>
                  <th className="px-3 py-2">Punto</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Camión</th>
                  <th className="px-3 py-2">Camionero</th>
                  <th className="px-3 py-2 text-right">Peso (ton)</th>
                  <th className="px-3 py-2">Responsable</th>
                  <th className="px-3 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {controls?.map((c: any) => (
                  <tr key={c.id} className="text-sm text-gray-700 dark:text-gray-300">
                    <td className="px-3 py-3 font-medium">{c.control_number}</td>
                    <td className="px-3 py-3">{new Date(c.date).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-3 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        c.location === 'cantera' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {locationLabels[c.location] || c.location}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        c.control_type === 'entrada' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {typeLabels[c.control_type] || c.control_type}
                      </span>
                    </td>
                    <td className="px-3 py-3">{c.truck?.plate || '—'}</td>
                    <td className="px-3 py-3">{c.driver?.name || '—'}</td>
                    <td className="px-3 py-3 text-right font-semibold">{Number(c.weight_tons ?? 0).toLocaleString('es-MX')}</td>
                    <td className="px-3 py-3">{c.responsible_person || '—'}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(c)} className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg dark:hover:bg-blue-900/20" title="Editar">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { if (confirm(`¿Eliminar el control ${c.control_number}?`)) remove.mutate(c.id) }}
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
                <ClipboardCheck className="w-5 h-5 text-blue-600" />
                {editing ? `Editar ${editing.control_number}` : 'Nuevo Control'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); save.mutate(form) }} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Fecha y hora *</label>
                  <input required type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Punto *</label>
                  <select value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className={inputCls}>
                    <option value="cantera">Cantera</option>
                    <option value="planta">Planta de Producción</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Tipo de control *</label>
                  <select value={form.control_type} onChange={e => setForm({ ...form, control_type: e.target.value })} className={inputCls}>
                    <option value="entrada">Entrada</option>
                    <option value="salida">Salida</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Camión *</label>
                  <select required value={form.truck_id} onChange={e => setForm({ ...form, truck_id: e.target.value })} className={inputCls}>
                    <option value="">Seleccionar camión</option>
                    {(trucks ?? []).map((t: any) => (
                      <option key={t.id} value={t.id}>{t.plate}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Camionero *</label>
                  <select required value={form.driver_id} onChange={e => setForm({ ...form, driver_id: e.target.value })} className={inputCls}>
                    <option value="">Seleccionar camionero</option>
                    {(drivers ?? []).map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Peso (toneladas) *</label>
                  <input required type="number" step="0.01" min="0" value={form.weight_tons} onChange={e => setForm({ ...form, weight_tons: e.target.value })} className={inputCls} placeholder="Ej. 26.3" />
                </div>
                <div>
                  <label className={labelCls}>Persona responsable *</label>
                  <input required value={form.responsible_person} onChange={e => setForm({ ...form, responsible_person: e.target.value })} className={inputCls} placeholder="Nombre del responsable" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Notas</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inputCls} rows={2} placeholder="Observaciones" />
                </div>
              </div>

              {save.isError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm dark:bg-red-900/30 dark:border-red-700 dark:text-red-200">
                  {(save.error as any)?.response?.data?.message || 'Error al guardar el control.'}
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
