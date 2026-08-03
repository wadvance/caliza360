import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { inventoryApi } from '../../services/api'
import { InventoryData } from '../../pages/Inventory'

interface Props {
  item: InventoryData | null
  onClose: () => void
  initialLocation?: string
}

const defaultData = {
  name: '', material_type: 'Caliza', unit: 'ton', location: '', current_stock: 0,
  min_stock: 0, max_stock: 0, unit_cost: 0,
}

const materialTypes = ['Caliza', 'Arena', 'Grava', 'Otros', 'Papelería', 'Documentos', 'Equipo de Oficina', 'Mobiliario']

export default function InventoryFormModal({ item, onClose, initialLocation = '' }: Props) {
  const isOffice = (item?.location === 'Oficina') || (initialLocation === 'Oficina')
  const [form, setForm] = useState(() => ({
    ...defaultData,
    material_type: isOffice ? 'Papelería' : defaultData.material_type,
    unit: isOffice ? '' : defaultData.unit,
    location: initialLocation || defaultData.location,
  }))
  const queryClient = useQueryClient()
  const isEdit = !!item

  useEffect(() => {
    if (item) setForm({
      name: item.name || item.material_type || '', material_type: item.material_type || (isOffice ? 'Papelería' : 'Caliza'), unit: item.unit || (isOffice ? '' : 'ton'), location: item.location || '',
      current_stock: item.current_stock || 0, min_stock: item.min_stock || 0,
      max_stock: item.max_stock || 0, unit_cost: item.unit_cost || 0,
    })
    else setForm({
      ...defaultData,
      material_type: isOffice ? 'Papelería' : defaultData.material_type,
      unit: isOffice ? '' : defaultData.unit,
      location: initialLocation || defaultData.location,
    })
  }, [item, initialLocation, isOffice])

  const mutation = useMutation({
    mutationFn: (data: typeof form) => isEdit
      ? inventoryApi.update(item!.id, data)
      : inventoryApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(form)
  }

  const ic = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
  const lc = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="p-5 pb-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">{isEdit ? 'Editar Artículo' : 'Nuevo Artículo'}</h2>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={lc}>Nombre *</label>
              <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={ic} placeholder={isOffice ? "Tinta Negra, Papel Bond..." : "Caliza Natural"} />
            </div>
            {!isOffice && (
              <div>
                <label className={lc}>Tipo de Material *</label>
                <select value={form.material_type} onChange={e => setForm({...form, material_type: e.target.value})} className={ic}>
                  {materialTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className={lc}>Unidad *</label>
              <input type="text" required value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className={ic} placeholder={isOffice ? "unidad, caja, resma..." : "ton"} />
            </div>
            <div className="sm:col-span-2">
              <label className={lc}>Ubicación *</label>
              <input type="text" required value={form.location} onChange={e => setForm({...form, location: e.target.value})} className={ic} placeholder="Bodega Principal / Oficina" />
            </div>
            <div>
              <label className={lc}>Stock Actual *</label>
              <input type="number" step="0.1" required value={form.current_stock} onChange={e => setForm({...form, current_stock: parseFloat(e.target.value)})} className={ic} />
            </div>
            <div>
              <label className={lc}>Stock Mínimo *</label>
              <input type="number" step="0.1" required value={form.min_stock} onChange={e => setForm({...form, min_stock: parseFloat(e.target.value)})} className={ic} />
            </div>
            <div>
              <label className={lc}>Stock Máximo *</label>
              <input type="number" step="0.1" required value={form.max_stock} onChange={e => setForm({...form, max_stock: parseFloat(e.target.value)})} className={ic} />
            </div>
            <div>
              <label className={lc}>Costo por Unidad *</label>
              <input type="number" step="0.01" required value={form.unit_cost} onChange={e => setForm({...form, unit_cost: parseFloat(e.target.value)})} className={ic} />
            </div>
          </div>
        </form>

        <div className="px-5 py-4 bg-gray-50 border-t flex justify-end gap-3 rounded-b-xl">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50">Cancelar</button>
          <button type="button" disabled={mutation.isPending} onClick={handleSubmit} className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {mutation.isPending ? 'Guardando...' : isEdit ? 'Actualizar' : 'Aceptar'}
          </button>
        </div>
      </div>
    </div>
  )
}
