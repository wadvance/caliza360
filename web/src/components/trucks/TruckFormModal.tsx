import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { trucksApi } from '../../services/api'
import { TruckData } from '../../pages/Trucks'

interface Props {
  truck: TruckData | null
  onClose: () => void
}

const defaultData = {
  plate: '', brand: '', model: '', year: new Date().getFullYear(),
  color: '', vin_number: '', engine_type: '', capacity: 0,
  current_mileage: 0, status: 'active',
  insurance_provider: '', insurance_policy_number: '', insurance_end_date: '',
  circulation_card_expiry: '',
}

export default function TruckFormModal({ truck, onClose }: Props) {
  const [form, setForm] = useState(defaultData)
  const queryClient = useQueryClient()
  const isEdit = !!truck

  useEffect(() => {
    if (truck) setForm({
      plate: truck.plate || '', brand: truck.brand || '', model: truck.model || '',
      year: truck.year || new Date().getFullYear(), color: truck.color || '',
      vin_number: truck.vin_number || '', engine_type: truck.engine_type || '',
      capacity: truck.capacity || 0, current_mileage: truck.current_mileage || 0,
      status: truck.status || 'active',
      insurance_provider: truck.insurance_provider || '',
      insurance_policy_number: truck.insurance_policy_number || '',
      insurance_end_date: truck.insurance_end_date || '',
      circulation_card_expiry: truck.circulation_card_expiry || '',
    })
  }, [truck])

  const mutation = useMutation({
    mutationFn: (data: typeof form) => isEdit
      ? trucksApi.update(truck!.id, data)
      : trucksApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trucks'] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(form)
  }

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{isEdit ? 'Editar Camión' : 'Nuevo Camión'}</h2>
              <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Placa *</label>
                <input type="text" required value={form.plate} onChange={e => setForm({...form, plate: e.target.value})} className={inputClass} placeholder="ABC-1234" />
              </div>
              <div>
                <label className={labelClass}>Marca *</label>
                <input type="text" required value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} className={inputClass} placeholder="Kenworth" />
              </div>
              <div>
                <label className={labelClass}>Modelo *</label>
                <input type="text" required value={form.model} onChange={e => setForm({...form, model: e.target.value})} className={inputClass} placeholder="T800" />
              </div>
              <div>
                <label className={labelClass}>Año *</label>
                <input type="number" required value={form.year} onChange={e => setForm({...form, year: parseInt(e.target.value)})} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Color</label>
                <input type="text" value={form.color} onChange={e => setForm({...form, color: e.target.value})} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>VIN</label>
                <input type="text" value={form.vin_number} onChange={e => setForm({...form, vin_number: e.target.value})} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Tipo de Motor</label>
                <input type="text" value={form.engine_type} onChange={e => setForm({...form, engine_type: e.target.value})} className={inputClass} placeholder="Diésel" />
              </div>
              <div>
                <label className={labelClass}>Capacidad (ton) *</label>
                <input type="number" step="0.1" required value={form.capacity} onChange={e => setForm({...form, capacity: parseFloat(e.target.value)})} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Kilometraje Actual</label>
                <input type="number" value={form.current_mileage} onChange={e => setForm({...form, current_mileage: parseFloat(e.target.value)})} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Estado *</label>
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className={inputClass}>
                  <option value="active">Activo</option>
                  <option value="maintenance">Mantenimiento</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Aseguradora</label>
                <input type="text" value={form.insurance_provider} onChange={e => setForm({...form, insurance_provider: e.target.value})} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>No. Póliza</label>
                <input type="text" value={form.insurance_policy_number} onChange={e => setForm({...form, insurance_policy_number: e.target.value})} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Vigencia Seguro</label>
                <input type="date" value={form.insurance_end_date} onChange={e => setForm({...form, insurance_end_date: e.target.value})} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Vigencia Tarjeta Circulación</label>
                <input type="date" value={form.circulation_card_expiry} onChange={e => setForm({...form, circulation_card_expiry: e.target.value})} className={inputClass} />
              </div>
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
