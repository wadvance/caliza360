import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { whatsappApi } from '../services/api'
import {
  MessageCircle,
  Search,
  Plus,
  Send,
  Trash2,
  Phone,
  ArrowDownCircle,
  CheckCheck,
  X,
  User
} from 'lucide-react'

interface Conversation {
  id: string
  contact_name: string
  contact_phone: string
  status: string
  last_message_at: string
  unread_count: number
  messages_count: number
}

interface Message {
  id: string
  direction: 'incoming' | 'outgoing'
  content: string
  message_at: string
  sender?: { id: string; name: string } | null
  delivery_status?: string
  error?: string | null
}

const statusLabels: Record<string, string> = {
  new: 'Nueva',
  active: 'Activa',
  closed: 'Cerrada',
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
}

const deliveryMeta: Record<string, { label: string; color: string }> = {
  pending: { label: 'Enviando...', color: 'text-gray-400' },
  sent: { label: 'Enviado', color: 'text-green-200' },
  delivered: { label: 'Entregado', color: 'text-green-200' },
  read: { label: 'Leído', color: 'text-green-200' },
  failed: { label: 'Error', color: 'text-red-300' },
}

export default function WhatsApp() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [showNewConv, setShowNewConv] = useState(false)
  const [newConv, setNewConv] = useState({ contact_name: '', contact_phone: '+507 ' })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: conversations } = useQuery({
    queryKey: ['whatsapp-conversations', search],
    queryFn: () => whatsappApi.getConversations({ search: search || undefined }).then((r) => r.data),
  })

  const { data: summary } = useQuery({
    queryKey: ['whatsapp-summary'],
    queryFn: () => whatsappApi.getSummary().then((r) => r.data),
  })

  const { data: config } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: () => whatsappApi.getStatus().then((r) => r.data),
    refetchInterval: 30000,
  })

  const { data: conversationDetail } = useQuery({
    queryKey: ['whatsapp-conversation', selectedId],
    queryFn: () => (selectedId ? whatsappApi.getConversation(selectedId).then((r) => r.data) : null),
    enabled: !!selectedId,
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversationDetail?.messages?.length, selectedId])

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] })
    queryClient.invalidateQueries({ queryKey: ['whatsapp-summary'] })
    queryClient.invalidateQueries({ queryKey: ['whatsapp-conversation'] })
  }

  const send = useMutation({
    mutationFn: (content: string) => whatsappApi.sendMessage(selectedId!, content),
    onSuccess: () => {
      setNewMessage('')
      invalidateAll()
    },
  })

  const receive = useMutation({
    mutationFn: (content: string) => whatsappApi.receiveMessage(selectedId!, content),
    onSuccess: () => {
      setNewMessage('')
      invalidateAll()
    },
  })

  const create = useMutation({
    mutationFn: (data: { contact_name: string; contact_phone: string }) =>
      whatsappApi.createConversation(data),
    onSuccess: (res) => {
      setShowNewConv(false)
      setNewConv({ contact_name: '', contact_phone: '+507 ' })
      invalidateAll()
      setSelectedId(res.data.id)
    },
  })

  const markRead = useMutation({
    mutationFn: (id: string) => whatsappApi.markRead(id),
    onSuccess: () => invalidateAll(),
  })

  const remove = useMutation({
    mutationFn: (id: string) => whatsappApi.deleteConversation(id),
    onSuccess: () => {
      if (selectedId) setSelectedId(null)
      invalidateAll()
    },
  })

  const openConversation = (id: string) => {
    setSelectedId(id)
    markRead.mutate(id)
  }

  const selected = conversationDetail?.conversation
  const messages: Message[] = conversationDetail?.messages ?? []

  const summaryCards = [
    { label: 'Conversaciones', value: summary?.total_conversations ?? 0, color: 'bg-blue-100 text-blue-600' },
    { label: 'Sin leer', value: summary?.unread ?? 0, color: 'bg-amber-100 text-amber-600' },
    { label: 'Activas', value: summary?.active ?? 0, color: 'bg-green-100 text-green-600' },
  ]

  const formatTime = (iso: string) => {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  }

  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
  const labelCls = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mensajería WhatsApp</h1>
          <p className="text-sm text-gray-500">Centro de mensajería exclusivo de la secretaria</p>
        </div>
        <button
          onClick={() => setShowNewConv(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva Conversación
        </button>
      </div>

      {config && !config.configured && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 flex items-start gap-3">
          <Phone className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-semibold">Envío real desactivado</p>
            <p className="mt-1">
              Los mensajes se registran en el sistema pero aún no llegan a WhatsApp.
              Agregue <code className="bg-amber-100 px-1 rounded">WHATSAPP_ACCESS_TOKEN</code> y{' '}
              <code className="bg-amber-100 px-1 rounded">WHATSAPP_PHONE_NUMBER_ID</code> en el archivo{' '}
              <code className="bg-amber-100 px-1 rounded">.env</code> del backend para activar el envío real.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryCards.map((c) => (
          <div key={c.label} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${c.color}`}><MessageCircle className="w-5 h-5" /></div>
              <div>
                <p className="text-sm text-gray-500">{c.label}</p>
                <p className="text-lg font-semibold text-gray-900">{c.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex flex-col md:flex-row h-[600px]">
          {/* Bandeja de conversaciones */}
          <div className={`${selectedId ? 'hidden md:flex' : 'flex'} flex-col md:w-80 lg:w-96 border-r border-gray-200 flex-shrink-0`}>
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar conversación..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {(conversations ?? []).length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <MessageCircle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  No hay conversaciones
                </div>
              ) : (
                (conversations ?? []).map((c: Conversation) => (
                  <button
                    key={c.id}
                    onClick={() => openConversation(c.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-100 text-left hover:bg-gray-50 transition-colors ${selectedId === c.id ? 'bg-green-50' : ''}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {(c.contact_name || '?').charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900 truncate">{c.contact_name}</p>
                        <span className="text-xs text-gray-400">{c.last_message_at ? formatTime(c.last_message_at) : ''}</span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-xs text-gray-500 truncate">{c.contact_phone || 'Sin teléfono'}</span>
                        {c.unread_count > 0 ? (
                          <span className="bg-green-600 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center">{c.unread_count}</span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Panel de conversación */}
          <div className={`${selectedId ? 'flex' : 'hidden md:flex'} flex-1 flex-col`}>
            {!selected ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
                <MessageCircle className="w-16 h-16 mb-3 text-gray-200" />
                <p className="text-lg font-medium">Seleccione una conversación</p>
                <p className="text-sm">Para responder la mensajería de WhatsApp</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold">
                      {(selected.contact_name || '?').charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{selected.contact_name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {selected.contact_phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{selected.contact_phone}</span>}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[selected.status] || statusColors.active}`}>
                          {statusLabels[selected.status] || selected.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => remove.mutate(selected.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                      title="Eliminar conversación"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedId(null)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg md:hidden"
                      title="Volver"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                  {messages.map((m) => {
                    const dm = deliveryMeta[m.delivery_status ?? ''] ?? null
                    const failed = m.delivery_status === 'failed'
                    return (
                      <div key={m.id} className={`flex ${m.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm shadow-sm ${
                          m.direction === 'outgoing'
                            ? failed ? 'bg-red-600 text-white rounded-br-sm' : 'bg-green-600 text-white rounded-br-sm'
                            : 'bg-white text-gray-800 rounded-bl-sm border border-gray-200'
                        }`}>
                          <p>{m.content}</p>
                          {m.direction === 'outgoing' && failed && m.error ? (
                            <p className="text-[10px] mt-1 text-red-100">{m.error}</p>
                          ) : null}
                          <p className={`text-[10px] mt-1 flex items-center gap-1 ${m.direction === 'outgoing' ? 'text-green-100' : 'text-gray-400'}`}>
                            {m.message_at ? formatTime(m.message_at) : ''}
                            {m.direction === 'outgoing' && dm && (
                              <span className={`flex items-center gap-1 ${dm.color}`}>
                                <CheckCheck className="w-3 h-3" />
                                {dm.label}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-3 border-t border-gray-200 bg-white">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && newMessage.trim()) send.mutate(newMessage.trim()) }}
                      placeholder="Escriba su respuesta..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                    />
                    <button
                      onClick={() => send.mutate(newMessage.trim())}
                      disabled={!newMessage.trim() || send.isPending}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                    >
                      <Send className="w-4 h-4" /> Enviar
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                    <ArrowDownCircle className="w-3 h-3" />
                    Use Enter para enviar. Para registrar un mensaje recibido del contacto, escriba el mensaje y presione este botón:
                    <button
                      onClick={() => { if (newMessage.trim()) receive.mutate(newMessage.trim()) }}
                      disabled={!newMessage.trim() || receive.isPending}
                      className="text-green-600 font-medium hover:underline"
                    >
                      Marcar como recibido
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showNewConv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowNewConv(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Nueva Conversación</h3>
              <button onClick={() => setShowNewConv(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); create.mutate(newConv) }} className="space-y-4">
              <div>
                <label className={labelCls}>Nombre del contacto *</label>
                <input
                  type="text"
                  required
                  value={newConv.contact_name}
                  onChange={(e) => setNewConv({ ...newConv, contact_name: e.target.value })}
                  className={inputCls}
                  placeholder="Ej. Cemento Panamá"
                />
              </div>
              <div>
                <label className={labelCls}>Teléfono de WhatsApp</label>
                <input
                  type="text"
                  value={newConv.contact_phone}
                  onChange={(e) => {
                    const prefix = '+507 '
                    const v = e.target.value
                    setNewConv({ ...newConv, contact_phone: v.startsWith(prefix) ? v : prefix + v.replace(/^\+?507\s?/, '') })
                  }}
                  className={inputCls}
                  placeholder="+507 6000-0000"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowNewConv(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={create.isPending} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium">
                  <Plus className="w-4 h-4" /> Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
