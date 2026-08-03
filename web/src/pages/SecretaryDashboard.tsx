import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { secretaryApi, whatsappApi, notesApi, pettyCashApi } from '../services/api'
import {
  Calendar,
  Phone,
  FolderArchive,
  ClipboardList,
  MessageCircle,
  StickyNote,
  Wallet,
  Plus,
  Pencil,
  Trash2,
  X,
  Users,
  CheckCircle2,
  Lock,
  Mail,
  LogIn,
} from 'lucide-react'

interface AgendaItem {
  id: string
  title: string
  event_type: 'cita' | 'reunion'
  mode: 'presencial' | 'virtual'
  starts_at: string
  ends_at: string
  participants?: string | null
  location?: string | null
  notes?: string | null
  status: string
}

interface ReceptionItem {
  id: string
  type: 'visita' | 'llamada' | 'consulta'
  person_name: string
  company?: string | null
  phone?: string | null
  subject?: string | null
  notes?: string | null
  status: string
  attended_at: string
}

interface DocumentItem {
  id: string
  title: string
  category: string
  format: 'fisico' | 'digital'
  location?: string | null
  notes?: string | null
}

interface LogisticItem {
  id: string
  type: 'sala' | 'suministro' | 'viaje' | 'reserva'
  title: string
  details?: string | null
  date?: string | null
  status: string
}

type ModalState<T> = { open: boolean; item: T | null }

const emptyAgenda: AgendaItem = { id: '', title: '', event_type: 'cita', mode: 'presencial', starts_at: '', ends_at: '', participants: '', location: '', notes: '', status: 'pendiente' }
const emptyReception: ReceptionItem = { id: '', type: 'visita', person_name: '', company: '', phone: '', subject: '', notes: '', status: 'recibido', attended_at: '' }
const emptyDocument: DocumentItem = { id: '', title: '', category: '', format: 'digital', location: '', notes: '' }
const emptyLogistic: LogisticItem = { id: '', type: 'suministro', title: '', details: '', date: '', status: 'pendiente' }

const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
const labelCls = "block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300"

const agendaStatusColors: Record<string, string> = {
  pendiente: 'bg-amber-100 text-amber-700',
  confirmada: 'bg-blue-100 text-blue-700',
  realizada: 'bg-green-100 text-green-700',
  cancelada: 'bg-red-100 text-red-700',
}
const receptionStatusColors: Record<string, string> = {
  recibido: 'bg-amber-100 text-amber-700',
  canalizado: 'bg-blue-100 text-blue-700',
  atendido: 'bg-green-100 text-green-700',
}
const logisticStatusColors: Record<string, string> = {
  pendiente: 'bg-amber-100 text-amber-700',
  en_proceso: 'bg-blue-100 text-blue-700',
  completado: 'bg-green-100 text-green-700',
  cancelado: 'bg-red-100 text-red-700',
}

const fmt = (iso?: string | null) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const errMsg = (e: any, fallback: string) => {
  const msg = e?.response?.data?.message
  if (typeof msg === 'string') return msg
  const first = e?.response?.data?.errors
  if (first) { const k = Object.keys(first)[0]; return first[k]?.[0] || fallback }
  return fallback
}

