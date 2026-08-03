import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientsApi } from '../services/api'
import { Plus, Search } from 'lucide-react'
import ClientTable from '../components/clients/ClientTable'
import ClientFormModal from '../components/clients/ClientFormModal'

export interface ClientData {
  id: string
  name: string
  company: string
  rfc: string
  email: string
  phone: string
  address_street: string
  address_number: string
  address_colony: string
  address_city: string
  address_state: string
  contact_person: string
  payment_terms: string
  credit_limit: number
  current_balance: number
  total_purchases: number
  total_tons_purchased: number
}

export default function Clients() {
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState<ClientData | null>(null)
  const queryClient = useQueryClient()

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.getAll(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => clientsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  })

  const filteredClients = clients?.data?.filter((c: ClientData) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase()) ||
    c.rfc?.toLowerCase().includes(search.toLowerCase())
  ) || []

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este cliente?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <button
          onClick={() => { setEditingClient(null); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Agregar Cliente
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, empresa o RFC..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <ClientTable
        clients={filteredClients}
        isLoading={isLoading}
        onEdit={(c) => { setEditingClient(c); setShowModal(true); }}
        onDelete={handleDelete}
      />

      {showModal && (
        <ClientFormModal
          client={editingClient}
          onClose={() => { setShowModal(false); setEditingClient(null); }}
        />
      )}
    </div>
  )
}
