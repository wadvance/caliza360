import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inventoryApi } from '../services/api'
import { Plus, Search } from 'lucide-react'
import InventoryTable from '../components/inventory/InventoryTable'
import InventoryFormModal from '../components/inventory/InventoryFormModal'
import MovementModal from '../components/inventory/MovementModal'

export interface InventoryData {
  id: string
  name: string
  material_type: string
  unit: string
  location: string
  current_stock: number
  min_stock: number
  max_stock: number
  unit_cost: number
  last_entry: string
  last_exit: string
  status: string
}

export default function Inventory() {
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showMovement, setShowMovement] = useState<{ item: InventoryData; type: 'entry' | 'exit' } | null>(null)
  const [editingItem, setEditingItem] = useState<InventoryData | null>(null)
  const [initialLocation, setInitialLocation] = useState('')
  const queryClient = useQueryClient()

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => inventoryApi.getAll(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => inventoryApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory'] }),
  })

  const filteredInventory = inventory?.data?.filter((i: InventoryData) =>
    i.name?.toLowerCase().includes(search.toLowerCase()) ||
    i.material_type?.toLowerCase().includes(search.toLowerCase()) ||
    i.location?.toLowerCase().includes(search.toLowerCase())
  ) || []

  const materials = filteredInventory.filter((i: InventoryData) => i.location !== 'Oficina')
  const officeItems = filteredInventory.filter((i: InventoryData) => i.location === 'Oficina')

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este item?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Inventario de Caliza</h1>
        <button
          onClick={() => { setEditingItem(null); setInitialLocation(''); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Agregar Material
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, tipo o ubicación..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Inventario de Materiales</h2>
        <InventoryTable
          inventory={materials}
          isLoading={isLoading}
          onEdit={(i) => { setEditingItem(i); setShowModal(true); }}
          onDelete={handleDelete}
          onEntry={(i) => setShowMovement({ item: i, type: 'entry' })}
          onExit={(i) => setShowMovement({ item: i, type: 'exit' })}
        />
      </div>

      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Inventario - Oficina</h2>
          <button
            onClick={() => { setEditingItem(null); setInitialLocation('Oficina'); setShowModal(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Agregar nuevo
          </button>
        </div>
        <InventoryTable
          inventory={officeItems}
          isLoading={false}
          onEdit={(i) => { setEditingItem(i); setShowModal(true); }}
          onDelete={handleDelete}
          onEntry={(i) => setShowMovement({ item: i, type: 'entry' })}
          onExit={(i) => setShowMovement({ item: i, type: 'exit' })}
        />
      </div>

      {showModal && (
        <InventoryFormModal
          item={editingItem}
          initialLocation={initialLocation}
          onClose={() => { setShowModal(false); setEditingItem(null); }}
        />
      )}

      {showMovement && (
        <MovementModal
          item={showMovement.item}
          type={showMovement.type}
          onClose={() => setShowMovement(null)}
        />
      )}
    </div>
  )
}
