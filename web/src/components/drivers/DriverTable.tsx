import { Edit2, Trash2, UserCheck, Clock, Star } from 'lucide-react'
import { DriverData } from '../../pages/Drivers'

interface Props {
  drivers: DriverData[]
  isLoading: boolean
  onEdit: (driver: DriverData) => void
  onDelete: (id: string) => void
}

const statusConfig: Record<string, { color: string; text: string }> = {
  active: { color: 'bg-green-100 text-green-800', text: 'Activo' },
  inactive: { color: 'bg-red-100 text-red-800', text: 'Inactivo' },
  on_trip: { color: 'bg-blue-100 text-blue-800', text: 'En Viaje' },
}

export default function DriverTable({ drivers, isLoading, onEdit, onDelete }: Props) {
  const active = drivers.filter(d => d.status === 'active').length
  const onTrip = drivers.filter(d => d.status === 'on_trip').length

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-green-100"><UserCheck className="w-5 h-5 text-green-600" /></div>
            <div className="ml-3"><p className="text-sm text-gray-500">Activos</p><p className="text-lg font-semibold">{active}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-blue-100"><Clock className="w-5 h-5 text-blue-600" /></div>
            <div className="ml-3"><p className="text-sm text-gray-500">En Viaje</p><p className="text-lg font-semibold">{onTrip}</p></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" /></div>
        ) : drivers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No se encontraron conductores</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Nombre', 'Licencia', 'Teléfono', 'Viajes', 'Horas', 'Rating', 'Estado', 'Acciones'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {drivers.map((driver) => {
                  const s = statusConfig[driver.status] || statusConfig.active
                  return (
                    <tr key={driver.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                            {driver.name?.charAt(0)}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{driver.name}</p>
                            <p className="text-xs text-gray-500">{driver.license_type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{driver.license_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{driver.phone || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{driver.total_trips || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{driver.total_hours_worked?.toFixed(1) || '0'}h</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="ml-1 text-sm text-gray-900">{driver.rating?.toFixed(1) || '0.0'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${s.color}`}>{s.text}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button onClick={() => onEdit(driver)} className="text-green-600 hover:text-green-900"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => onDelete(driver.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
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
