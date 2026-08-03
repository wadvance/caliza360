import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { fleetApi, tripsApi, proformasApi } from '../services/api'

type UnitType = 'viaje' | 'cantera'

interface FleetUnit {
  type: UnitType
  id: number
  status: string
  zone: 'in_quarry' | 'on_route' | 'at_destination' | 'unknown'
  origin_name: string
  destination_name: string
  material_type?: string
  weight?: number
  driver_name?: string
  driver_phone?: string
  truck_plate?: string
  location: {
    latitude: number
    longitude: number
    speed?: number
    accuracy?: number
    recorded_at?: string
  } | null
  last_update?: string
}

interface FleetResponse {
  radius_km: number
  zones: {
    in_quarry: number
    on_route: number
    at_destination: number
    unknown: number
  }
  units: FleetUnit[]
}

const zoneConfig: Record<string, { color: string; label: string }> = {
  in_quarry: { color: '#16a34a', label: 'En Cantera' },
  on_route: { color: '#2563eb', label: 'En Ruta' },
  at_destination: { color: '#dc2626', label: 'En Destino' },
  unknown: { color: '#9ca3af', label: 'Sin ubicación' },
}

const typeConfig: Record<UnitType, { color: string; label: string; letter: string }> = {
  viaje: { color: '#7c3aed', label: 'Producción → Destino', letter: 'V' },
  cantera: { color: '#b45309', label: 'Cantera', letter: 'C' },
}

const statusByAge = (t: FleetUnit): { color: string; label: string } => {
  if (!t.location?.recorded_at) {
    return { color: '#9ca3af', label: 'Sin señal' }
  }
  const age = Date.now() - new Date(t.location.recorded_at).getTime()
  const minutes = Math.floor(age / 60000)
  if (minutes < 2) return { color: '#22c55e', label: 'En línea' }
  if (minutes < 10) return { color: '#f59e0b', label: 'Degradada' }
  return { color: '#ef4444', label: 'Perdida' }
}

const unitKey = (t: { type: UnitType; id: number }) => `${t.type}:${t.id}`

