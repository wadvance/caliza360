import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { trucksApi } from '../../services/api'
import { TruckData } from '../../pages/Trucks'
import { Wrench, Circle, Plus, Trash2, Settings2, Gauge } from 'lucide-react'

interface Props {
  truck: TruckData
  onClose: () => void
}

const statusMap: Record<string, { color: string; text: string }> = {
  active: { color: 'bg-green-100 text-green-800', text: 'Activo' },
  maintenance: { color: 'bg-yellow-100 text-yellow-800', text: 'Mantenimiento' },
  inactive: { color: 'bg-red-100 text-red-800', text: 'Inactivo' },
}

const maintStatusMap: Record<string, { color: string; text: string }> = {
  scheduled: { color: 'bg-blue-100 text-blue-800', text: 'Programado' },
  in_progress: { color: 'bg-yellow-100 text-yellow-800', text: 'En proceso' },
  completed: { color: 'bg-green-100 text-green-800', text: 'Completado' },
}

const tireStatusMap: Record<string, { color: string; text: string }> = {
  good: { color: 'bg-green-100 text-green-800', text: 'Bueno' },
  worn: { color: 'bg-yellow-100 text-yellow-800', text: 'Desgastada' },
  needs_replacement: { color: 'bg-red-100 text-red-800', text: 'Requiere cambio' },
}

const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
const labelCls = "block text-xs font-medium text-gray-600 mb-1"

interface Maintenance {
  id: string
  type: string
  description: string
  service_date: string
  mileage_at_service: number
  cost: number
  status: string
  next_mileage: number
  notes: string
}

interface Tire {
  id: string
  position: string
  brand: string
  model: string
  install_date: string
  current_mileage: number
  max_mileage: number
  pressure: number
  status: string
}

