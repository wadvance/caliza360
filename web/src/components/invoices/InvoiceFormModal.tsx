import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { invoicesApi, clientsApi, suppliersApi } from '../../services/api'
import { InvoiceData } from '../../pages/Invoices'

interface Props {
  invoice: InvoiceData | null
  onClose: () => void
}

interface InvoiceItem {
  description: string
  quantity: number
  unit_price: number
  material_type: string
}

const defaultItem: InvoiceItem = { description: '', quantity: 1, unit_price: 0, material_type: 'Caliza' }

export default function InvoiceFormModal({ invoice, onClose }: Props) {
  const [type, setType] = useState('sale')
  const [clientId, setClientId] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [items, setItems] = useState<InvoiceItem[]>([{ ...defaultItem }])
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const queryClient = useQueryClient()
  const isEdit = !!invoice

  const { data: clients } = useQuery({ queryKey: ['clients'], queryFn: () => clientsApi.getAll() })
  const { data: suppliers } = useQuery({ queryKey: ['suppliers'], queryFn: () => suppliersApi.getAll() })

  useEffect(() => {
    if (invoice) {
      setType(invoice.type)
      setClientId(invoice.client_id || '')
      setSupplierId(invoice.supplier_id || '')
      setItems(invoice.items || [{ ...defaultItem }])
      setIssueDate(invoice.issue_date || '')
      setDueDate(invoice.due_date || '')
      setNotes(invoice.notes || '')
    }
  }, [invoice])

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  const iva = subtotal * 0.16
  const total = subtotal + iva

  const mutation = useMutation({
    mutationFn: (data: any) => isEdit
      ? invoicesApi.update(invoice!.id, data)
      : invoicesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate({
      type,
      client_id: type === 'sale' ? clientId : undefined,
      supplier_id: type === 'purchase' ? supplierId : undefined,
      items, issue_date: issueDate, due_date: dueDate, notes,
    })
  }

  const addItem = () => setItems([...items, { ...defaultItem }])
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index))
  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const ic = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
  const lc = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{isEdit ? 'Editar Factura' : 'Nueva Factura'}</h2>
              <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className={lc}>Tipo *</label>
                <select value={type} onChange={e => setType(e.target.value)} className={ic} disabled={isEdit}>
                  <option value="sale">Venta</option>
                  <option value="purchase">Compra</option>
                </select>
              </div>
              {type === 'sale' ? (
                <div>
                  <label className={lc}>Cliente *</label>
                  <select required value={clientId} onChange={e => setClientId(e.target.value)} className={ic}>
                    <option value="">Seleccionar cliente</option>
                    {clients?.data?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label className={lc}>Proveedor *</label>
                  <select required value={supplierId} onChange={e => setSupplierId(e.target.value)} className={ic}>
                    <option value="">Seleccionar proveedor</option>
                    {suppliers?.data?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className={lc}>Fecha de Emisión *</label>
                <input type="date" required value={issueDate} onChange={e => setIssueDate(e.target.value)} className={ic} />
              </div>
              <div>
                <label className={lc}>Fecha de Vencimiento *</label>
                <input type="date" required value={dueDate} onChange={e => setDueDate(e.target.value)} className={ic} />
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Conceptos</h3>
                <button type="button" onClick={addItem} className="text-sm text-blue-600 hover:text-blue-700">+ Agregar</button>
              </div>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <input type="text" placeholder="Descripción" value={item.description} onChange={e => updateItem(index, 'description', e.target.value)} className={`${ic} flex-1`} required />
                    <input type="number" placeholder="Cant." value={item.quantity || ''} onChange={e => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)} className={`${ic} w-20`} required />
                    <input type="number" step="0.01" placeholder="Precio" value={item.unit_price || ''} onChange={e => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)} className={`${ic} w-28`} required />
                    <span className="py-2 text-sm text-gray-600 w-24 text-right">${(item.quantity * item.unit_price).toFixed(2)}</span>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 p-2">✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">Subtotal:</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">IVA (16%):</span><span>${iva.toFixed(2)}</span></div>
              <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2"><span>Total:</span><span className="text-blue-600">${total.toFixed(2)}</span></div>
            </div>

            <div className="mt-4">
              <label className={lc}>Notas</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} className={ic} rows={2} />
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
