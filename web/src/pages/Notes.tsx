import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notesApi } from '../services/api'
import {
  Plus,
  Trash2,
  Save,
  Pencil,
  StickyNote,
  FileText,
  X,
  Download,
  Search
} from 'lucide-react'
import { noteTypeLabels, noteStatusLabels } from '../utils/wordNote'

const emptyForm = {
  title: '',
  body: '',
  note_type: 'general',
  note_date: new Date().toISOString().slice(0, 10),
  status: 'final',
  related_to: '',
}

export default function Notes() {
  const queryClient = useQueryClient()
  const today = new Date().toISOString().slice(0, 10)
  const [noteType, setNoteType] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<any>({ ...emptyForm })
  const [editing, setEditing] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const { data: notes, isLoading } = useQuery({
    queryKey: ['notes', noteType, status, search],
    queryFn: () => notesApi.getAll({ note_type: noteType || undefined, status: status || undefined, search: search || undefined }).then((r) => r.data),
  })

  const { data: summary } = useQuery({
    queryKey: ['notes-summary'],
    queryFn: () => notesApi.getSummary().then((r) => r.data),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['notes'] })

  const save = useMutation({
    mutationFn: (data: any) =>
      editing ? notesApi.update(editing.id, data) : notesApi.create(data),
    onSuccess: () => {
      invalidate()
      queryClient.invalidateQueries({ queryKey: ['notes-summary'] })
      setShowModal(false)
      setEditing(null)
      setForm({ ...emptyForm })
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => notesApi.delete(id),
    onSuccess: () => {
      invalidate()
      queryClient.invalidateQueries({ queryKey: ['notes-summary'] })
    },
  })

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm, note_date: today })
    setShowModal(true)
  }

  const openEdit = (n: any) => {
    setEditing(n)
    setForm({
      title: n.title || '',
      body: n.body || '',
      note_type: n.note_type || 'general',
      note_date: (n.note_date || '').slice(0, 10) || today,
      status: n.status || 'final',
      related_to: n.related_to || '',
    })
    setShowModal(true)
  }

  const handleWord = async (n: any) => {
    setDownloadingId(n.id)
    try {
      const res = await notesApi.getWord(n.id)
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${n.note_number || 'nota'}-${(n.title || 'sin-titulo')
        .replace(/\s+/g, '_')
        .replace(/[^\w\d\-_]/g, '')
        .slice(0, 40)}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error al generar el documento Word:', err)
    } finally {
      setDownloadingId(null)
    }
  }

  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600"
  const labelCls = "block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"

  const typeBadge = (t: string) => {
    const colors: Record<string, string> = {
      general: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      memorando: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      minuta: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
      oficio: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
      comunicado: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
      otro: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    }
    return colors[t] || colors.general
  }

  const summaryCards = [
    { label: 'Notas registradas', value: summary?.total_notes ?? 0, color: 'bg-blue-100 text-blue-600' },
    { label: 'Notas finales', value: summary?.total_final ?? 0, color: 'bg-green-100 text-green-600' },
    { label: 'Borradores', value: summary?.total_draft ?? 0, color: 'bg-amber-100 text-amber-600' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notas de Oficina</h1>
          <p className="text-sm text-gray-500">Memorandos, minutas, oficios y comunicados con respaldo en la base de datos</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select value={noteType} onChange={(e) => setNoteType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600">
            <option value="">Todos los tipos</option>
            {Object.entries(noteTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600">
            <option value="">Todos los estados</option>
            <option value="draft">Borrador</option>
            <option value="final">Final</option>
          </select>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            <Plus className="w-4 h-4" /> Nueva Nota
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryCards.map((c) => (
          <div key={c.label} className="bg-white rounded-lg shadow p-5 dark:bg-gray-900 dark:border dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${c.color}`}>
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{c.label}</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{c.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden dark:bg-gray-900 dark:border dark:border-gray-800">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between gap-2 dark:border-gray-700">
          <span className="font-semibold text-gray-700 dark:text-gray-200">Notas registradas</span>
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título, contenido..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (notes?.length || 0) === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            <StickyNote className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            No hay notas registradas.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {notes?.map((n: any) => (
              <div key={n.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeBadge(n.note_type)}`}>
                      {noteTypeLabels[n.note_type] || n.note_type}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">{n.note_number}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      n.status === 'final' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                    }`}>
                      {noteStatusLabels[n.status] || n.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{n.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {new Date(n.note_date + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
                    {n.creator?.name ? ` · ${n.creator.name}` : ''}
                    {n.related_to ? ` · Ref: ${n.related_to}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleWord(n)}
                    disabled={downloadingId === n.id}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                    title="Abrir en Word"
                  >
                    <Download className="w-4 h-4" />
                    {downloadingId === n.id ? 'Generando...' : 'Word'}
                  </button>
                  <button onClick={() => openEdit(n)} className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg dark:hover:bg-blue-900/20" title="Editar">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { if (confirm(`¿Eliminar la nota ${n.note_number}?`)) remove.mutate(n.id) }}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/20" title="Eliminar">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col dark:bg-gray-900 dark:border dark:border-gray-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-blue-600" />
                {editing ? `Editar ${editing.note_number}` : 'Nueva Nota de Oficina'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); save.mutate(form) }} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Título *</label>
                  <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inputCls} placeholder="Asunto de la nota" />
                </div>
                <div>
                  <label className={labelCls}>Fecha *</label>
                  <input required type="date" value={form.note_date} onChange={e => setForm({ ...form, note_date: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Tipo de nota *</label>
                  <select value={form.note_type} onChange={e => setForm({ ...form, note_type: e.target.value })} className={inputCls}>
                    {Object.entries(noteTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Estado *</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inputCls}>
                    <option value="final">Final</option>
                    <option value="draft">Borrador</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Referente a (opcional)</label>
                  <input value={form.related_to} onChange={e => setForm({ ...form, related_to: e.target.value })} className={inputCls} placeholder="Ej. Planta, Cantera, Cliente..." />
                </div>
              </div>
              <div>
                <label className={labelCls}>Contenido de la nota *</label>
                <textarea required value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={8} className={inputCls} placeholder="Escriba el contenido completo de la nota..." />
              </div>

              {save.isError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm dark:bg-red-900/30 dark:border-red-700 dark:text-red-200">
                  {(save.error as any)?.response?.data?.message || 'Error al guardar la nota.'}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                  Cancelar
                </button>
                <button type="submit" disabled={save.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
                  <Save className="w-4 h-4" /> {save.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
