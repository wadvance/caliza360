import { useQueryClient, useMutation } from '@tanstack/react-query'
import { tripsApi } from '../../services/api'
import { TripData } from '../../pages/Trips'
import { useState } from 'react'

interface Props {
  trip: TripData
  onClose: () => void
}

const statusConfig: Record<string, { color: string; text: string }> = {
  scheduled: { color: 'bg-blue-100 text-blue-800', text: 'Programado' },
  in_transit: { color: 'bg-orange-100 text-orange-800', text: 'En Tránsito' },
  delivered: { color: 'bg-green-100 text-green-800', text: 'Entregado' },
  returned: { color: 'bg-purple-100 text-purple-800', text: 'Regresado' },
  cancelled: { color: 'bg-red-100 text-red-800', text: 'Cancelado' },
}

export default function TripDetailsModal({ trip: initialTrip, onClose }: Props) {
  const queryClient = useQueryClient()
  const [trip, setTrip] = useState(initialTrip)
  const s = statusConfig[trip.status] || statusConfig.scheduled

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['trips'] })

  const applyTrip = (res: any) => {
    setTrip((prev) => ({ ...prev, ...res.data }))
    refresh()
  }

  const invalidate = () => {
    refresh()
    onClose()
  }

  const action = useMutation({
    mutationFn: (fn: () => Promise<any>) => fn(),
    onSuccess: invalidate,
  })

