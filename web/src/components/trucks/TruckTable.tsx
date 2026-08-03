import { Eye, Edit2, Trash2, Wrench, AlertTriangle, Truck as TruckIcon } from 'lucide-react'
import { TruckData } from '../../pages/Trucks'

interface Props {
  trucks: TruckData[]
  isLoading: boolean
  onView: (truck: TruckData) => void
  onEdit: (truck: TruckData) => void
  onDelete: (id: string) => void
}

const statusConfig: Record<string, { color: string; text: string }> = {
  active: { color: 'bg-green-100 text-green-800', text: 'Activo' },
  maintenance: { color: 'bg-yellow-100 text-yellow-800', text: 'Mantenimiento' },
  inactive: { color: 'bg-red-100 text-red-800', text: 'Inactivo' },
}

export default function TruckTable({ trucks, isLoading, onView, onEdit, onDelete }: Props) {
  const active = trucks.filter(t => t.status === 'active').length
  const maintenance = trucks.filter(t => t.status === 'maintenance').length
  const inactive = trucks.filter(t => t.status === 'inactive').length

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-green-100"><TruckIcon className="w-5 h-5 text-green-600" /></div>
            <div className="ml-3"><p className="text-sm text-gray-500">Activos</p><p className="text-lg font-semibold">{active}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-yellow-100"><Wrench className="w-5 h-5 text-yellow-600" /></div>
            <div className="ml-3"><p className="text-sm text-gray-500">Mantenimiento</p><p className="text-lg font-semibold">{maintenance}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-red-100"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
            <div className="ml-3"><p className="text-sm text-gray-500">Inactivos</p><p className="text-lg font-semibold">{inactive}</p></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          </div>
        ) : trucks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No se encontraron camiones</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Placa', 'Marca/Modelo', 'Año', 'Capacidad', 'Kilometraje', 'Estado', 'Acciones'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {trucks.map((truck) => {
                  const s = statusConfig[truck.status] || statusConfig.inactive
                  return (
                    <tr key={truck.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{truck.plate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{truck.brand} {truck.model}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{truck.year}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{truck.capacity} ton</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{truck.current_mileage?.toLocaleString()} km</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${s.color}`}>{s.text}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button onClick={() => onView(truck)} className="text-blue-600 hover:text-blue-900"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => onEdit(truck)} className="text-green-600 hover:text-green-900"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => onDelete(truck.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
