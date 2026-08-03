import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { proformasApi, trucksApi, driversApi, clientsApi } from '../services/api'
import PanamaLocationSelect from '../components/PanamaLocationSelect'
import {
  Plus,
  Trash2,
  Save,
  Pencil,
  Boxes,
  Truck,
  MapPin,
  Weight,
  Package,
  X
} from 'lucide-react'

const statusLabels: Record<string, string> = {
  created: 'Creada',
  loaded: 'Cargada',
  in_transit: 'En tránsito',
  delivered: 'Entregada',
}

const statusColors: Record<string, string> = {
  created: 'bg-gray-100 text-gray-600',
  loaded: 'bg-amber-100 text-amber-700',
  in_transit: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700',
}

const emptyForm = {
  date: new Date().toISOString().slice(0, 10),
  truck_id: '',
  driver_id: '',
  client_id: '',
  origin_quarry: '',
  destination_name: 'Planta de Producción',
  material_type: 'Caliza',
  weight_tons: '',
  sack_count: '',
  gross_weight: '',
  tare_weight: '',
  notes: '',
  status: 'created',
}

export default function Proformas() {
  const queryClient = useQueryClient()
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate] = useState(today)
  const [form, setForm] = useState<any>({ ...emptyForm })
  const [editing, setEditing] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)

  const { data: proformas, isLoading } = useQuery({
    queryKey: ['proformas', date],
    queryFn: () => proformasApi.getAll({ date }).then((r) => r.data),
  })

  const { data: summary } = useQuery({
    queryKey: ['proformas-summary', date],
    queryFn: () => proformasApi.getSummary(date).then((r) => r.data),
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

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['proformas'] })

  const save = useMutation({
    mutationFn: (data: any) =>
      editing ? proformasApi.update(editing.id, data) : proformasApi.create(data),
    onSuccess: () => {
      invalidate()
      queryClient.invalidateQueries({ queryKey: ['proformas-summary'] })
      setShowModal(false)
      setEditing(null)
      setForm({ ...emptyForm })
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => proformasApi.delete(id),
    onSuccess: () => {
      invalidate()
      queryClient.invalidateQueries({ queryKey: ['proformas-summary'] })
    },
  })

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm, date })
    setShowModal(true)
  }

  const openEdit = (p: any) => {
    setEditing(p)
    setForm({
      date: (p.date || '').slice(0, 10),
      truck_id: String(p.truck_id || ''),
      driver_id: String(p.driver_id || ''),
      client_id: p.client_id ? String(p.client_id) : '',
      origin_quarry: p.origin_quarry || '',
      destination_name: p.destination_name || '',
      material_type: p.material_type || 'Caliza',
      weight_tons: p.weight_tons ?? '',
      sack_count: p.sack_count ?? '',
      gross_weight: p.gross_weight ?? '',
      tare_weight: p.tare_weight ?? '',
      notes: p.notes || '',
      status: p.status || 'created',
    })
    setShowModal(true)
  }

  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600"
  const labelCls = "block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"

  const summaryCards = [
    {
      label: 'Cargas del día',
      value: summary?.total_loads ?? 0,
      icon: Truck,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Sacos salidos',
      value: Number(summary?.total_sacks ?? 0).toLocaleString('es-MX'),
      icon: Package,
      color: 'bg-amber-100 text-amber-600',
    },
    {
      label: 'Toneladas cargadas',
      value: Number(summary?.total_tons ?? 0).toLocaleString('es-MX'),
      icon: Weight,
      color: 'bg-green-100 text-green-600',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Proformas de Carga</h1>
          <p className="text-sm text-gray-500">Carga de la cantera a la planta de producción y puntos de Panamá</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600"
          />
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Nueva Proforma
          </button>
        </div>
      </div>

      {/* Summary cards */}
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

      {/* By destination */}
      {(summary?.by_destination?.length || 0) > 0 && (
        <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-900 dark:border dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" /> Carga por destino (Puntos de Panamá)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summary?.by_destination?.map((d: any, i: number) => (
              <div key={i} className="p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {d.destination_name}{d.client?.name ? ` · ${d.client.name}` : ''}
                </p>
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span><strong className="text-gray-900 dark:text-white">{Number(d.total_loads ?? 0)}</strong> cargas</span>
                  <span><strong className="text-amber-600">{Number(d.total_sacks ?? 0).toLocaleString('es-MX')}</strong> sacos</span>
                  <span><strong className="text-green-600">{Number(d.total_tons ?? 0).toLocaleString('es-MX')}</strong> ton</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Proformas table */}
      <div className="bg-white rounded-lg shadow overflow-hidden dark:bg-gray-900 dark:border dark:border-gray-800">
        <div className="px-4 py-3 border-b border-gray-200 font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-200">
          Proformas de {new Date(date + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (proformas?.length || 0) === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            <Boxes className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            No hay proformas registradas para esta fecha.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="px-3 py-2">Proforma</th>
                  <th className="px-3 py-2">Camión</th>
                  <th className="px-3 py-2">Camionero</th>
                  <th className="px-3 py-2">Origen</th>
                  <th className="px-3 py-2">Destino</th>
                  <th className="px-3 py-2 text-right">Toneladas</th>
                  <th className="px-3 py-2 text-right">Sacos</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {proformas?.map((p: any) => (
                  <tr key={p.id} className="text-sm text-gray-700 dark:text-gray-300">
                    <td className="px-3 py-3 font-medium">{p.proforma_number}</td>
                    <td className="px-3 py-3">{p.truck?.plate || '—'}</td>
                    <td className="px-3 py-3">{p.driver?.name || '—'}</td>
                    <td className="px-3 py-3">{p.origin_quarry || '—'}</td>
                    <td className="px-3 py-3">{p.destination_name}</td>
                    <td className="px-3 py-3 text-right font-semibold">{Number(p.weight_tons ?? 0).toLocaleString('es-MX')}</td>
                    <td className="px-3 py-3 text-right font-semibold text-amber-600">{Number(p.sack_count ?? 0).toLocaleString('es-MX')}</td>
                    <td className="px-3 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[p.status] || statusColors.created}`}>
                        {statusLabels[p.status] || p.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg dark:hover:bg-blue-900/20"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { if (confirm(`¿Eliminar la proforma ${p.proforma_number}?`)) remove.mutate(p.id) }}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/20"
                          title="Eliminar"
                        >
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

      {/* Create/Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col dark:bg-gray-900 dark:border dark:border-gray-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Boxes className="w-5 h-5 text-blue-600" />
                {editing ? `Editar ${editing.proforma_number}` : 'Nueva Proforma de Carga'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => { e.preventDefault(); save.mutate(form) }}
              className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Fecha *</label>
                  <input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Camión *</label>
                  <select required value={form.truck_id} onChange={e => setForm({ ...form, truck_id: e.target.value })} className={inputCls}>
                    <option value="">Seleccionar camión</option>
                    {(trucks ?? []).map((t: any) => (
                      <option key={t.id} value={t.id}>{t.plate} {t.brand ? `· ${t.brand}` : ''}</option>
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
                  <label className={labelCls}>Cantera (origen)</label>
                  <input value={form.origin_quarry} onChange={e => setForm({ ...form, origin_quarry: e.target.value })} className={inputCls} placeholder="Ej. Cantera Cerro Azul" />
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
                  <label className={labelCls}>Toneladas cargadas *</label>
                  <input required type="number" step="0.01" min="0" value={form.weight_tons} onChange={e => setForm({ ...form, weight_tons: e.target.value })} className={inputCls} placeholder="Ej. 25.5" />
                </div>
                <div>
                  <label className={labelCls}>Número de sacos</label>
                  <input type="number" min="0" value={form.sack_count} onChange={e => setForm({ ...form, sack_count: e.target.value })} className={inputCls} placeholder="Ej. 120" />
                </div>
                <div>
                  <label className={labelCls}>Peso bruto (kg)</label>
                  <input type="number" step="0.01" min="0" value={form.gross_weight} onChange={e => setForm({ ...form, gross_weight: e.target.value })} className={inputCls} placeholder="Opcional" />
                </div>
                <div>
                  <label className={labelCls}>Peso tara (kg)</label>
                  <input type="number" step="0.01" min="0" value={form.tare_weight} onChange={e => setForm({ ...form, tare_weight: e.target.value })} className={inputCls} placeholder="Opcional" />
                </div>
                <div>
                  <label className={labelCls}>Estado</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inputCls}>
                    {Object.entries(statusLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Notas</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inputCls} rows={2} placeholder="Observaciones del supervisor" />
                </div>
              </div>

              {save.isError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm dark:bg-red-900/30 dark:border-red-700 dark:text-red-200">
                  {(save.error as any)?.response?.data?.message || 'Error al guardar la proforma.'}
                </div>
              )}
            </form>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 dark:border-gray-800">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                Cancelar
              </button>
              <button onClick={() => save.mutate(form)} disabled={save.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
                <Save className="w-4 h-4" /> {save.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