const weigh = useMutation({
    mutationFn: (fn: () => Promise<any>) => fn(),
    onSuccess: (res) => applyTrip(res),
  })

  // Local input state
  const [gross, setGross] = useState<string>('')
  const [tare, setTare] = useState<string>('')
  const [qaStatus, setQaStatus] = useState<string>('approved')
  const [qaNotes, setQaNotes] = useState('')
  const [qaInspector, setQaInspector] = useState('')
  const [batch, setBatch] = useState('')
  const [qaBusy, setQaBusy] = useState(false)

  const submitGross = () => {
    if (!gross) return
    weigh.mutate(() => tripsApi.recordGross(trip.id, { gross_weight: Number(gross) }), { onSuccess: (r: any) => applyTrip(r) })
    setGross('')
  }

  const submitTare = () => {
    if (!tare) return
    weigh.mutate(() => tripsApi.recordTare(trip.id, { tare_weight: Number(tare) }), { onSuccess: (r: any) => applyTrip(r) })
    setTare('')
  }

  const submitQa = () => {
    setQaBusy(true)
    tripsApi.recordQuality(trip.id, {
      quality_status: qaStatus,
      quality_notes: qaNotes,
      quality_inspector: qaInspector,
      batch_code: batch,
    }).then(applyTrip).finally(() => setQaBusy(false))
  }

  const row = (label: React.ReactNode, value: React.ReactNode) => (
    <div className="flex justify-between py-2 border-b border-gray-100 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium text-right dark:text-gray-100 ml-4">{value}</span>
    </div>
  )

  const photos: string[] = (trip as any).photos || []
  const signature = (trip as any).customer_signature as string | undefined

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Detalle del Viaje</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
          </div>

          <div className="mb-2">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${s.color}`}>{s.text}</span>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4 dark:bg-gray-900">
            {row('Origen', trip.origin_name)}
            {trip.origin_quarry && row('Cantera', trip.origin_quarry)}
            {row('Destino', trip.destination_name)}
            {trip.destination_client && row('Cliente obra', trip.destination_client)}
            {row('Material', `${trip.material_type} · ${trip.weight} ton`)}
            {row('Total', `$${trip.total_amount?.toLocaleString()}`)}
            {trip.driver?.name && row('Conductor', trip.driver.name)}
            {trip.truck?.plate && row('Camión', trip.truck.plate)}
            {trip.client?.name && row('Cliente', trip.client.name)}
            {trip.fuel_consumed != null && row('Combustible', `${trip.fuel_consumed} L`)}
            {trip.distance != null && row('Distancia', `${trip.distance} km`)}
          </div>

          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Evidencia de Entrega</h3>
          {photos.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-3">
              {photos.map((p, i) => (
                <img key={i} src={p} alt={`Evidencia ${i + 1}`} className="w-20 h-20 object-cover rounded-lg border" />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 mb-3">Sin evidencia registrada.</p>
          )}

          {signature && (
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Firma del cliente</p>
              <img src={signature} alt="Firma" className="max-h-24 border rounded-lg bg-white p-1" />
            </div>
          )}

          {(trip as any).delivery_proof && (
            <p className="text-sm text-gray-600 mb-4"><strong>Comprobante:</strong> {(trip as any).delivery_proof}</p>
          )}

          {/* Báscula digital */}
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Báscula (Pesaje digital)</h3>
          <div className="bg-gray-50 rounded-lg p-4 mb-4 dark:bg-gray-900 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Neto real</span>
              <span className="font-bold text-gray-900">
                {(trip as any).net_weight ?? (trip as any).weight ?? 0} t
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-gray-500">Bruto</label>
                <input type="number" value={gross} onChange={(e) => setGross(e.target.value)} placeholder={(trip as any).gross_weight ?? '0'}
                  className="w-full px-2 py-1.5 text-sm border rounded-lg" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Tara</label>
                <input type="number" value={tare} onChange={(e) => setTare(e.target.value)} placeholder={(trip as any).tare_weight ?? '0'}
                  className="w-full px-2 py-1.5 text-sm border rounded-lg" />
              </div>
              <div className="flex flex-col justify-end">
                <button onClick={submitGross} disabled={weigh.isPending || !gross}
                  className="px-2 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  Pesaje Bruto
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={submitTare} disabled={weigh.isPending || !tare}
                className="flex-1 px-2 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                Registrar Tara (calcular neto)
              </button>
            </div>
          </div>

          {/* Control de calidad */}
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Control de Calidad</h3>
          <div className="bg-gray-50 rounded-lg p-4 mb-4 dark:bg-gray-900 space-y-2">
            <div className="flex flex-wrap gap-2 items-center text-sm">
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                (trip as any).quality_status === 'approved' ? 'bg-green-100 text-green-800'
                : (trip as any).quality_status === 'rejected' ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-600'
              }`}>
                {(trip as any).quality_status === 'approved' ? 'Aprobado'
                  : (trip as any).quality_status === 'rejected' ? 'Rechazado' : 'Pendiente'}
              </span>
              {(trip as any).batch_code && <span className="text-xs text-gray-500">Lote: {(trip as any).batch_code}</span>}
              {(trip as any).quality_inspector && <span className="text-xs text-gray-500">Inspector: {(trip as any).quality_inspector}</span>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select value={qaStatus} onChange={(e) => setQaStatus(e.target.value)}
                className="px-2 py-1.5 text-sm border rounded-lg">
                <option value="approved">Aprobar</option>
                <option value="rejected">Rechazar</option>
              </select>
              <input type="text" value={batch} onChange={(e) => setBatch(e.target.value)} placeholder="Código de lote"
                className="px-2 py-1.5 text-sm border rounded-lg" />
              <input type="text" value={qaInspector} onChange={(e) => setQaInspector(e.target.value)} placeholder="Inspector"
                className="px-2 py-1.5 text-sm border rounded-lg" />
            </div>
            <input type="text" value={qaNotes} onChange={(e) => setQaNotes(e.target.value)} placeholder="Notas de calidad (granulometría, observaciones)"
              className="w-full px-2 py-1.5 text-sm border rounded-lg" />
            <button onClick={submitQa} disabled={qaBusy}
              className="w-full px-2 py-1.5 text-xs bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
              Registrar Control de Calidad
            </button>
          </div>

          <div className="flex flex-col gap-2 mt-4">
            {trip.status === 'scheduled' && (
              <button onClick={() => action.mutate(() => tripsApi.startTrip(trip.id))} disabled={action.isPending}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                Iniciar Viaje (En Tránsito)
              </button>
            )}
            {trip.status === 'in_transit' && (
              <button onClick={() => action.mutate(() => tripsApi.deliverTrip(trip.id))} disabled={action.isPending}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                Marcar Entregado
              </button>
            )}
            {trip.status === 'delivered' && (
              <button onClick={() => action.mutate(() => tripsApi.returnTrip(trip.id))} disabled={action.isPending}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                Regresar / Finalizar
              </button>
            )}
            <button onClick={onClose} className="w-full px-4 py-2 bg-white border text-gray-700 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 hover:bg-gray-50">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  )
}
