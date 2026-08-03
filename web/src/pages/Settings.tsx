import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { settingsApi } from '../services/api'
import { Save, Building2 } from 'lucide-react'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  partial: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  partial: 'Parcial',
  paid: 'Pagado',
  overdue: 'Vencido',
}

export default function Settings() {
  const queryClient = useQueryClient()
  const [company, setCompany] = useState({
    name: '',
    rfc: '',
    address: '',
    phone: '',
    email: '',
    iva_rate: 16,
    fuel_price: 0,
  })

  const mutation = useMutation({
    mutationFn: (data: typeof company) => settingsApi.updateCompany(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      alert('Configuración guardada correctamente')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(company)
  }

  const ic = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
  const lc = "block text-sm font-medium text-gray-700 dark:text-gray-200 dark:text-gray-200 mb-1"

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded dark:bg-gray-900-lg shadow dark:bg-gray-900 dark:border dark:border-gray-800 p-6 space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Datos de la Empresa</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={lc}>Nombre de la Empresa *</label>
            <input type="text" required value={company.name} onChange={e => setCompany({...company, name: e.target.value})} className={ic} />
          </div>
          <div>
            <label className={lc}>RFC</label>
            <input type="text" value={company.rfc} onChange={e => setCompany({...company, rfc: e.target.value})} className={ic} maxLength={13} />
          </div>
          <div>
            <label className={lc}>Teléfono</label>
            <input type="text" value={company.phone} onChange={e => setCompany({...company, phone: e.target.value})} className={ic} />
          </div>
          <div>
            <label className={lc}>Email</label>
            <input type="email" value={company.email} onChange={e => setCompany({...company, email: e.target.value})} className={ic} />
          </div>
          <div className="md:col-span-2">
            <label className={lc}>Dirección</label>
            <input type="text" value={company.address} onChange={e => setCompany({...company, address: e.target.value})} className={ic} />
          </div>
        </div>

        <div className="border-t pt-4 mt-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Configuración Fiscal</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={lc}>Tasa de IVA (%)</label>
              <input type="number" value={company.iva_rate} onChange={e => setCompany({...company, iva_rate: parseFloat(e.target.value)})} className={ic} />
            </div>
            <div>
              <label className={lc}>Precio del Combustible ($/litro)</label>
              <input type="number" step="0.01" value={company.fuel_price} onChange={e => setCompany({...company, fuel_price: parseFloat(e.target.value)})} className={ic} />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" disabled={mutation.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            <Save className="w-4 h-4" />
            {mutation.isPending ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </form>
    </div>
  )
}