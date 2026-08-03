import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tripsApi, driversApi, trucksApi, clientsApi } from '../../services/api'
import { TripData } from '../../pages/Trips'

interface Props {
  trip: TripData | null
  onClose: () => void
}

const defaultData = {
  driver_id: '', truck_id: '', client_id: '',
  origin_name: '', origin_address: '', origin_lat: 0, origin_lng: 0, origin_quarry: '',
  destination_name: '', destination_address: '', destination_lat: 0, destination_lng: 0, destination_client: '',
  material_type: 'Caliza', weight: 0, price_per_ton: 0,
  scheduled_date: '', scheduled_time: '08:00', status: 'scheduled',
}

export default function TripFormModal({ trip, onClose }: Props) {
  const [form, setForm] = useState(defaultData)
  const queryClient = useQueryClient()
  const isEdit = !!trip

  const { data: drivers } = useQuery({ queryKey: ['drivers'], queryFn: () => driversApi.getAll() })
  const { data: trucks } = useQuery({ queryKey: ['trucks'], queryFn: () => trucksApi.getAll() })
  const { data: clients } = useQuery({ queryKey: ['clients'], queryFn: () => clientsApi.getAll() })

  useEffect(() => {
    if (trip) setForm({
      driver_id: trip.driver_id || '', truck_id: trip.truck_id || '', client_id: trip.client_id || '',
      origin_name: trip.origin_name || '', origin_address: trip.origin_address || '',
      origin_lat: trip.origin_lat || 0, origin_lng: trip.origin_lng || 0, origin_quarry: trip.origin_quarry || '',
      destination_name: trip.destination_name || '', destination_address: trip.destination_address || '',
      destination_lat: trip.destination_lat || 0, destination_lng: trip.destination_lng || 0,
      destination_client: trip.destination_client || '',
      material_type: trip.material_type || 'Caliza', weight: trip.weight || 0,
      price_per_ton: trip.price_per_ton || 0,
      scheduled_date: trip.scheduled_date || '', scheduled_time: trip.scheduled_time || '08:00',
      status: trip.status || 'scheduled',
    })
  }, [trip])

  const mutation = useMutation({
    mutationFn: (data: typeof form) => isEdit
      ? tripsApi.update(trip!.id, data)
      : tripsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(form)
  }

  const ic = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
  const lc = "block text-sm font-medium text-gray-700 mb-1"

  const driverList = drivers?.data || []
  const truckList = trucks?.data?.filter((t: any) => t.status === 'active') || []
  const clientList = clients?.data || []

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{isEdit ? 'Editar Viaje' : 'Nuevo Viaje'}</h2>
              <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={lc}>Conductor *</label>
                <select required value={form.driver_id} onChange={e => setForm({...form, driver_id: e.target.value})} className={ic}>
                  <option value="">Seleccionar conductor</option>
                  {driverList.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className={lc}>Camión *</label>
                <select required value={form.truck_id} onChange={e => setForm({...form, truck_id: e.target.value})} className={ic}>
                  <option value="">Seleccionar camión</option>
                  {truckList.map((t: any) => <option key={t.id} value={t.id}>{t.plate} - {t.brand}</option>)}
                </select>
              </div>
              <div>
                <label className={lc}>Cliente *</label>
                <select required value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} className={ic}>
                  <option value="">Seleccionar cliente</option>
                  {clientList.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={lc}>Tipo de Material *</label>
                <select value={form.material_type} onChange={e => setForm({...form, material_type: e.target.value})} className={ic}>
                  <option value="Caliza">Caliza</option>
                  <option value="Arena">Arena</option>
                  <option value="Grava">Grava</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
              <div>
                <label className={lc}>Fecha *</label>
                <input type="date" required value={form.scheduled_date} onChange={e => setForm({...form, scheduled_date: e.target.value})} className={ic} />
              </div>
              <div>
                <label className={lc}>Hora *</label>
                <input type="time" required value={form.scheduled_time} onChange={e => setForm({...form, scheduled_time: e.target.value})} className={ic} />
              </div>

              <div className="md:col-span-2 border-t pt-4 mt-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Origen</h3>
              </div>
              <div>
                <label className={lc}>Nombre del Lugar *</label>
                <input type="text" required value={form.origin_name} onChange={e => setForm({...form, origin_name: e.target.value})} className={ic} placeholder="Cantera Norte" />
              </div>
              <div>
                <label className={lc}>Dirección *</label>
                <input type="text" required value={form.origin_address} onChange={e => setForm({...form, origin_address: e.target.value})} className={ic} />
              </div>

              <div className="md:col-span-2 border-t pt-4 mt-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Destino</h3>
              </div>
              <div>
                <label className={lc}>Nombre del Lugar *</label>
                <input type="text" required value={form.destination_name} onChange={e => setForm({...form, destination_name: e.target.value})} className={ic} placeholder="Obra Cliente ABC" />
              </div>
              <div>
                <label className={lc}>Dirección *</label>
                <input type="text" required value={form.destination_address} onChange={e => setForm({...form, destination_address: e.target.value})} className={ic} />
              </div>

              <div className="md:col-span-2 border-t pt-4 mt-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Peso y Precio</h3>
              </div>
              <div>
                <label className={lc}>Peso (ton) *</label>
                <input type="number" step="0.1" required value={form.weight} onChange={e => setForm({...form, weight: parseFloat(e.target.value)})} className={ic} />
              </div>
              <div>
                <label className={lc}>Precio por Tonelada *</label>
                <input type="number" step="0.01" required value={form.price_per_ton} onChange={e => setForm({...form, price_per_ton: parseFloat(e.target.value)})} className={ic} />
              </div>

              <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Estimado:</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${((form.weight || 0) * (form.price_per_ton || 0)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>

              {isEdit && (
                <div>
                  <label className={lc}>Estado</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className={ic}>
                    <option value="scheduled">Programado</option>
                    <option value="in_transit">En Tránsito</option>
                    <option value="delivered">Entregado</option>
                    <option value="returned">Regresado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3 rounded-b-xl">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={mutation.isPending} className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {mutation.isPending ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