export default function TruckDetailsModal({ truck, onClose }: Props) {
  const [tab, setTab] = useState<'info' | 'maintenance' | 'tires'>('info')
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[92vh] flex flex-col">
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">{truck.plate?.charAt(0)}</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{truck.plate}</h2>
                <p className="text-gray-500">{truck.brand} {truck.model} - {truck.year}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusMap[truck.status]?.color}`}>
            {statusMap[truck.status]?.text}
          </span>
          <div className="flex gap-2 mt-4 border-b">
            <TabButton active={tab === 'info'} onClick={() => setTab('info')} icon={<Settings2 className="w-4 h-4" />} label="Información" />
            <TabButton active={tab === 'maintenance'} onClick={() => setTab('maintenance')} icon={<Wrench className="w-4 h-4" />} label="Mantenimiento" />
            <TabButton active={tab === 'tires'} onClick={() => setTab('tires')} icon={<Circle className="w-4 h-4" />} label="Llantas" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'info' && <InfoTab truck={truck} />}
          {tab === 'maintenance' && <MaintenanceTab truck={truck} />}
          {tab === 'tires' && <TiresTab truck={truck} />}
        </div>
      </div>
    </div>
  )
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 -mb-px ${active ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
      {icon}
      {label}
    </button>
  )
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-500">{label}</label>
      <p className="mt-1 text-gray-900">{value || 'N/A'}</p>
    </div>
  )
}

function InfoTab({ truck }: { truck: TruckData }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Info label="Color" value={truck.color} />
      <Info label="VIN" value={truck.vin_number} />
      <Info label="Tipo de Motor" value={truck.engine_type} />
      <Info label="Capacidad" value={`${truck.capacity} ton`} />
      <Info label="Kilometraje" value={`${truck.current_mileage?.toLocaleString()} km`} />
      <Info label="Aseguradora" value={truck.insurance_provider} />
      <Info label="No. Póliza" value={truck.insurance_policy_number} />
      <Info label="Vigencia Seguro" value={truck.insurance_end_date} />
      <Info label="Vigencia Tarjeta" value={truck.circulation_card_expiry} />
    </div>
  )
}

function MaintenanceTab({ truck }: { truck: TruckData }) {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const query = useQuery({ queryKey: ['maintenance', truck.id], queryFn: () => trucksApi.getMaintenanceHistory(truck.id) })
  const records: Maintenance[] = query.data?.data || []

  const createM = useMutation({
    mutationFn: (data: any) => trucksApi.createMaintenance(truck.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['maintenance', truck.id] }); setShowForm(false) },
  })
  const delM = useMutation({
    mutationFn: (id: string) => trucksApi.deleteMaintenance(truck.id, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['maintenance', truck.id] }),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Wrench className="w-4 h-4 text-blue-600" />Historial de Mantenimiento</h3>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Registrar
        </button>
      </div>

      {showForm && (
        <MaintenanceForm onDone={(d) => createM.mutate(d)} onCancel={() => setShowForm(false)} pending={createM.isPending} />
      )}

      {query.isLoading ? (
        <div className="text-center py-8 text-gray-400">Cargando...</div>
      ) : records.length === 0 ? (
        <div className="text-center py-8 text-gray-400">Sin registros de mantenimiento</div>
      ) : (
        <div className="space-y-2">
          {records.map(m => (
            <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-800 capitalize">{m.type.replace('_', ' ')}</p>
                <p className="text-xs text-gray-500">{m.description || 'Sin descripción'}</p>
                <p className="text-xs text-gray-400">{m.service_date || 'Sin fecha'} · {m.mileage_at_service != null ? `${m.mileage_at_service?.toLocaleString()} km` : ''} · ${m.cost?.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs rounded-full ${maintStatusMap[m.status]?.color}`}>{maintStatusMap[m.status]?.text || m.status}</span>
                <button onClick={() => delM.mutate(m.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MaintenanceForm({ onDone, onCancel, pending }: { onDone: (d: any) => void; onCancel: () => void; pending: boolean }) {
  const [form, setForm] = useState({ type: 'preventive', description: '', service_date: '', mileage_at_service: 0, cost: 0, status: 'completed' })
  const set = (k: string, v: any) => setForm({ ...form, [k]: v })
  return (
    <form onSubmit={(e) => { e.preventDefault(); onDone(form) }} className="bg-gray-50 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Tipo</label>
          <select className={inputCls} value={form.type} onChange={e => set('type', e.target.value)}>
            <option value="preventive">Preventivo</option>
            <option value="corrective">Correctivo</option>
            <option value="emergency">Emergencia</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Estado</label>
          <select className={inputCls} value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="scheduled">Programado</option>
            <option value="in_progress">En proceso</option>
            <option value="completed">Completado</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Fecha</label>
          <input type="date" className={inputCls} value={form.service_date} onChange={e => set('service_date', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Km (servicio)</label>
          <input type="number" className={inputCls} value={form.mileage_at_service} onChange={e => set('mileage_at_service', parseFloat(e.target.value))} />
        </div>
        <div>
          <label className={labelCls}>Costo ($)</label>
          <input type="number" step="0.01" className={inputCls} value={form.cost} onChange={e => set('cost', parseFloat(e.target.value))} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Descripción</label>
        <textarea className={inputCls} rows={2} value={form.description} onChange={e => set('description', e.target.value)} />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm border rounded-lg hover:bg-white">Cancelar</button>
        <button type="submit" disabled={pending} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {pending ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}

function TiresTab({ truck }: { truck: TruckData }) {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const query = useQuery({ queryKey: ['tires', truck.id], queryFn: () => trucksApi.getTires(truck.id) })
  const tires: Tire[] = query.data?.data || []

  const createT = useMutation({
    mutationFn: (data: any) => trucksApi.createTire(truck.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tires', truck.id] }); setShowForm(false) },
  })
  const delT = useMutation({
    mutationFn: (id: string) => trucksApi.deleteTire(truck.id, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tires', truck.id] }),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Circle className="w-4 h-4 text-blue-600" /> Llantas del Camión</h3>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Agregar
        </button>
      </div>

      {showForm && (
        <TireForm onDone={(d) => createT.mutate(d)} onCancel={() => setShowForm(false)} pending={createT.isPending} />
      )}

      {query.isLoading ? (
        <div className="text-center py-8 text-gray-400">Cargando...</div>
      ) : tires.length === 0 ? (
        <div className="text-center py-8 text-gray-400">Sin llantas registradas</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {tires.map((t) => {
            const remaining = t.max_mileage ? Math.max(0, t.max_mileage - t.current_mileage) : null
            return (
              <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-800">{t.position}</p>
                  <p className="text-xs text-gray-500">{t.brand} {t.model}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Gauge className="w-3 h-3" /> {t.current_mileage?.toLocaleString()} / {t.max_mileage?.toLocaleString()} km
                    {remaining != null && ` · restan ${remaining.toLocaleString()} km`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${tireStatusMap[t.status]?.color}`}>{tireStatusMap[t.status]?.text}</span>
                  <button onClick={() => delT.mutate(t.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TireForm({ onDone, onCancel, pending }: { onDone: (d: any) => void; onCancel: () => void; pending: boolean }) {
  const [form, setForm] = useState({ position: '', brand: '', model: '', install_date: '', current_mileage: 0, max_mileage: 100000, pressure: 100, status: 'good' })
  const set = (k: string, v: any) => setForm({ ...form, [k]: v })
  return (
    <form onSubmit={(e) => { e.preventDefault(); onDone(form) }} className="bg-gray-50 rounded-lg p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Posición *</label>
          <select className={inputCls} required value={form.position} onChange={e => set('position', e.target.value)}>
            <option value="">Seleccionar...</option>
            <option>Delantera Izq.</option>
            <option>Delantera Der.</option>
            <option>Trasera Izq.</option>
            <option>Trasera Der.</option>
            <option>Otro</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Marca</label>
          <input className={inputCls} value={form.brand} onChange={e => set('brand', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Modelo</label>
          <input className={inputCls} value={form.model} onChange={e => set('model', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Fecha instalación</label>
          <input type="date" className={inputCls} value={form.install_date} onChange={e => set('install_date', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Km actual</label>
          <input type="number" className={inputCls} value={form.current_mileage} onChange={e => set('current_mileage', parseFloat(e.target.value))} />
        </div>
        <div>
          <label className={labelCls}>Km máximo</label>
          <input type="number" className={inputCls} value={form.max_mileage} onChange={e => set('max_mileage', parseFloat(e.target.value))} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-white">Cancelar</button>
        <button type="submit" disabled={pending} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {pending ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}