export default function SecretaryDashboard() {
  const queryClient = useQueryClient()
  const [agendaModal, setAgendaModal] = useState<ModalState<AgendaItem>>({ open: false, item: null })
  const [receptionModal, setReceptionModal] = useState<ModalState<ReceptionItem>>({ open: false, item: null })
  const [docModal, setDocModal] = useState<ModalState<DocumentItem>>({ open: false, item: null })
  const [logisticModal, setLogisticModal] = useState<ModalState<LogisticItem>>({ open: false, item: null })

  const { data: summary } = useQuery({
    queryKey: ['secretary-summary'],
    queryFn: () => secretaryApi.getSummary().then((r) => r.data),
    refetchInterval: 30000,
  })

  const { data: agenda } = useQuery({
    queryKey: ['secretary-agenda'],
    queryFn: () => secretaryApi.getAgenda().then((r) => r.data),
  })

  const { data: reception } = useQuery({
    queryKey: ['secretary-reception'],
    queryFn: () => secretaryApi.getReception().then((r) => r.data),
  })

  const { data: documents } = useQuery({
    queryKey: ['secretary-documents'],
    queryFn: () => secretaryApi.getDocuments().then((r) => r.data),
  })

  const { data: logistics } = useQuery({
    queryKey: ['secretary-logistics'],
    queryFn: () => secretaryApi.getLogistics().then((r) => r.data),
  })

  const { data: whatsappSummary } = useQuery({
    queryKey: ['whatsapp-summary'],
    queryFn: () => whatsappApi.getSummary().then((r) => r.data),
  })

  const { data: notesData } = useQuery({
    queryKey: ['notes-list'],
    queryFn: () => notesApi.getAll({ limit: 5 }).then((r) => r.data),
  })

  const { data: pettyCashSummary } = useQuery({
    queryKey: ['petty-cash-summary'],
    queryFn: () => pettyCashApi.getSummary().then((r) => r.data),
  })

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['secretary-summary'] })
    queryClient.invalidateQueries({ queryKey: ['secretary-agenda'] })
    queryClient.invalidateQueries({ queryKey: ['secretary-reception'] })
    queryClient.invalidateQueries({ queryKey: ['secretary-documents'] })
    queryClient.invalidateQueries({ queryKey: ['secretary-logistics'] })
    queryClient.invalidateQueries({ queryKey: ['whatsapp-summary'] })
    queryClient.invalidateQueries({ queryKey: ['notes-list'] })
    queryClient.invalidateQueries({ queryKey: ['petty-cash-summary'] })
  }

  const saveAgenda = useMutation({
    mutationFn: ({ id, data }: { id?: string; data: any }) =>
      id ? secretaryApi.updateAgenda(id, data) : secretaryApi.createAgenda(data),
    onSuccess: () => { setAgendaModal({ open: false, item: null }); invalidateAll() },
  })

  const deleteAgenda = useMutation({
    mutationFn: (id: string) => secretaryApi.deleteAgenda(id),
    onSuccess: () => invalidateAll(),
  })

  const saveReception = useMutation({
    mutationFn: ({ id, data }: { id?: string; data: any }) =>
      id ? secretaryApi.updateReception(id, data) : secretaryApi.createReception(data),
    onSuccess: () => { setReceptionModal({ open: false, item: null }); invalidateAll() },
  })

  const deleteReception = useMutation({
    mutationFn: (id: string) => secretaryApi.deleteReception(id),
    onSuccess: () => invalidateAll(),
  })

  const saveDocument = useMutation({
    mutationFn: ({ id, data }: { id?: string; data: any }) =>
      id ? secretaryApi.updateDocument(id, data) : secretaryApi.createDocument(data),
    onSuccess: () => { setDocModal({ open: false, item: null }); invalidateAll() },
  })

  const deleteDocument = useMutation({
    mutationFn: (id: string) => secretaryApi.deleteDocument(id),
    onSuccess: () => invalidateAll(),
  })

  const saveLogistic = useMutation({
    mutationFn: ({ id, data }: { id?: string; data: any }) =>
      id ? secretaryApi.updateLogistic(id, data) : secretaryApi.createLogistic(data),
    onSuccess: () => { setLogisticModal({ open: false, item: null }); invalidateAll() },
  })

  const deleteLogistic = useMutation({
    mutationFn: (id: string) => secretaryApi.deleteLogistic(id),
    onSuccess: () => invalidateAll(),
  })

  const cards = [
    { label: 'Citas y reuniones hoy', value: summary?.agenda?.today ?? 0, icon: Calendar, color: 'bg-blue-100 text-blue-600', link: '#agenda' },
    { label: 'Próximas en agenda', value: summary?.agenda?.upcoming ?? 0, icon: Calendar, color: 'bg-indigo-100 text-indigo-600', link: '#agenda' },
    { label: 'Atención hoy', value: summary?.reception?.today ?? 0, icon: Users, color: 'bg-purple-100 text-purple-600', link: '#reception' },
    { label: 'Mensajes sin leer', value: summary?.whatsapp?.unread ?? 0, icon: MessageCircle, color: 'bg-green-100 text-green-600', link: '/whatsapp' },
    { label: 'Documentos archivados', value: summary?.documents ?? 0, icon: FolderArchive, color: 'bg-amber-100 text-amber-600', link: '#archive' },
    { label: 'Caja chica (B/.', value: (summary?.petty_cash?.balance ?? 0).toLocaleString('es-MX') + ')', icon: Wallet, color: 'bg-emerald-100 text-emerald-600', link: '/petty-cash' },
  ]

  const NotesWidget = () => (
    <div className="bg-white rounded-lg shadow p-5 dark:bg-gray-900 dark:border dark:border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <StickyNote className="w-5 h-5 text-blue-600" /> Notas de Oficina
        </h3>
        <Link to="/notes" className="text-xs font-medium text-blue-600 hover:underline">Ver todas</Link>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
        Redacción de memorandos, cartas, oficios e informes. {summary?.notes ?? 0} notas registradas.
      </p>
      <div className="space-y-2">
        {(notesData ?? []).slice(0, 4).map((n: any) => (
          <div key={n.id} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{n.title}</p>
              <p className="text-xs text-gray-400">{n.note_type}</p>
            </div>
          </div>
        ))}
        {(notesData ?? []).length === 0 && (
          <p className="text-sm text-gray-400">No hay notas registradas.</p>
        )}
      </div>
      <Link to="/notes" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline">
        <Pencil className="w-4 h-4" /> Redactar nota
      </Link>
    </div>
  )

  const CorrespondenceWidget = () => (
    <div className="bg-white rounded-lg shadow p-5 dark:bg-gray-900 dark:border dark:border-gray-800">
      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
        <Mail className="w-5 h-5 text-purple-600" /> Comunicación y Correspondencia
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
        Redacte y clasifique la correspondencia diaria con las Notas de Oficina y responda consultas por WhatsApp.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Link to="/notes" className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium">
          <Pencil className="w-5 h-5" /> Redactar
        </Link>
        <Link to="/whatsapp" className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium">
          <MessageCircle className="w-5 h-5" /> Responder
        </Link>
      </div>
    </div>
  )

  const ConfidentialWidget = () => (
    <div className="bg-white rounded-lg shadow p-5 dark:bg-gray-900 dark:border dark:border-gray-800">
      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
        <Lock className="w-5 h-5 text-red-600" /> Información Confidencial
      </h3>
      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
        <p className="flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
          Contratos, datos personales y financieros bajo estricta confidencialidad.
        </p>
        <p className="flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
          Documentos archivados protegidos por categoría y ubicación.
        </p>
        <p className="flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
          Discreción al filtrar la comunicación hacia los directivos.
        </p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Espacio de Trabajo · Secretaria</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Agenda, recepción, correspondencia, archivo, logística y apoyo administrativo</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((c) => (
          <a key={c.label} href={c.link.startsWith('/') ? c.link : undefined} onClick={c.link.startsWith('#') ? (e) => { e.preventDefault(); document.querySelector(c.link)?.scrollIntoView({ behavior: 'smooth' }) } : undefined} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow dark:bg-gray-900 dark:border dark:border-gray-800">
            <div className={`p-2 rounded-full ${c.color} w-fit mb-2`}>
              <c.icon className="w-5 h-5" />
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{c.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{c.label}</p>
          </a>
        ))}
      </div>

      {/* AGENDA */}
      <section id="agenda" className="bg-white rounded-lg shadow dark:bg-gray-900 dark:border dark:border-gray-800">
        <div className="flex items-center justify-between px-5 pt-5">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" /> Gestión de la Agenda
            </h2>
            <p className="text-sm text-gray-500">Organice citas y reuniones (presenciales o virtuales). Se evita la superposición de eventos.</p>
          </div>
          <button onClick={() => setAgendaModal({ open: true, item: { ...emptyAgenda } })} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            <Plus className="w-4 h-4" /> Nuevo evento
          </button>
        </div>
        <div className="p-5">
          {(agenda ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No hay citas ni reuniones programadas.</p>
          ) : (
            <div className="space-y-2">
              {(agenda ?? []).map((a: AgendaItem) => (
                <div key={a.id} className="flex items-center justify-between flex-wrap gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900 dark:text-white">{a.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${agendaStatusColors[a.status] || ''}`}>{a.status}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">{a.event_type}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">{a.mode}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      <Calendar className="w-3 h-3 inline mr-1" />{fmt(a.starts_at)} → {fmt(a.ends_at)}
                      {a.location ? <span className="ml-2">· {a.location}</span> : null}
                    </p>
                    {a.participants ? <p className="text-xs text-gray-500 mt-0.5"><Users className="w-3 h-3 inline mr-1" />{a.participants}</p> : null}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setAgendaModal({ open: true, item: a })} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg dark:hover:bg-blue-900/30"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => deleteAgenda.mutate(a.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/30"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* RECEPCIÓN */}
      <section id="reception" className="bg-white rounded-lg shadow dark:bg-gray-900 dark:border dark:border-gray-800">
        <div className="flex items-center justify-between px-5 pt-5">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" /> Atención al Cliente y Recepción
            </h2>
            <p className="text-sm text-gray-500">Recibir visitantes, atender llamadas y canalizar consultas.</p>
          </div>
          <button onClick={() => setReceptionModal({ open: true, item: { ...emptyReception } })} className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium">
            <Plus className="w-4 h-4" /> Registrar
          </button>
        </div>
        <div className="p-5">
          {(reception ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No hay registros de recepción.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2">Persona</th>
                    <th className="px-3 py-2">Empresa / Tel</th>
                    <th className="px-3 py-2">Motivo</th>
                    <th className="px-3 py-2">Estado</th>
                    <th className="px-3 py-2 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {(reception ?? []).map((r: ReceptionItem) => (
                    <tr key={r.id} className="text-sm text-gray-700 dark:text-gray-300">
                      <td className="px-3 py-3 capitalize">{r.type}</td>
                      <td className="px-3 py-3 font-medium">{r.person_name}</td>
                      <td className="px-3 py-3">{r.company || '—'}{r.phone ? <span className="block text-xs text-gray-400">{r.phone}</span> : null}</td>
                      <td className="px-3 py-3 max-w-[240px] truncate">{r.subject || '—'}</td>
                      <td className="px-3 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${receptionStatusColors[r.status] || ''}`}>{r.status}</span></td>
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

      {/* ARCHIVO */}
      <section id="archive" className="bg-white rounded-lg shadow dark:bg-gray-900 dark:border dark:border-gray-800">
        <div className="flex items-center justify-between px-5 pt-5">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FolderArchive className="w-5 h-5 text-amber-600" /> Archivo y Documentación
            </h2>
            <p className="text-sm text-gray-500">Organizar, clasificar y archivar documentos físicos y digitales.</p>
          </div>
          <button onClick={() => setDocModal({ open: true, item: { ...emptyDocument } })} className="flex items-center gap-2 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium">
            <Plus className="w-4 h-4" /> Archivar
          </button>
        </div>
        <div className="p-5">
          {(documents ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No hay documentos archivados.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(documents ?? []).map((d: DocumentItem) => (
                <div key={d.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-gray-900 dark:text-white">{d.title}</p>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => setDocModal({ open: true, item: d })} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg dark:hover:bg-blue-900/30"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteDocument.mutate(d.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/30"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1"><span className="font-medium">{d.category}</span> · {d.format}</p>
                  {d.location ? <p className="text-xs text-gray-400 mt-0.5">📍 {d.location}</p> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* LOGÍSTICA */}
      <section id="logistics" className="bg-white rounded-lg shadow dark:bg-gray-900 dark:border dark:border-gray-800">
        <div className="flex items-center justify-between px-5 pt-5">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-emerald-600" /> Soporte Administrativo y Logístico
            </h2>
            <p className="text-sm text-gray-500">Preparar salas, gestionar suministros, viajes y reservas.</p>
          </div>
          <button onClick={() => setLogisticModal({ open: true, item: { ...emptyLogistic } })} className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium">
            <Plus className="w-4 h-4" /> Nueva tarea
          </button>
        </div>
        <div className="p-5">
          {(logistics ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No hay tareas logísticas.</p>
          ) : (
            <div className="space-y-2">
              {(logistics ?? []).map((l: LogisticItem) => (
                <div key={l.id} className="flex items-center justify-between flex-wrap gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900 dark:text-white">{l.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${logisticStatusColors[l.status] || ''}`}>{l.status}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      <span className="capitalize">{l.type}</span>
                      {l.date ? <span className="ml-2">· {fmt(l.date)}</span> : null}
                    </p>
                    {l.details ? <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xl">{l.details}</p> : null}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setLogisticModal({ open: true, item: l })} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg dark:hover:bg-blue-900/30"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => deleteLogistic.mutate(l.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/30"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* APOYO / RESÚMENES */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <NotesWidget />
        <CorrespondenceWidget />
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-5 dark:bg-gray-900 dark:border dark:border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-green-600" /> Mensajería WhatsApp
              </h3>
              <Link to="/whatsapp" className="text-xs font-medium text-green-600 hover:underline">Abrir</Link>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {whatsappSummary?.unread ?? 0} mensajes sin leer · {whatsappSummary?.active ?? 0} conversaciones activas.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-5 dark:bg-gray-900 dark:border dark:border-gray-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600" /> Caja Chica y Gastos
              </h3>
              <Link to="/petty-cash" className="text-xs font-medium text-emerald-600 hover:underline">Abrir</Link>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Saldo actual: <strong className="text-gray-900 dark:text-white">B/. {(summary?.petty_cash?.balance ?? 0).toLocaleString('es-MX')}</strong>
            </p>
          </div>
          <ConfidentialWidget />
        </div>
      </div>

      {/* MODALS */}
      {agendaModal.open && (
        <Modal title={agendaModal.item?.id ? 'Editar evento' : 'Nuevo evento'} onClose={() => setAgendaModal({ open: false, item: null })}>
          <form onSubmit={(e) => { e.preventDefault(); saveAgenda.mutate({ id: agendaModal.item?.id || undefined, data: agendaModal.item }) }} className="space-y-4">
            <div>
              <label className={labelCls}>Título *</label>
              <input type="text" required value={agendaModal.item?.title || ''} onChange={(e) => setAgendaModal({ open: true, item: { ...agendaModal.item!, title: e.target.value } })} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Tipo</label>
                <select value={agendaModal.item?.event_type || 'cita'} onChange={(e) => setAgendaModal({ open: true, item: { ...agendaModal.item!, event_type: e.target.value as any } })} className={inputCls}>
                  <option value="cita">Cita</option>
                  <option value="reunion">Reunión</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Modalidad</label>
                <select value={agendaModal.item?.mode || 'presencial'} onChange={(e) => setAgendaModal({ open: true, item: { ...agendaModal.item!, mode: e.target.value as any } })} className={inputCls}>
                  <option value="presencial">Presencial</option>
                  <option value="virtual">Virtual</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Inicio *</label>
                <input type="datetime-local" required value={agendaModal.item?.starts_at || ''} onChange={(e) => setAgendaModal({ open: true, item: { ...agendaModal.item!, starts_at: e.target.value } })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Fin *</label>
                <input type="datetime-local" required value={agendaModal.item?.ends_at || ''} onChange={(e) => setAgendaModal({ open: true, item: { ...agendaModal.item!, ends_at: e.target.value } })} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Participantes</label>
              <input type="text" value={agendaModal.item?.participants || ''} onChange={(e) => setAgendaModal({ open: true, item: { ...agendaModal.item!, participants: e.target.value } })} className={inputCls} placeholder="Nombres o cargos" />
            </div>
            <div>
              <label className={labelCls}>Ubicación / Enlace</label>
              <input type="text" value={agendaModal.item?.location || ''} onChange={(e) => setAgendaModal({ open: true, item: { ...agendaModal.item!, location: e.target.value } })} className={inputCls} placeholder="Sala o enlace de videollamada" />
            </div>
            <div>
              <label className={labelCls}>Estado</label>
              <select value={agendaModal.item?.status || 'pendiente'} onChange={(e) => setAgendaModal({ open: true, item: { ...agendaModal.item!, status: e.target.value } })} className={inputCls}>
                {['pendiente', 'confirmada', 'realizada', 'cancelada'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Notas</label>
              <textarea value={agendaModal.item?.notes || ''} onChange={(e) => setAgendaModal({ open: true, item: { ...agendaModal.item!, notes: e.target.value } })} className={inputCls} rows={2} />
            </div>
            {saveAgenda.isError && <p className="text-sm text-red-600">{errMsg(saveAgenda.error, 'Error al guardar. Verifique que el horario no se superponga con otro evento.')}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setAgendaModal({ open: false, item: null })} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">Cancelar</button>
              <button type="submit" disabled={saveAgenda.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">Guardar</button>
            </div>
          </form>
        </Modal>
      )}

      {receptionModal.open && (
        <Modal title={receptionModal.item?.id ? 'Editar registro' : 'Registrar recepción'} onClose={() => setReceptionModal({ open: false, item: null })}>
          <form onSubmit={(e) => { e.preventDefault(); saveReception.mutate({ id: receptionModal.item?.id || undefined, data: receptionModal.item }) }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Tipo *</label>
                <select value={receptionModal.item?.type || 'visita'} onChange={(e) => setReceptionModal({ open: true, item: { ...receptionModal.item!, type: e.target.value as any } })} className={inputCls}>
                  <option value="visita">Visita</option>
                  <option value="llamada">Llamada</option>
                  <option value="consulta">Consulta</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Estado</label>
                <select value={receptionModal.item?.status || 'recibido'} onChange={(e) => setReceptionModal({ open: true, item: { ...receptionModal.item!, status: e.target.value } })} className={inputCls}>
                  {['recibido', 'canalizado', 'atendido'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Nombre *</label>
              <input type="text" required value={receptionModal.item?.person_name || ''} onChange={(e) => setReceptionModal({ open: true, item: { ...receptionModal.item!, person_name: e.target.value } })} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Empresa</label>
                <input type="text" value={receptionModal.item?.company || ''} onChange={(e) => setReceptionModal({ open: true, item: { ...receptionModal.item!, company: e.target.value } })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Teléfono</label>
                <input type="text" value={receptionModal.item?.phone || ''} onChange={(e) => setReceptionModal({ open: true, item: { ...receptionModal.item!, phone: e.target.value } })} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Motivo</label>
              <input type="text" value={receptionModal.item?.subject || ''} onChange={(e) => setReceptionModal({ open: true, item: { ...receptionModal.item!, subject: e.target.value } })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Notas</label>
              <textarea value={receptionModal.item?.notes || ''} onChange={(e) => setReceptionModal({ open: true, item: { ...receptionModal.item!, notes: e.target.value } })} className={inputCls} rows={2} />
            </div>
            <div>
              <label className={labelCls}>Fecha y hora</label>
              <input type="datetime-local" value={receptionModal.item?.attended_at || ''} onChange={(e) => setReceptionModal({ open: true, item: { ...receptionModal.item!, attended_at: e.target.value } })} className={inputCls} />
            </div>
            {saveReception.isError && <p className="text-sm text-red-600">{errMsg(saveReception.error, 'Error al guardar el registro.')}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setReceptionModal({ open: false, item: null })} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">Cancelar</button>
              <button type="submit" disabled={saveReception.isPending} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium">Guardar</button>
            </div>
          </form>
        </Modal>
      )}

      {docModal.open && (
        <Modal title={docModal.item?.id ? 'Editar documento' : 'Archivar documento'} onClose={() => setDocModal({ open: false, item: null })}>
          <form onSubmit={(e) => { e.preventDefault(); saveDocument.mutate({ id: docModal.item?.id || undefined, data: docModal.item }) }} className="space-y-4">
            <div>
              <label className={labelCls}>Título *</label>
              <input type="text" required value={docModal.item?.title || ''} onChange={(e) => setDocModal({ open: true, item: { ...docModal.item!, title: e.target.value } })} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Categoría *</label>
                <input type="text" required value={docModal.item?.category || ''} onChange={(e) => setDocModal({ open: true, item: { ...docModal.item!, category: e.target.value } })} className={inputCls} placeholder="Contratos, Facturas, RRHH..." />
              </div>
              <div>
                <label className={labelCls}>Formato</label>
                <select value={docModal.item?.format || 'digital'} onChange={(e) => setDocModal({ open: true, item: { ...docModal.item!, format: e.target.value as any } })} className={inputCls}>
                  <option value="digital">Digital</option>
                  <option value="fisico">Físico</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Ubicación</label>
              <input type="text" value={docModal.item?.location || ''} onChange={(e) => setDocModal({ open: true, item: { ...docModal.item!, location: e.target.value } })} className={inputCls} placeholder="Archivo principal, carpeta 03 / Nube..." />
            </div>
            <div>
              <label className={labelCls}>Notas</label>
              <textarea value={docModal.item?.notes || ''} onChange={(e) => setDocModal({ open: true, item: { ...docModal.item!, notes: e.target.value } })} className={inputCls} rows={2} />
            </div>
            {saveDocument.isError && <p className="text-sm text-red-600">{errMsg(saveDocument.error, 'Error al guardar el documento.')}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setDocModal({ open: false, item: null })} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">Cancelar</button>
              <button type="submit" disabled={saveDocument.isPending} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 text-sm font-medium">Guardar</button>
            </div>
          </form>
        </Modal>
      )}

      {logisticModal.open && (
        <Modal title={logisticModal.item?.id ? 'Editar tarea' : 'Nueva tarea logística'} onClose={() => setLogisticModal({ open: false, item: null })}>
          <form onSubmit={(e) => { e.preventDefault(); saveLogistic.mutate({ id: logisticModal.item?.id || undefined, data: logisticModal.item }) }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Tipo</label>
                <select value={logisticModal.item?.type || 'suministro'} onChange={(e) => setLogisticModal({ open: true, item: { ...logisticModal.item!, type: e.target.value as any } })} className={inputCls}>
                  <option value="sala">Preparar sala</option>
                  <option value="suministro">Suministro</option>
                  <option value="viaje">Viaje</option>
                  <option value="reserva">Reserva</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Estado</label>
                <select value={logisticModal.item?.status || 'pendiente'} onChange={(e) => setLogisticModal({ open: true, item: { ...logisticModal.item!, status: e.target.value } })} className={inputCls}>
                  {['pendiente', 'en_proceso', 'completado', 'cancelado'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Título *</label>
              <input type="text" required value={logisticModal.item?.title || ''} onChange={(e) => setLogisticModal({ open: true, item: { ...logisticModal.item!, title: e.target.value } })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Detalles</label>
              <textarea value={logisticModal.item?.details || ''} onChange={(e) => setLogisticModal({ open: true, item: { ...logisticModal.item!, details: e.target.value } })} className={inputCls} rows={2} />
            </div>
            <div>
              <label className={labelCls}>Fecha</label>
              <input type="datetime-local" value={logisticModal.item?.date || ''} onChange={(e) => setLogisticModal({ open: true, item: { ...logisticModal.item!, date: e.target.value } })} className={inputCls} />
            </div>
            {saveLogistic.isError && <p className="text-sm text-red-600">{errMsg(saveLogistic.error, 'Error al guardar la tarea.')}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setLogisticModal({ open: false, item: null })} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">Cancelar</button>
              <button type="submit" disabled={saveLogistic.isPending} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium">Guardar</button>
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
