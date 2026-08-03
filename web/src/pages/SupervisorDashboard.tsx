import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supervisorApi } from '../services/api'
import {
  Calendar,
  Factory,
  Blend,
  ShieldCheck,
  Users,
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  FlaskConical,
  Target,
  CheckCircle2,
  UserCog,
} from 'lucide-react'

interface PlanningItem {
  id: string
  title: string
  activity_type: string
  planned_date: string
  start_time?: string | null
  end_time?: string | null
  area?: string | null
  assigned_person?: string | null
  notes?: string | null
  status: string
}

interface ReceptionItem {
  id: string
  stage: string
  material: string
  tonnage: number
  processed_date: string
  origin?: string | null
  notes?: string | null
  status: string
}

interface BlendingItem {
  id: string
  title: string
  materials?: string | null
  target_spec?: number | null
  blend_date: string
  notes?: string | null
  status: string
}

interface QualityItem {
  id: string
  material: string
  purity?: number | null
  granulometry?: string | null
  industry?: string | null
  checked_date: string
  notes?: string | null
  status: string
}

interface SafetyItem {
  id: string
  type: string
  title: string
  description?: string | null
  risk_level: string
  status: string
  checked_date: string
  action_plan?: string | null
}

interface TaskItem {
  id: string
  title: string
  assignee?: string | null
  priority: string
  due_date?: string | null
  notes?: string | null
  status: string
}

type ModalState<T> = { open: boolean; item: T | null }

const emptyPlanning: PlanningItem = { id: '', title: '', activity_type: 'extraccion', planned_date: '', start_time: '', end_time: '', area: '', assigned_person: '', notes: '', status: 'planificado' }
const emptyReception: ReceptionItem = { id: '', stage: 'recepcion', material: '', tonnage: 0, processed_date: '', origin: '', notes: '', status: 'recibido' }
const emptyBlending: BlendingItem = { id: '', title: '', materials: '', target_spec: null, blend_date: '', notes: '', status: 'planificado' }
const emptyQuality: QualityItem = { id: '', material: '', purity: null, granulometry: '', industry: '', checked_date: '', notes: '', status: 'pendiente' }
const emptySafety: SafetyItem = { id: '', type: 'protocolo_epp', title: '', description: '', risk_level: 'medio', status: 'pendiente', checked_date: '', action_plan: '' }
const emptyTask: TaskItem = { id: '', title: '', assignee: '', priority: 'media', due_date: '', notes: '', status: 'pendiente' }

const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
const labelCls = "block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300"

const stageLabels: Record<string, string> = {
  recepcion: 'Recepción',
  chancado_primario: 'Chancado primario',
  chancado_secundario: 'Chancado secundario',
}
const activityLabels: Record<string, string> = {
  extraccion: 'Extracción',
  procesamiento: 'Procesamiento',
  chancado: 'Chancado',
  mezclado: 'Mezclado',
  mantenimiento: 'Mantenimiento',
  otro: 'Otro',
}
const safetyTypeLabels: Record<string, string> = {
  protocolo_epp: 'Protocolo EPP',
  iperc: 'IPERC',
  ventilacion: 'Ventilación',
  polucion: 'Polución',
  control_riesgo: 'Control de riesgos',
}
const riskColors: Record<string, string> = {
  bajo: 'bg-green-100 text-green-700',
  medio: 'bg-amber-100 text-amber-700',
  alto: 'bg-orange-100 text-orange-700',
  critico: 'bg-red-100 text-red-700',
}
const statusColors: Record<string, string> = {
  planificado: 'bg-blue-100 text-blue-700',
  en_proceso: 'bg-amber-100 text-amber-700',
  completado: 'bg-green-100 text-green-700',
  cancelado: 'bg-red-100 text-red-700',
  completada: 'bg-green-100 text-green-700',
  cancelada: 'bg-red-100 text-red-700',
  recibido: 'bg-blue-100 text-blue-700',
  cumple: 'bg-green-100 text-green-700',
  no_cumple: 'bg-red-100 text-red-700',
  pendiente: 'bg-amber-100 text-amber-700',
  verificado: 'bg-green-100 text-green-700',
  en_atencion: 'bg-amber-100 text-amber-700',
  incumplido: 'bg-red-100 text-red-700',
}
const priorityColors: Record<string, string> = {
  alta: 'bg-red-100 text-red-700',
  media: 'bg-amber-100 text-amber-700',
  baja: 'bg-green-100 text-green-700',
}

const fmtDate = (iso?: string | null) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

