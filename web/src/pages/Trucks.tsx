import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { trucksApi } from '../services/api'
import { Plus, Search } from 'lucide-react'
import TruckTable from '../components/trucks/TruckTable'
import TruckFormModal from '../components/trucks/TruckFormModal'
import TruckDetailsModal from '../components/trucks/TruckDetailsModal'

export interface TruckData {
  id: string
  plate: string
  brand: string
  model: string
  year: number
  color: string
  vin_number: string
  engine_type: string
  capacity: number
  current_mileage: number
  status: string
  insurance_provider: string
  insurance_policy_number: string
  insurance_end_date: string
  circulation_card_expiry: string
}

export default function Trucks() {
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDetails, setShowDetails] = useState<TruckData | null>(null)
  const [editingTruck, setEditingTruck] = useState<TruckData | null>(null)
  const queryClient = useQueryClient()

  const { data: trucks, isLoading } = useQuery({
    queryKey: ['trucks'],
    queryFn: () => trucksApi.getAll(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => trucksApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trucks'] }),
  })

  const filteredTrucks = trucks?.data?.filter((t: TruckData) =>
    t.plate?.toLowerCase().includes(search.toLowerCase()) ||
    t.brand?.toLowerCase().includes(search.toLowerCase()) ||
    t.model?.toLowerCase().includes(search.toLowerCase())
  ) || []

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este camión?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Camiones</h1>
        <button
          onClick={() => { setEditingTruck(null); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Agregar Camión
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por placas, marca o modelo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <TruckTable
        trucks={filteredTrucks}
        isLoading={isLoading}
        onView={setShowDetails}
        onEdit={(t) => { setEditingTruck(t); setShowModal(true); }}
        onDelete={handleDelete}
      />

      {showDetails && (
        <TruckDetailsModal truck={showDetails} onClose={() => setShowDetails(null)} />
      )}

      {showModal && (
        <TruckFormModal
          truck={editingTruck}
          onClose={() => { setShowModal(false); setEditingTruck(null); }}
        />
      )}
    </div>
  )
}
