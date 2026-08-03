import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { clientsApi } from '../../services/api'
import { ClientData } from '../../pages/Clients'

interface Props {
  client: ClientData | null
  onClose: () => void
}

const defaultData = {
  name: '', company: '', rfc: '', email: '', phone: '',
  address_street: '', address_number: '', address_colony: '',
  address_city: '', address_state: '', contact_person: '',
  payment_terms: 'Contado', credit_limit: 0, notes: '',
}

export default function ClientFormModal({ client, onClose }: Props) {
  const [form, setForm] = useState(defaultData)
  const queryClient = useQueryClient()
  const isEdit = !!client

  useEffect(() => {
    if (client) setForm({
      name: client.name || '', company: client.company || '', rfc: client.rfc || '',
      email: client.email || '', phone: client.phone || '',
      address_street: client.address_street || '', address_number: client.address_number || '',
      address_colony: client.address_colony || '', address_city: client.address_city || '',
      address_state: client.address_state || '', contact_person: client.contact_person || '',
      payment_terms: client.payment_terms || 'Contado', credit_limit: client.credit_limit || 0, notes: '',
    })
  }, [client])

  const mutation = useMutation({
    mutationFn: (data: typeof form) => isEdit
      ? clientsApi.update(client!.id, data)
      : clientsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
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
              <h2 className="text-xl font-bold text-gray-900">{isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
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
              <div>
                <label className={lc}>Contacto</label>
                <input type="text" value={form.contact_person} onChange={e => setForm({...form, contact_person: e.target.value})} className={ic} />
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
              <div>
                <label className={lc}>Límite de Crédito</label>
                <input type="number" value={form.credit_limit} onChange={e => setForm({...form, credit_limit: parseFloat(e.target.value)})} className={ic} />
              </div>
              <div className="md:col-span-2 border-t pt-4 mt-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Dirección</h3>
              </div>
              <div className="md:col-span-2">
                <label className={lc}>Calle</label>
                <input type="text" value={form.address_street} onChange={e => setForm({...form, address_street: e.target.value})} className={ic} />
              </div>
              <div>
                <label className={lc}>Número</label>
                <input type="text" value={form.address_number} onChange={e => setForm({...form, address_number: e.target.value})} className={ic} />
              </div>
              <div>
                <label className={lc}>Colonia</label>
                <input type="text" value={form.address_colony} onChange={e => setForm({...form, address_colony: e.target.value})} className={ic} />
              </div>
              <div>
                <label className={lc}>Ciudad</label>
                <input type="text" value={form.address_city} onChange={e => setForm({...form, address_city: e.target.value})} className={ic} />
              </div>
              <div>
                <label className={lc}>Estado</label>
                <input type="text" value={form.address_state} onChange={e => setForm({...form, address_state: e.target.value})} className={ic} />
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
