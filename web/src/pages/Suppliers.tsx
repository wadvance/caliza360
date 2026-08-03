import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { suppliersApi } from '../services/api'
import { Plus, Search } from 'lucide-react'
import SupplierTable from '../components/suppliers/SupplierTable'
import SupplierFormModal from '../components/suppliers/SupplierFormModal'

export interface SupplierData {
  id: string
  name: string
  company: string
  rfc: string
  email: string
  phone: string
  address: string
  material_type: string
  payment_terms: string
  total_purchases: number
  outstanding_balance: number
  rating: number
  notes: string
}

export default function Suppliers() {
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<SupplierData | null>(null)
  const queryClient = useQueryClient()

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersApi.getAll(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => suppliersApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
  })

  const filteredSuppliers = suppliers?.data?.filter((s: SupplierData) =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.company?.toLowerCase().includes(search.toLowerCase()) ||
    s.rfc?.toLowerCase().includes(search.toLowerCase())
  ) || []

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este proveedor?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
        <button
          onClick={() => { setEditingSupplier(null); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Agregar Proveedor
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

      <SupplierTable
        suppliers={filteredSuppliers}
        isLoading={isLoading}
        onEdit={(s) => { setEditingSupplier(s); setShowModal(true); }}
        onDelete={handleDelete}
      />

      {showModal && (
        <SupplierFormModal
          supplier={editingSupplier}
          onClose={() => { setShowModal(false); setEditingSupplier(null); }}
        />
      )}
    </div>
  )
}