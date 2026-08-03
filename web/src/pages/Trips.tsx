import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tripsApi } from '../services/api'
import { Plus, Search } from 'lucide-react'
import TripTable from '../components/trips/TripTable'
import TripFormModal from '../components/trips/TripFormModal'
import TripDetailsModal from '../components/trips/TripDetailsModal'

export interface TripData {
  id: string
  driver_id: string
  truck_id: string
  client_id: string
  origin_name: string
  origin_address: string
  origin_lat: number
  origin_lng: number
  origin_quarry: string
  destination_name: string
  destination_address: string
  destination_lat: number
  destination_lng: number
  destination_client: string
  material_type: string
  weight: number
  price_per_ton: number
  total_amount: number
  scheduled_date: string
  scheduled_time: string
  status: string
  departure_time: string
  arrival_time: string
  return_time: string
  distance: number
  fuel_consumed: number
  driver?: { name: string }
  truck?: { plate: string }
  client?: { name: string }
}

export default function Trips() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingTrip, setEditingTrip] = useState<TripData | null>(null)
  const [showDetails, setShowDetails] = useState<TripData | null>(null)
  const queryClient = useQueryClient()

  const { data: trips, isLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: () => tripsApi.getAll(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tripsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
  })

  const filteredTrips = trips?.data?.filter((t: TripData) => {
    const matchSearch = t.origin_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.destination_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.material_type?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || t.status === statusFilter
    return matchSearch && matchStatus
  }) || []

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este viaje?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Viajes</h1>
        <button
          onClick={() => { setEditingTrip(null); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nuevo Viaje
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por origen, destino o material..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">Todos los estados</option>
          <option value="scheduled">Programado</option>
          <option value="in_transit">En Tránsito</option>
          <option value="delivered">Entregado</option>
          <option value="returned">Regresado</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>

      <TripTable
        trips={filteredTrips}
        isLoading={isLoading}
        onView={setShowDetails}
        onEdit={(t) => { setEditingTrip(t); setShowModal(true); }}
        onDelete={handleDelete}
      />

      {showDetails && (
        <TripDetailsModal trip={showDetails} onClose={() => setShowDetails(null)} />
      )}

      {showModal && (
        <TripFormModal
          trip={editingTrip}
          onClose={() => { setShowModal(false); setEditingTrip(null); }}
        />
      )}
    </div>
  )
}
