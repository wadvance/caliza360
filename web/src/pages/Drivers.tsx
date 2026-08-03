import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { driversApi } from '../services/api'
import { Plus, Search } from 'lucide-react'
import DriverTable from '../components/drivers/DriverTable'
import DriverFormModal from '../components/drivers/DriverFormModal'

export interface DriverData {
  id: string
  user_id: string
  name: string
  license_number: string
  license_type: string
  license_expiry_date: string
  phone: string
  curp: string
  rfc: string
  address: string
  hire_date: string
  status: string
  current_truck_id: string
  total_trips: number
  total_hours_worked: number
  rating: number
}

export default function Drivers() {
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingDriver, setEditingDriver] = useState<DriverData | null>(null)
  const queryClient = useQueryClient()

  const { data: drivers, isLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => driversApi.getAll(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => driversApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drivers'] }),
  })

  const filteredDrivers = drivers?.data?.filter((d: DriverData) =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.license_number?.toLowerCase().includes(search.toLowerCase()) ||
    d.phone?.includes(search)
  ) || []

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este conductor?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Conductores</h1>
        <button
          onClick={() => { setEditingDriver(null); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Agregar Conductor
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, licencia o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <DriverTable
        drivers={filteredDrivers}
        isLoading={isLoading}
        onEdit={(d) => { setEditingDriver(d); setShowModal(true); }}
        onDelete={handleDelete}
      />

      {showModal && (
        <DriverFormModal
          driver={editingDriver}
          onClose={() => { setShowModal(false); setEditingDriver(null); }}
        />
      )}
    </div>
  )
}
