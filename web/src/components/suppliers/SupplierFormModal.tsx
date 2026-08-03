import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { suppliersApi } from '../../services/api'
import { SupplierData } from '../../pages/Suppliers'

interface Props {
  supplier: SupplierData | null
  onClose: () => void
}

const defaultData = {
  name: '', company: '', rfc: '', email: '', phone: '',
  address: '', material_type: 'Combustible', payment_terms: 'Contado', notes: '',
}

export default function SupplierFormModal({ supplier, onClose }: Props) {
  const [form, setForm] = useState(defaultData)
  const queryClient = useQueryClient()
  const isEdit = !!supplier

  useEffect(() => {
    if (supplier) setForm({
      name: supplier.name || '', company: supplier.company || '', rfc: supplier.rfc || '',
      email: supplier.email || '', phone: supplier.phone || '',
      address: supplier.address || '', material_type: supplier.material_type || 'Combustible',
      payment_terms: supplier.payment_terms || 'Contado', notes: supplier.notes || '',
    })
  }, [supplier])

  const mutation = useMutation({
    mutationFn: (data: typeof form) => isEdit
      ? suppliersApi.update(supplier!.id, data)
      : suppliersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
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
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{isEdit ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
              <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={lc}>Nombre / Razón Social *</label>
                <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={ic} />
              </div>
              <div>
                <label className={lc}>Empresa</label>
                <input type="text" value={form.company} onChange={e => setForm({...form, company: e.target.value})} className={ic} />
              </div>
              <div>
                <label className={lc}>RFC</label>
                <input type="text" value={form.rfc} onChange={e => setForm({...form, rfc: e.target.value})} className={ic} maxLength={13} />
              </div>
              <div>
                <label className={lc}>Email</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={ic} />
              </div>
              <div>
                <label className={lc}>Teléfono</label>
                <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className={ic} />
              </div>
              <div className="md:col-span-2">
                <label className={lc}>Dirección</label>
                <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className={ic} />
              </div>
              <div>
                <label className={lc}>Tipo de Material</label>
                <select value={form.material_type} onChange={e => setForm({...form, material_type: e.target.value})} className={ic}>
                  <option value="Combustible">Combustible</option>
                  <option value="Llantas">Llantas</option>
                  <option value="Refacciones">Refacciones</option>
                  <option value="Caliza">Caliza</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <label className={lc}>Condiciones de Pago</label>
                <select value={form.payment_terms} onChange={e => setForm({...form, payment_terms: e.target.value})} className={ic}>
                  <option value="Contado">Contado</option>
                  <option value="15 días">15 días</option>
                  <option value="30 días">30 días</option>
                  <option value="60 días">60 días</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={lc}>Notas</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className={ic} rows={3} />
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