function markerIcon(state: { color: string }, type: UnitType) {
  return L.divIcon({
    className: '',
    html: `<div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:${state.color};color:#fff;font-weight:700;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);">${typeConfig[type].letter}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  })
}

interface TrackingResponse {
  entity_id: number
  type: string
  status: string
  route: { latitude: number; longitude: number; speed: number | null; recorded_at: string }[]
  stops: { latitude: number; longitude: number; arrival_at: string; departure_at: string; duration_seconds: number }[]
  last_location: { latitude: number; longitude: number; speed: number | null; recorded_at: string } | null
  stats: {
    distance_traveled_km: number
    stationary_time_seconds: number
    moving_time_seconds: number
    stops_count: number
  }
  destination: { name: string; latitude: number; longitude: number }
  progress: { percent: number; remaining_distance_km: number | null }
}

const fmtDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m} min`
}

const destIcon = L.divIcon({
  className: '',
  html: '<div style="width:18px;height:18px;border-radius:50%;background:#dc2626;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

export default function LiveMap() {
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Record<string, L.Marker>>({})
  const trackingLayerRef = useRef<L.LayerGroup | null>(null)
  const [mapError, setMapError] = useState(false)
  const [radiusKm, setRadiusKm] = useState<number>(2)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [tracking, setTracking] = useState<TrackingResponse | null>(null)

  const { data: fleet, isFetching, error } = useQuery<FleetResponse>({
    queryKey: ['live-fleet', radiusKm],
    queryFn: () => fleetApi.getLive(radiusKm).then((r) => r.data as FleetResponse),
    refetchInterval: 5000,
  })

  const units = fleet?.units ?? []
  const selectedUnit = units.find((u) => unitKey(u) === selectedKey)

  useEffect(() => {
    if (mapRef.current) return
    try {
      const container = document.getElementById('live-map')
      if (!container) return
      mapRef.current = L.map(container, { zoomControl: true }).setView([8.537, -80.7821], 7)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapRef.current)
    } catch (e) {
      setMapError(true)
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const withLocation = units.filter((t) => t.location)

    // Remove markers of units that lost location or went offline.
    const ids = new Set(withLocation.map(unitKey))
    Object.keys(markersRef.current).forEach((id) => {
      if (!ids.has(id)) {
        markersRef.current[id].remove()
        delete markersRef.current[id]
      }
    })

    const getPopup = (t: FleetUnit) => {
      const loc = t.location!
      const age = statusByAge(t)
      const type = typeConfig[t.type]
      return `
        <div style="font-family:system-ui;min-width:190px;">
          <strong>${t.truck_plate || 'Vehículo'}</strong> · <span style="color:${age.color}">${age.label}</span><br/>
          Tipo: <b>${type.label}</b><br/>
          Conductor: ${t.driver_name || '—'}<br/>
          Estado: <b>${t.status === 'in_transit' ? 'En tránsito' : 'Activo'}</b><br/>
          Origen: ${t.origin_name}<br/>
          Destino: ${t.destination_name}<br/>
          Material: ${t.material_type || '—'} · ${t.weight ? t.weight + ' t' : '—'}<br/>
          Velocidad: ${loc.speed != null ? loc.speed.toFixed(0) + ' km/h' : '—'}<br/>
          Actualizado: ${t.last_update || '—'}
        </div>`
    }

    withLocation.forEach((t) => {
      const lat = t.location!.latitude
      const lon = t.location!.longitude
      const icon = markerIcon(statusByAge(t), t.type)
      const key = unitKey(t)
      if (markersRef.current[key]) {
        markersRef.current[key].setLatLng([lat, lon]).setIcon(icon).setPopupContent(getPopup(t))
      } else {
        const marker = L.marker([lat, lon], { icon })
          .addTo(map)
          .bindPopup(getPopup(t))
          .on('click', () => setSelectedKey(key))
        markersRef.current[key] = marker
      }
    })

    if (withLocation.length > 0) {
      const bounds = L.latLngBounds(withLocation.map((t) => [t.location!.latitude, t.location!.longitude] as [number, number]))
      map.fitBounds(bounds.pad(0.2), { maxZoom: 13 })
    }
  }, [units])

  // Carga el seguimiento de la unidad seleccionada (viaje o cantera) y lo refresca cada 10s.
  useEffect(() => {
    if (!selectedUnit) {
      setTracking(null)
      return
    }
    let active = true
    const load = () => {
      const p =
        selectedUnit.type === 'viaje'
          ? tripsApi.getTracking(String(selectedUnit.id))
          : proformasApi.getTracking(String(selectedUnit.id))
      return p.then((r) => {
        if (active) setTracking(r.data as TrackingResponse)
      })
    }
    load().catch(() => {})
    const interval = setInterval(load, 10000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [selectedKey, selectedUnit?.type, selectedUnit?.id])

  // Dibuja recorrido, paradas y destino de la unidad seleccionada.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    trackingLayerRef.current?.remove()
    trackingLayerRef.current = null
    if (!tracking) return

    const layer = L.layerGroup().addTo(map)
    trackingLayerRef.current = layer

    const route = tracking.route.map((p) => [p.latitude, p.longitude] as [number, number])
    if (route.length >= 2) {
      L.polyline(route, { color: '#2563eb', weight: 4, opacity: 0.9 }).addTo(layer)
    }

    tracking.stops.forEach((s) => {
      L.circleMarker([s.latitude, s.longitude], {
        radius: 8,
        color: '#dc2626',
        weight: 2,
        fillColor: '#dc2626',
        fillOpacity: 0.8,
      })
        .addTo(layer)
        .bindPopup(`<strong>Parada</strong><br/>Duración: ${fmtDuration(s.duration_seconds)}`)
    })

    const dest = tracking.destination
    if (dest && dest.latitude != null) {
      L.marker([dest.latitude, dest.longitude], { icon: destIcon })
        .addTo(layer)
        .bindPopup(`<strong>Destino</strong><br/>${dest.name}`)
    }

    const all = [...route]
    if (dest && dest.latitude != null) all.push([dest.latitude, dest.longitude])
    if (all.length > 0) {
      const bounds = L.latLngBounds(all as [number, number][])
      map.fitBounds(bounds.pad(0.15), { maxZoom: 13 })
    }
  }, [tracking])

  const online = units.filter((t) => t.location).length
  const onRoad = units.filter((t) => t.status === 'in_transit').length
  const lost = units.filter((t) => statusByAge(t).label === 'Perdida').length
  const zoneCount = (zone: string) => fleet?.zones[zone as keyof FleetResponse['zones']] ?? 0

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Centro de Control · Flota en Vivo</h1>
        <div className="flex items-center gap-4 text-sm flex-wrap">
          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
            En tránsito: {onRoad} vehículo(s)
          </span>
          <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium">
            Ubicados: {online}/{units.length}
          </span>
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
            Cantera: {units.filter((u) => u.type === 'cantera').length} · Producción: {units.filter((u) => u.type === 'viaje').length}
          </span>
          {lost > 0 && (
            <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 font-medium">
              Señal perdida: {lost}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            Geocercas ±{radiusKm} km · {zoneCount('in_quarry')} en cantera / {zoneCount('on_route')} en ruta / {zoneCount('at_destination')} en destino
          </span>
          <span className={`flex items-center gap-2 text-gray-500 ${isFetching ? 'opacity-60' : ''}`}>
            <span className={`w-2 h-2 rounded-full ${isFetching ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`} />
            Sincronizando...
          </span>
        </div>
      </div>

      {(error || mapError) && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {mapError
            ? 'No se pudo inicializar el mapa (verifique conexion a Internet para los tiles).'
            : 'No se pudo conectar con el servidor de telemetría.'}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-[560px] rounded-lg overflow-hidden border border-gray-200 bg-white">
          <div id="live-map" className="w-full h-full" />
        </div>

        <div className="bg-white rounded-lg border border-gray-200 dark:bg-gray-900 dark:border-gray-700 overflow-hidden">
          {selectedUnit && (
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-800 dark:text-gray-100">
                  Seguimiento · {selectedUnit.truck_plate || 'Vehículo'}
                </span>
                <button
                  onClick={() => setSelectedKey(null)}
                  className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm"
                  title="Cerrar seguimiento"
                >
                  ✕
                </button>
              </div>

              {tracking ? (
                <>
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Progreso hacia el destino</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {tracking.progress.percent}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-green-500 transition-all"
                        style={{ width: `${tracking.progress.percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 p-2">
                      <div className="text-gray-500">Recorrido</div>
                      <div className="font-semibold text-gray-800 dark:text-gray-100">
                        {tracking.stats.distance_traveled_km} km
                      </div>
                    </div>
                    <div className="rounded-lg bg-indigo-50 dark:bg-indigo-900/30 p-2">
                      <div className="text-gray-500">Restante</div>
                      <div className="font-semibold text-gray-800 dark:text-gray-100">
                        {tracking.progress.remaining_distance_km != null
                          ? `${tracking.progress.remaining_distance_km} km`
                          : '—'}
                      </div>
                    </div>
                    <div className="rounded-lg bg-amber-50 dark:bg-amber-900/30 p-2">
                      <div className="text-gray-500">Paradas</div>
                      <div className="font-semibold text-gray-800 dark:text-gray-100">
                        {tracking.stats.stops_count}
                      </div>
                    </div>
                    <div className="rounded-lg bg-rose-50 dark:bg-rose-900/30 p-2">
                      <div className="text-gray-500">Estacionado</div>
                      <div className="font-semibold text-gray-800 dark:text-gray-100">
                        {fmtDuration(tracking.stats.stationary_time_seconds)}
                      </div>
                    </div>
                  </div>

                  {tracking.stops.length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">
                        Paradas
                      </div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {tracking.stops.map((s, i) => (
                          <div key={i} className="text-xs text-gray-500 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                            Parada {i + 1} · {fmtDuration(s.duration_seconds)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-xs text-gray-400">Cargando seguimiento...</div>
              )}
            </div>
          )}

          <div className="px-4 py-3 border-b border-gray-200 font-semibold text-gray-700 dark:text-gray-200">
            Vehículos activos
          </div>
          <div className="divide-y divide-gray-100 max-h-[520px] overflow-y-auto">
              {units.length === 0 && (
                <div className="p-6 text-center text-sm text-gray-500">
                  No hay vehículos activos en este momento.
                </div>
              )}
              {units.map((t) => {
                const state = statusByAge(t)
                const zn = zoneConfig[t.zone]
                const tp = typeConfig[t.type]
                return (
                  <div key={unitKey(t)} onClick={() => setSelectedKey(unitKey(t))} className={`px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${selectedKey === unitKey(t) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800 dark:text-gray-100">{t.truck_plate || 'Vehículo'}</span>
                      <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: zn.color + '1a', color: zn.color }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: zn.color }} />
                        {zn.label}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      <span className="inline-block px-1.5 rounded" style={{ background: tp.color + '1a', color: tp.color }}>
                        {tp.label}
                      </span>
                      {' '}· {t.driver_name || '—'} · {t.material_type || '—'}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">{t.origin_name} → {t.destination_name}</div>
                    <div className="text-xs text-gray-400">
                      {t.last_update ? `Actualizado ${t.last_update}` : 'Sin actualización'}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        {/* Zonas geocercadas */}
        <div className="bg-white rounded-lg border border-gray-200 dark:bg-gray-900 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 font-semibold text-gray-700 dark:text-gray-200">
            Geocercas · zonas de ubicación
          </div>
          <div className="divide-y divide-gray-100">
            {(['in_quarry', 'on_route', 'at_destination', 'unknown'] as const).map((zone) => {
              const c = zoneConfig[zone]
              return (
                <div key={zone} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: c.color }} />
                    <span className="text-sm text-gray-700">{c.label}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{zoneCount(zone)}</span>
                </div>
              )
            })}
            {fleet && (
              <div className="px-4 py-2 flex items-center justify-between bg-gray-50">
                <span className="text-xs text-gray-500">Radio de cerca</span>
                <select
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="text-xs font-semibold text-gray-700 dark:text-gray-200 border border-gray-300 rounded px-2 py-1 bg-white"
                >
                  {[0.5, 1, 1.5, 2, 3, 5, 10].map((opt) => (
                    <option key={opt} value={opt}>±{opt} km</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
