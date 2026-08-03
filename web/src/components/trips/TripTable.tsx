import { Edit2, Trash2, MapPin, Package, DollarSign, Eye } from 'lucide-react'
import { TripData } from '../../pages/Trips'

interface Props {
  trips: TripData[]
  isLoading: boolean
  onView: (trip: TripData) => void
  onEdit: (trip: TripData) => void
  onDelete: (id: string) => void
}

const statusConfig: Record<string, { color: string; text: string }> = {
  scheduled: { color: 'bg-blue-100 text-blue-800', text: 'Programado' },
  in_transit: { color: 'bg-orange-100 text-orange-800', text: 'En Tránsito' },
  delivered: { color: 'bg-green-100 text-green-800', text: 'Entregado' },
  returned: { color: 'bg-purple-100 text-purple-800', text: 'Regresado' },
  cancelled: { color: 'bg-red-100 text-red-800', text: 'Cancelado' },
}

function fmtDateTime(trip: TripData): string {
  let d = trip.scheduled_date || ''
  if (/^\d{4}-\d{2}-\d{2}/.test(d)) {
    const [y, m, day] = d.slice(0, 10).split('-')
    d = `${day}/${m}/${y}`
  }
  const t = (trip.scheduled_time || '').slice(0, 5)
  return t ? `${d} ${t}` : d
}

export default function TripTable({ trips, isLoading, onView, onEdit, onDelete }: Props) {
  const scheduled = trips.filter(t => t.status === 'scheduled').length
  const inTransit = trips.filter(t => t.status === 'in_transit').length
  const completed = trips.filter(t => t.status === 'returned').length

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-blue-100"><MapPin className="w-5 h-5 text-blue-600" /></div>
            <div className="ml-3"><p className="text-sm text-gray-500">Programados</p><p className="text-lg font-semibold">{scheduled}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-orange-100"><Package className="w-5 h-5 text-orange-600" /></div>
            <div className="ml-3"><p className="text-sm text-gray-500">En Tránsito</p><p className="text-lg font-semibold">{inTransit}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-green-100"><DollarSign className="w-5 h-5 text-green-600" /></div>
            <div className="ml-3"><p className="text-sm text-gray-500">Completados</p><p className="text-lg font-semibold">{completed}</p></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" /></div>
        ) : trips.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No se encontraron viajes</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Fecha', 'Origen', 'Destino', 'Material', 'Peso', 'Total', 'Estado', 'Acciones'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {trips.map((trip) => {
                  const s = statusConfig[trip.status] || statusConfig.scheduled
                  return (
                    <tr key={trip.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">{fmtDateTime(trip)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trip.origin_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trip.destination_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trip.material_type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trip.weight} ton</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${trip.total_amount?.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${s.color}`}>{s.text}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button onClick={() => onView(trip)} className="text-blue-600 hover:text-blue-900" title="Ver detalle"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => onEdit(trip)} className="text-green-600 hover:text-green-900" title="Editar"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => onDelete(trip.id)} className="text-red-600 hover:text-red-900" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
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
