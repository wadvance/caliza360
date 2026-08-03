import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { aiApi } from '../../services/api'
import ReportLayout from '../../components/reports/ReportLayout'
import { MapPin, Clock, Fuel, DollarSign, Navigation, AlertTriangle, CheckCircle } from 'lucide-react'

export default function RouteOptimizer() {
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [materialType, setMaterialType] = useState('Caliza')
  const [weight, setWeight] = useState('')
  const [departureTime, setDepartureTime] = useState('06:00')

  const mutation = useMutation({
    mutationFn: (data: any) => aiApi.optimizeRoute(data),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!origin || !destination || !weight) return
    mutation.mutate({
      origin,
      destination,
      material_type: materialType,
      weight: parseFloat(weight),
      departure_time: departureTime,
    })
  }

  const result = mutation.data?.data?.data

  return (
    <ReportLayout
      title="Optimizador de Rutas"
      subtitle="Calcula la mejor ruta, costo y horario para tus viajes"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Parámetros del Viaje</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Origen *</label>
              <select value={origin} onChange={e => setOrigin(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                <option value="">Seleccionar origen</option>
                <option value="Cantera Penonomé">Cantera Penonomé</option>
                <option value="Cantera El Coco">Cantera El Coco</option>
                <option value="Cantera Río Grande">Cantera Río Grande</option>
                <option value="Planta de Producción">Planta de Producción</option>
                <option value="Bodega Central">Bodega Central</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destino *</label>
              <select value={destination} onChange={e => setDestination(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                <option value="">Seleccionar destino</option>
                <option value="Centro">Panamá (Centro)</option>
                <option value="Chitré">Chitré (Herrera)</option>
                <option value="Las Tablas">Las Tablas (Los Santos)</option>
                <option value="Santiago">Santiago (Veraguas)</option>
                <option value="David">David (Chiriquí)</option>
                <option value="La Chorrera">La Chorrera (Panamá Oeste)</option>
                <option value="Colón">Colón</option>
                <option value="Obra">Obra en Construcción</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Material *</label>
                <select value={materialType} onChange={e => setMaterialType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                  <option value="Caliza">Caliza</option>
                  <option value="Arena">Arena</option>
                  <option value="Grava">Grava</option>
                  <option value="Sascalilla">Sascalilla</option>
                  <option value="Relleno">Relleno</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Peso (ton) *</label>
                <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="25" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora de Salida</label>
              <input type="time" value={departureTime} onChange={e => setDepartureTime(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>

            <button type="submit" disabled={mutation.isPending || !origin || !destination || !weight} className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {mutation.isPending ? 'Calculando...' : 'Optimizar Ruta'}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          {result ? (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-blue-600" />
                  Resultado de Optimización
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-600">Distancia</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{result.distance_km} km</p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-600">Duración</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{result.duration_minutes} min</p>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Fuel className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm text-gray-600">Combustible</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-600">{result.fuel_needed_liters} L</p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-purple-600" />
                      <span className="text-sm text-gray-600">Costo Extra</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">${result.total_extra_cost}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-gray-600">Hora Estimada de Llegada</span>
                    <span className="font-semibold">{result.estimated_arrival}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-gray-600">Nivel de Tráfico</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${result.is_peak_hour ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {result.traffic_level}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-gray-600">Costo de Peajes</span>
                    <span className="font-semibold">${result.toll_cost}</span>
                  </div>
                </div>
              </div>

              {result.suggested_departures && result.suggested_departures.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Horarios Sugeridos</h3>
                  <div className="space-y-3">
                    {result.suggested_departures.map((dep: any, i: number) => (
                      <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${dep.recommended ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                        <div className="flex items-center gap-3">
                          <Clock className={`w-5 h-5 ${dep.recommended ? 'text-green-600' : 'text-gray-400'}`} />
                          <div>
                            <p className="font-semibold">{dep.time}</p>
                            <p className="text-sm text-gray-500">{dep.reason}</p>
                          </div>
                        </div>
                        {dep.recommended && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                            Recomendado
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.recommendations && result.recommendations.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Recomendaciones</h3>
                  <ul className="space-y-2">
                    {result.recommendations.map((rec: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        {rec.toLowerCase().includes('verificar') || rec.toLowerCase().includes('evitar') ? (
                          <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        )}
                        <span className="text-sm text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <Navigation className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-500 mb-2">Optimiza tu ruta</h3>
              <p className="text-gray-400">Selecciona origen, destino y parámetros para obtener la mejor ruta</p>
            </div>
          )}
        </div>
      </div>
    </ReportLayout>
  )
}