const errMsg = (e: any, fallback: string) => {
  const msg = e?.response?.data?.message
  if (typeof msg === 'string') return msg
  const first = e?.response?.data?.errors
  if (first) { const k = Object.keys(first)[0]; return first[k]?.[0] || fallback }
  return fallback
}

export default function SupervisorDashboard() {
  const queryClient = useQueryClient()
  const [planningModal, setPlanningModal] = useState<ModalState<PlanningItem>>({ open: false, item: null })
  const [receptionModal, setReceptionModal] = useState<ModalState<ReceptionItem>>({ open: false, item: null })
  const [blendingModal, setBlendingModal] = useState<ModalState<BlendingItem>>({ open: false, item: null })
  const [qualityModal, setQualityModal] = useState<ModalState<QualityItem>>({ open: false, item: null })
  const [safetyModal, setSafetyModal] = useState<ModalState<SafetyItem>>({ open: false, item: null })
  const [taskModal, setTaskModal] = useState<ModalState<TaskItem>>({ open: false, item: null })

  const { data: summary } = useQuery({
    queryKey: ['supervisor-summary'],
    queryFn: () => supervisorApi.getSummary().then((r) => r.data),
    refetchInterval: 30000,
  })

  const { data: planning } = useQuery({ queryKey: ['supervisor-planning'], queryFn: () => supervisorApi.getPlanning().then((r) => r.data) })
  const { data: reception } = useQuery({ queryKey: ['supervisor-reception'], queryFn: () => supervisorApi.getReception().then((r) => r.data) })
  const { data: blending } = useQuery({ queryKey: ['supervisor-blending'], queryFn: () => supervisorApi.getBlending().then((r) => r.data) })
  const { data: quality } = useQuery({ queryKey: ['supervisor-quality'], queryFn: () => supervisorApi.getQuality().then((r) => r.data) })
  const { data: safety } = useQuery({ queryKey: ['supervisor-safety'], queryFn: () => supervisorApi.getSafety().then((r) => r.data) })
  const { data: tasks } = useQuery({ queryKey: ['supervisor-tasks'], queryFn: () => supervisorApi.getTasks().then((r) => r.data) })

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['supervisor-summary'] })
    queryClient.invalidateQueries({ queryKey: ['supervisor-planning'] })
    queryClient.invalidateQueries({ queryKey: ['supervisor-reception'] })
    queryClient.invalidateQueries({ queryKey: ['supervisor-blending'] })
    queryClient.invalidateQueries({ queryKey: ['supervisor-quality'] })
    queryClient.invalidateQueries({ queryKey: ['supervisor-safety'] })
    queryClient.invalidateQueries({ queryKey: ['supervisor-tasks'] })
  }

  const savePlanning = useMutation({
    mutationFn: ({ id, data }: { id?: string; data: any }) => id ? supervisorApi.updatePlanning(id, data) : supervisorApi.createPlanning(data),
    onSuccess: () => { setPlanningModal({ open: false, item: null }); invalidateAll() },
  })
  const deletePlanning = useMutation({ mutationFn: (id: string) => supervisorApi.deletePlanning(id), onSuccess: () => invalidateAll() })

  const saveReception = useMutation({
    mutationFn: ({ id, data }: { id?: string; data: any }) => id ? supervisorApi.updateReception(id, data) : supervisorApi.createReception(data),
    onSuccess: () => { setReceptionModal({ open: false, item: null }); invalidateAll() },
  })
  const deleteReception = useMutation({ mutationFn: (id: string) => supervisorApi.deleteReception(id), onSuccess: () => invalidateAll() })

  const saveBlending = useMutation({
    mutationFn: ({ id, data }: { id?: string; data: any }) => id ? supervisorApi.updateBlending(id, data) : supervisorApi.createBlending(data),
    onSuccess: () => { setBlendingModal({ open: false, item: null }); invalidateAll() },
  })
  const deleteBlending = useMutation({ mutationFn: (id: string) => supervisorApi.deleteBlending(id), onSuccess: () => invalidateAll() })

  const saveQuality = useMutation({
    mutationFn: ({ id, data }: { id?: string; data: any }) => id ? supervisorApi.updateQuality(id, data) : supervisorApi.createQuality(data),
    onSuccess: () => { setQualityModal({ open: false, item: null }); invalidateAll() },
  })
  const deleteQuality = useMutation({ mutationFn: (id: string) => supervisorApi.deleteQuality(id), onSuccess: () => invalidateAll() })

  const saveSafety = useMutation({
    mutationFn: ({ id, data }: { id?: string; data: any }) => id ? supervisorApi.updateSafety(id, data) : supervisorApi.createSafety(data),
    onSuccess: () => { setSafetyModal({ open: false, item: null }); invalidateAll() },
  })
  const deleteSafety = useMutation({ mutationFn: (id: string) => supervisorApi.deleteSafety(id), onSuccess: () => invalidateAll() })

  const saveTask = useMutation({
    mutationFn: ({ id, data }: { id?: string; data: any }) => id ? supervisorApi.updateTask(id, data) : supervisorApi.createTask(data),
    onSuccess: () => { setTaskModal({ open: false, item: null }); invalidateAll() },
  })
  const deleteTask = useMutation({ mutationFn: (id: string) => supervisorApi.deleteTask(id), onSuccess: () => invalidateAll() })

  const cards = [
    { label: 'Actividades hoy', value: summary?.production?.planned_today ?? 0, icon: Calendar, color: 'bg-blue-100 text-blue-600', link: '#planning' },
    { label: 'Recepción hoy', value: summary?.production?.reception_today ?? 0, icon: Factory, color: 'bg-amber-100 text-amber-600', link: '#reception' },
    { label: 'Tonelaje del mes', value: Number(summary?.production?.tonnage_month ?? 0).toLocaleString('es-MX') + ' t', icon: ClipboardList, color: 'bg-emerald-100 text-emerald-600', link: '#reception' },
    { label: 'Controles de calidad', value: summary?.quality?.checked_month ?? 0, icon: FlaskConical, color: 'bg-purple-100 text-purple-600', link: '#quality' },
    { label: 'No conformes', value: summary?.quality?.non_compliant ?? 0, icon: AlertTriangle, color: 'bg-red-100 text-red-600', link: '#quality' },
    { label: 'Seguridad abierta', value: summary?.safety?.open ?? 0, icon: ShieldCheck, color: 'bg-orange-100 text-orange-600', link: '#safety' },
    { label: 'Riesgos altos', value: summary?.safety?.high_risk ?? 0, icon: AlertTriangle, color: 'bg-red-100 text-red-600', link: '#safety' },
    { label: 'Tareas pendientes', value: summary?.team?.pending_tasks ?? 0, icon: Users, color: 'bg-indigo-100 text-indigo-600', link: '#team' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Espacio de Trabajo · Supervisor</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Control de producción y materia prima, gestión de calidad, seguridad y medio ambiente, y liderazgo de equipo</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <a key={c.label} href={undefined} onClick={(e) => { e.preventDefault(); document.querySelector(c.link)?.scrollIntoView({ behavior: 'smooth' }) }} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow dark:bg-gray-900 dark:border dark:border-gray-800">
            <div className={`p-2 rounded-full ${c.color} w-fit mb-2`}>
              <c.icon className="w-5 h-5" />
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{c.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{c.label}</p>
          </a>
        ))}
      </div>

      {/* ============ 1. CONTROL DE PRODUCCIÓN Y MATERIA PRIMA ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PLANIFICACIÓN */}
        <section id="planning" className="bg-white rounded-lg shadow dark:bg-gray-900 dark:border dark:border-gray-800">
          <div className="flex items-center justify-between px-5 pt-5">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" /> Planificación
              </h2>
              <p className="text-sm text-gray-500">Actividades diarias del personal según los planes de extracción y procesamiento.</p>
            </div>
            <button onClick={() => setPlanningModal({ open: true, item: { ...emptyPlanning } })} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
              <Plus className="w-4 h-4" /> Planificar
            </button>
          </div>
          <div className="p-5">
            {(planning ?? []).length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">No hay actividades planificadas.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {(planning ?? []).map((a: PlanningItem) => (
                  <div key={a.id} className="flex items-center justify-between flex-wrap gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900 dark:text-white">{a.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[a.status] || ''}`}>{a.status}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">{activityLabels[a.activity_type] || a.activity_type}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        <Calendar className="w-3 h-3 inline mr-1" />{fmtDate(a.planned_date)}
                        {a.start_time ? <span className="ml-2">· {a.start_time}{a.end_time ? ` → ${a.end_time}` : ''}</span> : null}
                        {a.area ? <span className="ml-2">· {a.area}</span> : null}
                      </p>
                      {a.assigned_person ? <p className="text-xs text-gray-500 mt-0.5"><Users className="w-3 h-3 inline mr-1" />{a.assigned_person}</p> : null}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => setPlanningModal({ open: true, item: a })} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg dark:hover:bg-blue-900/30"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deletePlanning.mutate(a.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/30"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* RECEPCIÓN Y TRITURACIÓN */}
        <section id="reception" className="bg-white rounded-lg shadow dark:bg-gray-900 dark:border dark:border-gray-800">
          <div className="flex items-center justify-between px-5 pt-5">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Factory className="w-5 h-5 text-amber-600" /> Recepción y Trituración
              </h2>
              <p className="text-sm text-gray-500">Recepción de la caliza y chancado primario y secundario para asegurar el abastecimiento.</p>
            </div>
            <button onClick={() => setReceptionModal({ open: true, item: { ...emptyReception } })} className="flex items-center gap-2 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium">
              <Plus className="w-4 h-4" /> Registrar
            </button>
          </div>
          <div className="p-5">
            {(reception ?? []).length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">No hay registros de recepción ni trituración.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      <th className="px-3 py-2">Etapa</th>
                      <th className="px-3 py-2">Material</th>
                      <th className="px-3 py-2 text-right">Tonelaje</th>
                      <th className="px-3 py-2">Fecha</th>
                      <th className="px-3 py-2">Estado</th>
                      <th className="px-3 py-2 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {(reception ?? []).map((r: ReceptionItem) => (
                      <tr key={r.id} className="text-sm text-gray-700 dark:text-gray-300">
                        <td className="px-3 py-3">{stageLabels[r.stage] || r.stage}</td>
                        <td className="px-3 py-3 font-medium">{r.material}</td>
                        <td className="px-3 py-3 text-right font-semibold">{Number(r.tonnage || 0).toLocaleString('es-MX')} t</td>
                        <td className="px-3 py-3">{fmtDate(r.processed_date)}</td>
                        <td className="px-3 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[r.status] || ''}`}>{r.status}</span></td>
                        <td className="px-3 py-3 text-right">
                          <button onClick={() => setReceptionModal({ open: true, item: r })} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg dark:hover:bg-blue-900/30"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => deleteReception.mutate(r.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/30"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* MEZCLADO (BLENDING) */}
      <section id="blending" className="bg-white rounded-lg shadow dark:bg-gray-900 dark:border dark:border-gray-800">
        <div className="flex items-center justify-between px-5 pt-5">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Blend className="w-5 h-5 text-emerald-600" /> Mezclado (Blending)
            </h2>
            <p className="text-sm text-gray-500">Supervisa la mezcla de materias primas para cumplir las especificaciones técnicas del producto final.</p>
          </div>
          <button onClick={() => setBlendingModal({ open: true, item: { ...emptyBlending } })} className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium">
            <Plus className="w-4 h-4" /> Nueva mezcla
          </button>
        </div>
        <div className="p-5">
          {(blending ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No hay mezclas registradas.</p>
          ) : (
            <div className="space-y-2">
              {(blending ?? []).map((b: BlendingItem) => (
                <div key={b.id} className="flex items-center justify-between flex-wrap gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900 dark:text-white">{b.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[b.status] || ''}`}>{b.status}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      <Blend className="w-3 h-3 inline mr-1" />{fmtDate(b.blend_date)}
                      {b.materials ? <span className="ml-2">· {b.materials}</span> : null}
                      {b.target_spec != null ? <span className="ml-2">· Espec. {b.target_spec}</span> : null}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setBlendingModal({ open: true, item: b })} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg dark:hover:bg-blue-900/30"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => deleteBlending.mutate(b.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/30"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============ 2. GESTIÓN DE CALIDAD ============ */}
      <section id="quality" className="bg-white rounded-lg shadow dark:bg-gray-900 dark:border dark:border-gray-800">
        <div className="flex items-center justify-between px-5 pt-5">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-purple-600" /> Gestión de Calidad
            </h2>
            <p className="text-sm text-gray-500">Monitoreo de pureza y granulometría, y registro de datos de producción.</p>
          </div>
          <button onClick={() => setQualityModal({ open: true, item: { ...emptyQuality } })} className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium">
            <Plus className="w-4 h-4" /> Registrar control
          </button>
        </div>
        <div className="p-5">
          {(quality ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No hay controles de calidad registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <th className="px-3 py-2">Material</th>
                    <th className="px-3 py-2 text-right">Pureza %</th>
                    <th className="px-3 py-2">Granulometría</th>
                    <th className="px-3 py-2">Industria</th>
                    <th className="px-3 py-2">Fecha</th>
                    <th className="px-3 py-2">Estado</th>
                    <th className="px-3 py-2 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {(quality ?? []).map((q: QualityItem) => (
                    <tr key={q.id} className="text-sm text-gray-700 dark:text-gray-300">
                      <td className="px-3 py-3 font-medium">{q.material}</td>
                      <td className="px-3 py-3 text-right">{q.purity != null ? `${q.purity}%` : '—'}</td>
                      <td className="px-3 py-3">{q.granulometry || '—'}</td>
                      <td className="px-3 py-3">{q.industry || '—'}</td>
                      <td className="px-3 py-3">{fmtDate(q.checked_date)}</td>
                      <td className="px-3 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[q.status] || ''}`}>{q.status}</span></td>
                      <td className="px-3 py-3 text-right">
                        <button onClick={() => setQualityModal({ open: true, item: q })} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg dark:hover:bg-blue-900/30"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => deleteQuality.mutate(q.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/30"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ============ 3. SEGURIDAD Y MEDIO AMBIENTE ============ */}
      <section id="safety" className="bg-white rounded-lg shadow dark:bg-gray-900 dark:border dark:border-gray-800">
        <div className="flex items-center justify-between px-5 pt-5">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-orange-600" /> Seguridad y Medio Ambiente
            </h2>
            <p className="text-sm text-gray-500">Protocolos EPP / IPERC y control de riesgos del entorno (ventilación, polución).</p>
          </div>
          <button onClick={() => setSafetyModal({ open: true, item: { ...emptySafety } })} className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium">
            <Plus className="w-4 h-4" /> Registrar
          </button>
        </div>
        <div className="p-5">
          {(safety ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No hay registros de seguridad y medio ambiente.</p>
          ) : (
            <div className="space-y-2">
              {(safety ?? []).map((s: SafetyItem) => (
                <div key={s.id} className="flex items-center justify-between flex-wrap gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900 dark:text-white">{s.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[s.status] || ''}`}>{s.status}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${riskColors[s.risk_level] || ''}`}>Riesgo {s.risk_level}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">{safetyTypeLabels[s.type] || s.type}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      <ShieldCheck className="w-3 h-3 inline mr-1" />{fmtDate(s.checked_date)}
                      {s.description ? <span className="ml-2">· {s.description}</span> : null}
                    </p>
                    {s.action_plan ? <p className="text-xs text-gray-500 mt-0.5"><Target className="w-3 h-3 inline mr-1" />{s.action_plan}</p> : null}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setSafetyModal({ open: true, item: s })} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg dark:hover:bg-blue-900/30"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => deleteSafety.mutate(s.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/30"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============ 4. LIDERAZGO DE EQUIPO ============ */}
      <section id="team" className="bg-white rounded-lg shadow dark:bg-gray-900 dark:border dark:border-gray-800">
        <div className="flex items-center justify-between px-5 pt-5">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" /> Liderazgo de Equipo
            </h2>
            <p className="text-sm text-gray-500">Asignación de tareas al personal técnico y operativo según sus habilidades.</p>
          </div>
          <button onClick={() => setTaskModal({ open: true, item: { ...emptyTask } })} className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
            <Plus className="w-4 h-4" /> Asignar tarea
          </button>
        </div>
        <div className="p-5">
          {(tasks ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No hay tareas asignadas.</p>
          ) : (
            <div className="space-y-2">
              {(tasks ?? []).map((t: TaskItem) => (
                <div key={t.id} className="flex items-center justify-between flex-wrap gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900 dark:text-white">{t.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[t.status] || ''}`}>{t.status}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[t.priority] || ''}`}>{t.priority}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      <UserCog className="w-3 h-3 inline mr-1" />{t.assignee || 'Sin asignar'}
                      {t.due_date ? <span className="ml-2"><Calendar className="w-3 h-3 inline mr-1" />{fmtDate(t.due_date)}</span> : null}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setTaskModal({ open: true, item: t })} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg dark:hover:bg-blue-900/30"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => deleteTask.mutate(t.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/30"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* MODALS */}
      {planningModal.open && (
        <Modal title={planningModal.item?.id ? 'Editar actividad' : 'Planificar actividad'} onClose={() => setPlanningModal({ open: false, item: null })}>
          <form onSubmit={(e) => { e.preventDefault(); savePlanning.mutate({ id: planningModal.item?.id || undefined, data: planningModal.item }) }} className="space-y-4">
            <div>
              <label className={labelCls}>Título *</label>
              <input type="text" required value={planningModal.item?.title || ''} onChange={(e) => setPlanningModal({ open: true, item: { ...planningModal.item!, title: e.target.value } })} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Tipo de actividad</label>
                <select value={planningModal.item?.activity_type || 'extraccion'} onChange={(e) => setPlanningModal({ open: true, item: { ...planningModal.item!, activity_type: e.target.value } })} className={inputCls}>
                  {Object.entries(activityLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Estado</label>
                <select value={planningModal.item?.status || 'planificado'} onChange={(e) => setPlanningModal({ open: true, item: { ...planningModal.item!, status: e.target.value } })} className={inputCls}>
                  {['planificado', 'en_proceso', 'completado', 'cancelado'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Fecha *</label>
                <input type="date" required value={planningModal.item?.planned_date || ''} onChange={(e) => setPlanningModal({ open: true, item: { ...planningModal.item!, planned_date: e.target.value } })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Área</label>
                <input type="text" value={planningModal.item?.area || ''} onChange={(e) => setPlanningModal({ open: true, item: { ...planningModal.item!, area: e.target.value } })} className={inputCls} placeholder="Cantera, planta..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Hora inicio</label>
                <input type="time" value={planningModal.item?.start_time || ''} onChange={(e) => setPlanningModal({ open: true, item: { ...planningModal.item!, start_time: e.target.value } })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Hora fin</label>
                <input type="time" value={planningModal.item?.end_time || ''} onChange={(e) => setPlanningModal({ open: true, item: { ...planningModal.item!, end_time: e.target.value } })} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Personal asignado</label>
              <input type="text" value={planningModal.item?.assigned_person || ''} onChange={(e) => setPlanningModal({ open: true, item: { ...planningModal.item!, assigned_person: e.target.value } })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Notas</label>
              <textarea value={planningModal.item?.notes || ''} onChange={(e) => setPlanningModal({ open: true, item: { ...planningModal.item!, notes: e.target.value } })} className={inputCls} rows={2} />
            </div>
            {savePlanning.isError && <p className="text-sm text-red-600">{errMsg(savePlanning.error, 'Error al guardar la actividad.')}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setPlanningModal({ open: false, item: null })} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">Cancelar</button>
              <button type="submit" disabled={savePlanning.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">Guardar</button>
            </div>
          </form>
        </Modal>
      )}

      {receptionModal.open && (
        <Modal title={receptionModal.item?.id ? 'Editar registro' : 'Registrar recepción/trituración'} onClose={() => setReceptionModal({ open: false, item: null })}>
          <form onSubmit={(e) => { e.preventDefault(); saveReception.mutate({ id: receptionModal.item?.id || undefined, data: receptionModal.item }) }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Etapa</label>
                <select value={receptionModal.item?.stage || 'recepcion'} onChange={(e) => setReceptionModal({ open: true, item: { ...receptionModal.item!, stage: e.target.value } })} className={inputCls}>
                  {Object.entries(stageLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Estado</label>
                <select value={receptionModal.item?.status || 'recibido'} onChange={(e) => setReceptionModal({ open: true, item: { ...receptionModal.item!, status: e.target.value } })} className={inputCls}>
                  {['recibido', 'en_proceso', 'completado', 'cancelado'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Material *</label>
              <input type="text" required value={receptionModal.item?.material || ''} onChange={(e) => setReceptionModal({ open: true, item: { ...receptionModal.item!, material: e.target.value } })} className={inputCls} placeholder="Caliza cruda..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Tonelaje (t)</label>
                <input type="number" step="0.01" min="0" value={receptionModal.item?.tonnage ?? 0} onChange={(e) => setReceptionModal({ open: true, item: { ...receptionModal.item!, tonnage: Number(e.target.value) } })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Fecha *</label>
                <input type="date" required value={receptionModal.item?.processed_date || ''} onChange={(e) => setReceptionModal({ open: true, item: { ...receptionModal.item!, processed_date: e.target.value } })} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Origen</label>
              <input type="text" value={receptionModal.item?.origin || ''} onChange={(e) => setReceptionModal({ open: true, item: { ...receptionModal.item!, origin: e.target.value } })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Notas</label>
              <textarea value={receptionModal.item?.notes || ''} onChange={(e) => setReceptionModal({ open: true, item: { ...receptionModal.item!, notes: e.target.value } })} className={inputCls} rows={2} />
            </div>
            {saveReception.isError && <p className="text-sm text-red-600">{errMsg(saveReception.error, 'Error al guardar el registro.')}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setReceptionModal({ open: false, item: null })} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">Cancelar</button>
              <button type="submit" disabled={saveReception.isPending} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 text-sm font-medium">Guardar</button>
            </div>
          </form>
        </Modal>
      )}

      {blendingModal.open && (
        <Modal title={blendingModal.item?.id ? 'Editar mezcla' : 'Nueva mezcla'} onClose={() => setBlendingModal({ open: false, item: null })}>
          <form onSubmit={(e) => { e.preventDefault(); saveBlending.mutate({ id: blendingModal.item?.id || undefined, data: blendingModal.item }) }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Título *</label>
                <input type="text" required value={blendingModal.item?.title || ''} onChange={(e) => setBlendingModal({ open: true, item: { ...blendingModal.item!, title: e.target.value } })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Estado</label>
                <select value={blendingModal.item?.status || 'planificado'} onChange={(e) => setBlendingModal({ open: true, item: { ...blendingModal.item!, status: e.target.value } })} className={inputCls}>
                  {['planificado', 'en_proceso', 'completado', 'cancelado'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Materias primas</label>
              <input type="text" value={blendingModal.item?.materials || ''} onChange={(e) => setBlendingModal({ open: true, item: { ...blendingModal.item!, materials: e.target.value } })} className={inputCls} placeholder="Caliza, arcilla, arena..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Especificación objetivo</label>
                <input type="number" step="0.01" value={blendingModal.item?.target_spec ?? ''} onChange={(e) => setBlendingModal({ open: true, item: { ...blendingModal.item!, target_spec: e.target.value === '' ? null : Number(e.target.value) } })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Fecha *</label>
                <input type="date" required value={blendingModal.item?.blend_date || ''} onChange={(e) => setBlendingModal({ open: true, item: { ...blendingModal.item!, blend_date: e.target.value } })} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Notas</label>
              <textarea value={blendingModal.item?.notes || ''} onChange={(e) => setBlendingModal({ open: true, item: { ...blendingModal.item!, notes: e.target.value } })} className={inputCls} rows={2} />
            </div>
            {saveBlending.isError && <p className="text-sm text-red-600">{errMsg(saveBlending.error, 'Error al guardar la mezcla.')}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setBlendingModal({ open: false, item: null })} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">Cancelar</button>
              <button type="submit" disabled={saveBlending.isPending} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium">Guardar</button>
            </div>
          </form>
        </Modal>
      )}

      {qualityModal.open && (
        <Modal title={qualityModal.item?.id ? 'Editar control' : 'Registrar control de calidad'} onClose={() => setQualityModal({ open: false, item: null })}>
          <form onSubmit={(e) => { e.preventDefault(); saveQuality.mutate({ id: qualityModal.item?.id || undefined, data: qualityModal.item }) }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Material *</label>
                <input type="text" required value={qualityModal.item?.material || ''} onChange={(e) => setQualityModal({ open: true, item: { ...qualityModal.item!, material: e.target.value } })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Industria</label>
                <input type="text" value={qualityModal.item?.industry || ''} onChange={(e) => setQualityModal({ open: true, item: { ...qualityModal.item!, industry: e.target.value } })} className={inputCls} placeholder="Agricultura, construcción..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Pureza (%)</label>
                <input type="number" step="0.01" min="0" max="100" value={qualityModal.item?.purity ?? ''} onChange={(e) => setQualityModal({ open: true, item: { ...qualityModal.item!, purity: e.target.value === '' ? null : Number(e.target.value) } })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Granulometría</label>
                <input type="text" value={qualityModal.item?.granulometry || ''} onChange={(e) => setQualityModal({ open: true, item: { ...qualityModal.item!, granulometry: e.target.value } })} className={inputCls} placeholder="0-5 mm..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Estado</label>
                <select value={qualityModal.item?.status || 'pendiente'} onChange={(e) => setQualityModal({ open: true, item: { ...qualityModal.item!, status: e.target.value } })} className={inputCls}>
                  {['cumple', 'no_cumple', 'pendiente'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Fecha *</label>
                <input type="date" required value={qualityModal.item?.checked_date || ''} onChange={(e) => setQualityModal({ open: true, item: { ...qualityModal.item!, checked_date: e.target.value } })} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Notas</label>
              <textarea value={qualityModal.item?.notes || ''} onChange={(e) => setQualityModal({ open: true, item: { ...qualityModal.item!, notes: e.target.value } })} className={inputCls} rows={2} />
            </div>
            {saveQuality.isError && <p className="text-sm text-red-600">{errMsg(saveQuality.error, 'Error al guardar el control.')}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setQualityModal({ open: false, item: null })} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">Cancelar</button>
              <button type="submit" disabled={saveQuality.isPending} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium">Guardar</button>
            </div>
          </form>
        </Modal>
      )}

      {safetyModal.open && (
        <Modal title={safetyModal.item?.id ? 'Editar registro' : 'Registrar seguridad/medio ambiente'} onClose={() => setSafetyModal({ open: false, item: null })}>
          <form onSubmit={(e) => { e.preventDefault(); saveSafety.mutate({ id: safetyModal.item?.id || undefined, data: safetyModal.item }) }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Tipo</label>
                <select value={safetyModal.item?.type || 'protocolo_epp'} onChange={(e) => setSafetyModal({ open: true, item: { ...safetyModal.item!, type: e.target.value } })} className={inputCls}>
                  {Object.entries(safetyTypeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Nivel de riesgo</label>
                <select value={safetyModal.item?.risk_level || 'medio'} onChange={(e) => setSafetyModal({ open: true, item: { ...safetyModal.item!, risk_level: e.target.value } })} className={inputCls}>
                  {['bajo', 'medio', 'alto', 'critico'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Título *</label>
                <input type="text" required value={safetyModal.item?.title || ''} onChange={(e) => setSafetyModal({ open: true, item: { ...safetyModal.item!, title: e.target.value } })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Estado</label>
                <select value={safetyModal.item?.status || 'pendiente'} onChange={(e) => setSafetyModal({ open: true, item: { ...safetyModal.item!, status: e.target.value } })} className={inputCls}>
                  {['pendiente', 'en_atencion', 'verificado', 'incumplido'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Descripción</label>
              <textarea value={safetyModal.item?.description || ''} onChange={(e) => setSafetyModal({ open: true, item: { ...safetyModal.item!, description: e.target.value } })} className={inputCls} rows={2} />
            </div>
            <div>
              <label className={labelCls}>Fecha *</label>
              <input type="date" required value={safetyModal.item?.checked_date || ''} onChange={(e) => setSafetyModal({ open: true, item: { ...safetyModal.item!, checked_date: e.target.value } })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Plan de acción</label>
              <textarea value={safetyModal.item?.action_plan || ''} onChange={(e) => setSafetyModal({ open: true, item: { ...safetyModal.item!, action_plan: e.target.value } })} className={inputCls} rows={2} />
            </div>
            {saveSafety.isError && <p className="text-sm text-red-600">{errMsg(saveSafety.error, 'Error al guardar el registro.')}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setSafetyModal({ open: false, item: null })} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">Cancelar</button>
              <button type="submit" disabled={saveSafety.isPending} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm font-medium">Guardar</button>
            </div>
          </form>
        </Modal>
      )}

      {taskModal.open && (
        <Modal title={taskModal.item?.id ? 'Editar tarea' : 'Asignar tarea'} onClose={() => setTaskModal({ open: false, item: null })}>
          <form onSubmit={(e) => { e.preventDefault(); saveTask.mutate({ id: taskModal.item?.id || undefined, data: taskModal.item }) }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Título *</label>
                <input type="text" required value={taskModal.item?.title || ''} onChange={(e) => setTaskModal({ open: true, item: { ...taskModal.item!, title: e.target.value } })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Prioridad</label>
                <select value={taskModal.item?.priority || 'media'} onChange={(e) => setTaskModal({ open: true, item: { ...taskModal.item!, priority: e.target.value } })} className={inputCls}>
                  {['alta', 'media', 'baja'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Asignado a</label>
                <input type="text" value={taskModal.item?.assignee || ''} onChange={(e) => setTaskModal({ open: true, item: { ...taskModal.item!, assignee: e.target.value } })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Estado</label>
                <select value={taskModal.item?.status || 'pendiente'} onChange={(e) => setTaskModal({ open: true, item: { ...taskModal.item!, status: e.target.value } })} className={inputCls}>
                  {['pendiente', 'en_proceso', 'completada', 'cancelada'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Fecha límite</label>
              <input type="date" value={taskModal.item?.due_date || ''} onChange={(e) => setTaskModal({ open: true, item: { ...taskModal.item!, due_date: e.target.value } })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Notas</label>
              <textarea value={taskModal.item?.notes || ''} onChange={(e) => setTaskModal({ open: true, item: { ...taskModal.item!, notes: e.target.value } })} className={inputCls} rows={2} />
            </div>
            {saveTask.isError && <p className="text-sm text-red-600">{errMsg(saveTask.error, 'Error al guardar la tarea.')}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setTaskModal({ open: false, item: null })} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">Cancelar</button>
              <button type="submit" disabled={saveTask.isPending} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium">Guardar</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto dark:bg-gray-900 dark:border dark:border-gray-800">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
