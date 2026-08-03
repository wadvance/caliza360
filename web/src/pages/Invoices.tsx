import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoicesApi } from '../services/api'
import { Plus, Search } from 'lucide-react'
import InvoiceTable from '../components/invoices/InvoiceTable'
import InvoiceFormModal from '../components/invoices/InvoiceFormModal'

export interface InvoiceData {
  id: string
  invoice_number: string
  type: string
  client_id: string
  supplier_id: string
  items: any[]
  subtotal: number
  iva: number
  total: number
  issue_date: string
  due_date: string
  payment_date: string
  status: string
  payment_method: string
  notes?: string
  client?: { name: string }
  supplier?: { name: string }
}

export default function Invoices() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<InvoiceData | null>(null)
  const queryClient = useQueryClient()

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => invoicesApi.getAll(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => invoicesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invoices'] }),
  })

  const filteredInvoices = invoices?.data?.filter((inv: InvoiceData) => {
    const matchSearch = inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
      inv.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.supplier?.name?.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || inv.type === typeFilter
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter
    return matchSearch && matchType && matchStatus
  }) || []

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta factura?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Facturación</h1>
        <button
          onClick={() => { setEditingInvoice(null); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nueva Factura
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por número, cliente o proveedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg">
          <option value="all">Todos los tipos</option>
          <option value="sale">Ventas</option>
          <option value="purchase">Compras</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg">
          <option value="all">Todos los estados</option>
          <option value="draft">Borrador</option>
          <option value="sent">Enviada</option>
          <option value="paid">Pagada</option>
          <option value="overdue">Vencida</option>
          <option value="cancelled">Cancelada</option>
        </select>
      </div>

      <InvoiceTable
        invoices={filteredInvoices}
        isLoading={isLoading}
        onEdit={(i) => { setEditingInvoice(i); setShowModal(true); }}
        onDelete={handleDelete}
      />

      {showModal && (
        <InvoiceFormModal
          invoice={editingInvoice}
          onClose={() => { setShowModal(false); setEditingInvoice(null); }}
        />
      )}
    </div>
  )
}
