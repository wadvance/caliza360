import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { inventoryApi } from '../../services/api'
import { InventoryData } from '../../pages/Inventory'

interface Props {
  item: InventoryData
  type: 'entry' | 'exit'
  onClose: () => void
}

export default function MovementModal({ item, type, onClose }: Props) {
  const [quantity, setQuantity] = useState(0)
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const queryClient = useQueryClient()

  const isEntry = type === 'entry'

  const mutation = useMutation({
    mutationFn: (data: { quantity: number; reference: string; notes: string }) =>
      isEntry ? inventoryApi.addEntry(item.id, data) : inventoryApi.addExit(item.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (quantity <= 0) return
    if (!isEntry && quantity > item.current_stock) {
      alert('No hay suficiente stock')
      return
    }
    mutation.mutate({ quantity, reference, notes })
  }

  const ic = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
  const lc = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {isEntry ? 'Registrar Entrada' : 'Registrar Salida'}
              </h2>
              <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-500">Material: <span className="font-medium text-gray-900">{item.material_type}</span></p>
              <p className="text-sm text-gray-500">Stock actual: <span className="font-medium text-gray-900">{item.current_stock} ton</span></p>
            </div>

            <div className="space-y-4">
              <div>
                <label className={lc}>Cantidad (ton) *</label>
                <input
                  type="number" step="0.1" required
                  value={quantity || ''}
                  onChange={e => setQuantity(parseFloat(e.target.value) || 0)}
                  className={ic}
                  placeholder="0.0"
                />
                {isEntry && (
                  <p className="text-xs text-gray-500 mt-1">Nuevo stock: {(item.current_stock + quantity).toLocaleString()} ton</p>
                )}
                {!isEntry && (
                  <p className="text-xs text-gray-500 mt-1">
                    Nuevo stock: {(item.current_stock - quantity).toLocaleString()} ton
                    {quantity > item.current_stock && <span className="text-red-500 ml-2">(Excede stock)</span>}
                  </p>
                )}
              </div>
              <div>
                <label className={lc}>Referencia</label>
                <input type="text" value={reference} onChange={e => setReference(e.target.value)} className={ic} placeholder="Viaje #123, Compra #456" />
              </div>
              <div>
                <label className={lc}>Notas</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} className={ic} rows={2} />
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3 rounded-b-xl">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button
              type="submit"
              disabled={mutation.isPending || quantity <= 0 || (!isEntry && quantity > item.current_stock)}
              className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 ${isEntry ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}`}
            >
              {mutation.isPending ? 'Procesando...' : isEntry ? 'Registrar Entrada' : 'Registrar Salida'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
