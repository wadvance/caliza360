import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dispatchesApi, trucksApi, driversApi, clientsApi } from '../services/api'
import PanamaLocationSelect from '../components/PanamaLocationSelect'
import {
  Plus,
  Trash2,
  Save,
  Pencil,
  Send,
  Truck,
  Weight,
  Package,
  X,
  Gauge
} from 'lucide-react'

const statusLabels: Record<string, string> = {
  scheduled: 'Programado',
  in_transit: 'En tránsito',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

const statusColors: Record<string, string> = {
  scheduled: 'bg-gray-100 text-gray-600',
  in_transit: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

const emptyForm = {
  date: new Date().toISOString().slice(0, 10),
  truck_id: '',
  driver_id: '',
  client_id: '',
  destination_name: '',
  material_type: 'Caliza',
  planned_tons: '',
  actual_tons: '',
  sack_count: '',
  departure_datetime: '',
  delivery_datetime: '',
  status: 'scheduled',
  responsible_person: '',
  notes: '',
}

function performanceColor(p: number) {
  if (p >= 95) return 'text-green-600'
  if (p >= 80) return 'text-amber-600'
  return 'text-red-600'
}

export default function Dispatches() {
  const queryClient = useQueryClient()
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [form, setForm] = useState<any>({ ...emptyForm })
  const [editing, setEditing] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)

  const { data: dispatches, isLoading } = useQuery({
    queryKey: ['dispatches', date],
    queryFn: () => dispatchesApi.getAll({ date }).then((r) => r.data),
  })

  const { data: summary } = useQuery({
    queryKey: ['dispatches-summary', date],
    queryFn: () => dispatchesApi.getSummary(date).then((r) => r.data),
  })

  const { data: trucks } = useQuery({
    queryKey: ['trucks'],
    queryFn: () => trucksApi.getAll().then((r) => r.data),
  })

  const { data: drivers } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => driversApi.getAll().then((r) => r.data),
  })

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getAll().then((r) => r.data),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['dispatches'] })

  const save = useMutation({
    mutationFn: (data: any) =>
      editing ? dispatchesApi.update(editing.id, data) : dispatchesApi.create(data),
    onSuccess: () => {
      invalidate()
      queryClient.invalidateQueries({ queryKey: ['dispatches-summary'] })
      setShowModal(false)
      setEditing(null)
      setForm({ ...emptyForm })
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => dispatchesApi.delete(id),
    onSuccess: () => {
      invalidate()
      queryClient.invalidateQueries({ queryKey: ['dispatches-summary'] })
    },
  })

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm, date })
    setShowModal(true)
  }

  const openEdit = (d: any) => {
    setEditing(d)
    setForm({
      date: (d.date || '').slice(0, 10),
      truck_id: String(d.truck_id || ''),
      driver_id: String(d.driver_id || ''),
      client_id: d.client_id ? String(d.client_id) : '',
      destination_name: d.destination_name || '',
      material_type: d.material_type || 'Caliza',
      planned_tons: d.planned_tons ?? '',
      actual_tons: d.actual_tons ?? '',
      sack_count: d.sack_count ?? '',
      departure_datetime: d.departure_datetime ? (d.departure_datetime || '').slice(0, 16) : '',
      delivery_datetime: d.delivery_datetime ? (d.delivery_datetime || '').slice(0, 16) : '',
      status: d.status || 'scheduled',
      responsible_person: d.responsible_person || '',
      notes: d.notes || '',
    })
    setShowModal(true)
  }

  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600"
  const labelCls = "block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"

  const performance = Number(summary?.performance_percent || 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Despachos de Producción</h1>
          <p className="text-sm text-gray-500">Mercancía que sale de la planta · transporte, destino, salida y entrega</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600" />
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            <Plus className="w-4 h-4" /> Nuevo Despacho
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-5 dark:bg-gray-900 dark:border dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600"><Send className="w-5 h-5" /></div>
            <div>
              <p className="text-sm text-gray-500">Despachos del día</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{summary?.total_deliveries ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5 dark:bg-gray-900 dark:border dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-green-100 text-green-600"><Weight className="w-5 h-5" /></div>
            <div>
              <p className="text-sm text-gray-500">Toneladas (plan → real)</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {Number(summary?.planned_tons ?? 0).toLocaleString('es-MX')} → {Number(summary?.actual_tons ?? 0).toLocaleString('es-MX')}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5 dark:bg-gray-900 dark:border dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-amber-100 text-amber-600"><Package className="w-5 h-5" /></div>
            <div>
              <p className="text-sm text-gray-500">Sacos despachados</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{Number(summary?.total_sacks ?? 0).toLocaleString('es-MX')}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5 dark:bg-gray-900 dark:border dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600"><Gauge className="w-5 h-5" /></div>
            <div>
              <p className="text-sm text-gray-500">Rendimiento</p>
              <p className={`text-2xl font-bold ${performanceColor(performance)}`}>{performance.toLocaleString('es-MX')}%</p>
            </div>
          </div>
        </div>
      </div>

      {(summary?.by_destination?.length || 0) > 0 && (
        <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-900 dark:border dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" /> Rendimiento por destino
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary?.by_destination?.map((d: any, i: number) => (
              <div key={i} className="p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {d.destination_name}{d.client?.name ? ` · ${d.client.name}` : ''}
                </p>
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span><strong>{d.total_deliveries}</strong> entregas</span>
                  <span><strong className="text-green-600">{Number(d.actual_tons ?? 0).toLocaleString('es-MX')}</strong> ton</span>
                  <span className={`font-semibold ${performanceColor(Number(d.performance_percent || 0))}`}>
                    {Number(d.performance_percent || 0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden dark:bg-gray-900 dark:border dark:border-gray-800">
        <div className="px-4 py-3 border-b border-gray-200 font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-200">
          Despachos de {new Date(date + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (dispatches?.length || 0) === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            <Send className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            No hay despachos registrados para esta fecha.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="px-3 py-2">Despacho</th>
                  <th className="px-3 py-2">Transporte</th>
                  <th className="px-3 py-2">Camionero</th>
                  <th className="px-3 py-2">Destino</th>
                  <th className="px-3 py-2">Plan</th>
                  <th className="px-3 py-2">Real</th>
                  <th className="px-3 py-2 text-right">Rend. %</th>
                  <th className="px-3 py-2 text-right">Sacos</th>
                  <th className="px-3 py-2">Salida</th>
                  <th className="px-3 py-2">Entrega</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {dispatches?.map((d: any) => (
                  <tr key={d.id} className="text-sm text-gray-700 dark:text-gray-300">
                    <td className="px-3 py-3 font-medium">{d.dispatch_number}</td>
                    <td className="px-3 py-3">{d.truck?.plate || '—'}</td>
                    <td className="px-3 py-3">{d.driver?.name || '—'}</td>
                    <td className="px-3 py-3">{d.destination_name}</td>
                    <td className="px-3 py-3">{Number(d.planned_tons ?? 0).toLocaleString('es-MX')}</td>
                    <td className="px-3 py-3 font-semibold">{Number(d.actual_tons ?? 0).toLocaleString('es-MX')}</td>
                    <td className={`px-3 py-3 text-right font-semibold ${performanceColor(Number(d.performance_percent || 0))}`}>
                      {Number(d.performance_percent || 0).toLocaleString('es-MX')}%
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-amber-600">{Number(d.sack_count ?? 0).toLocaleString('es-MX')}</td>
                    <td className="px-3 py-3 text-xs">{d.departure_datetime ? new Date(d.departure_datetime).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td className="px-3 py-3 text-xs">{d.delivery_datetime ? new Date(d.delivery_datetime).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td className="px-3 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[d.status] || statusColors.scheduled}`}>
                        {statusLabels[d.status] || d.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(d)} className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg dark:hover:bg-blue-900/20" title="Editar">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { if (confirm(`¿Eliminar el despacho ${d.dispatch_number}?`)) remove.mutate(d.id) }}
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
                <Send className="w-5 h-5 text-blue-600" />
                {editing ? `Editar ${editing.dispatch_number}` : 'Nuevo Despacho de Producción'}
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
                  <label className={labelCls}>Transporte (camión) *</label>
                  <select required value={form.truck_id} onChange={e => setForm({ ...form, truck_id: e.target.value })} className={inputCls}>
                    <option value="">Seleccionar transporte</option>
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
                  <label className={labelCls}>Destino *</label>
                  <PanamaLocationSelect
                    value={form.destination_name}
                    onChange={(v) => setForm({ ...form, destination_name: v })}
                    inputCls={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Punto/Cliente (opcional)</label>
                  <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })} className={inputCls}>
                    <option value="">Sin cliente vinculado</option>
                    {(clients ?? []).map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Material *</label>
                  <input required value={form.material_type} onChange={e => setForm({ ...form, material_type: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Toneladas planificadas *</label>
                  <input required type="number" step="0.01" min="0" value={form.planned_tons} onChange={e => setForm({ ...form, planned_tons: e.target.value })} className={inputCls} placeholder="Ej. 30" />
                </div>
                <div>
                  <label className={labelCls}>Toneladas reales *</label>
                  <input required type="number" step="0.01" min="0" value={form.actual_tons} onChange={e => setForm({ ...form, actual_tons: e.target.value })} className={inputCls} placeholder="Ej. 28.5" />
                </div>
                <div>
                  <label className={labelCls}>Número de sacos</label>
                  <input type="number" min="0" value={form.sack_count} onChange={e => setForm({ ...form, sack_count: e.target.value })} className={inputCls} placeholder="Ej. 140" />
                </div>
                <div>
                  <label className={labelCls}>Fecha y hora de salida *</label>
                  <input required type="datetime-local" value={form.departure_datetime} onChange={e => setForm({ ...form, departure_datetime: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Fecha y hora de entrega</label>
                  <input type="datetime-local" value={form.delivery_datetime} onChange={e => setForm({ ...form, delivery_datetime: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Estado</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inputCls}>
                    {Object.entries(statusLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Persona responsable *</label>
                  <input required value={form.responsible_person} onChange={e => setForm({ ...form, responsible_person: e.target.value })} className={inputCls} placeholder="Quién autoriza el despacho" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Notas</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inputCls} rows={2} placeholder="Observaciones" />
                </div>
              </div>

              {save.isError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm dark:bg-red-900/30 dark:border-red-700 dark:text-red-200">
                  {(save.error as any)?.response?.data?.message || 'Error al guardar el despacho.'}
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
