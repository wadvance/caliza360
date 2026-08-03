import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Mail, Plus, X, Send, Check, AlertCircle } from 'lucide-react'

interface EmailSettings {
  recipients: {
    daily: string[]
    weekly: string[]
    alerts: string[]
  }
  schedule: {
    daily: string
    weekly: string
    alerts: string
  }
}

export default function EmailSettings() {
  const queryClient = useQueryClient()
  const [dailyEmail, setDailyEmail] = useState('')
  const [weeklyEmail, setWeeklyEmail] = useState('')
  const [alertEmail, setAlertEmail] = useState('')
  const [testEmail, setTestEmail] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['email-settings'],
    queryFn: async () => {
      const response = await fetch('/api/settings/email', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      return response.json()
    },
  })

  const settings: EmailSettings = data?.data || {
    recipients: { daily: [], weekly: [], alerts: [] },
    schedule: { daily: '07:00', weekly: '08:00', alerts: '09:00' }
  }

  const updateMutation = useMutation({
    mutationFn: async (newSettings: any) => {
      const response = await fetch('/api/settings/email', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newSettings)
      })
      if (!response.ok) throw new Error('Error al actualizar')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-settings'] })
      setMessage({ type: 'success', text: 'Configuración guardada correctamente' })
      setTimeout(() => setMessage(null), 3000)
    },
  })

  const testMutation = useMutation({
    mutationFn: async ({ type, email }: { type: string; email: string }) => {
      const response = await fetch(`/api/settings/email/test-${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ email })
      })
      return response.json()
    },
    onSuccess: (data) => {
      setMessage({ type: 'success', text: data.message || 'Correo de prueba enviado' })
      setTimeout(() => setMessage(null), 5000)
    },
    onError: () => {
      setMessage({ type: 'error', text: 'Error al enviar correo de prueba' })
      setTimeout(() => setMessage(null), 5000)
    },
  })

  const addRecipient = (type: 'daily' | 'weekly' | 'alerts', email: string, setter: (v: string) => void) => {
    if (!email || !email.includes('@')) return
    const current = settings.recipients[type] || []
    if (current.includes(email)) return
    updateMutation.mutate({
      recipients: { ...settings.recipients, [type]: [...current, email] }
    })
    setter('')
  }

  const removeRecipient = (type: 'daily' | 'weekly' | 'alerts', email: string) => {
    const current = settings.recipients[type] || []
    updateMutation.mutate({
      recipients: { ...settings.recipients, [type]: current.filter(e => e !== email) }
    })
  }

  const ic = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración de Correos</h1>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Reports */}
        <div className="bg-white rounded dark:bg-gray-900-lg shadow dark:bg-gray-900 dark:border dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-full bg-blue-100"><Mail className="w-5 h-5 text-blue-600" /></div>
            <div>
              <h2 className="text-lg font-semibold">Reporte Diario</h2>
              <p className="text-sm text-gray-500">Se envía a las {settings.schedule?.daily || '07:00'} AM</p>
            </div>
          </div>

          <div className="space-y-3">
            {(settings.recipients?.daily || []).map(email => (
              <div key={email} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                <span className="text-sm">{email}</span>
                <button onClick={() => removeRecipient('daily', email)} className="text-red-500 hover:text-red-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input type="email" value={dailyEmail} onChange={e => setDailyEmail(e.target.value)} placeholder="correo@ejemplo.com" className={ic}
                onKeyDown={e => e.key === 'Enter' && addRecipient('daily', dailyEmail, setDailyEmail)} />
              <button onClick={() => addRecipient('daily', dailyEmail, setDailyEmail)} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Weekly Reports */}
        <div className="bg-white rounded dark:bg-gray-900-lg shadow dark:bg-gray-900 dark:border dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-full bg-purple-100"><Mail className="w-5 h-5 text-purple-600" /></div>
            <div>
              <h2 className="text-lg font-semibold">Reporte Semanal</h2>
              <p className="text-sm text-gray-500">Se envía los lunes a las {settings.schedule?.weekly || '08:00'} AM</p>
            </div>
          </div>

          <div className="space-y-3">
            {(settings.recipients?.weekly || []).map(email => (
              <div key={email} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                <span className="text-sm">{email}</span>
                <button onClick={() => removeRecipient('weekly', email)} className="text-red-500 hover:text-red-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input type="email" value={weeklyEmail} onChange={e => setWeeklyEmail(e.target.value)} placeholder="correo@ejemplo.com" className={ic}
                onKeyDown={e => e.key === 'Enter' && addRecipient('weekly', weeklyEmail, setWeeklyEmail)} />
              <button onClick={() => addRecipient('weekly', weeklyEmail, setWeeklyEmail)} className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Alert Reports */}
        <div className="bg-white rounded dark:bg-gray-900-lg shadow dark:bg-gray-900 dark:border dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-full bg-orange-100"><Mail className="w-5 h-5 text-orange-600" /></div>
            <div>
              <h2 className="text-lg font-semibold">Alertas</h2>
              <p className="text-sm text-gray-500">Inventario bajo, mantenimiento, facturas vencidas - {settings.schedule?.alerts || '09:00'} AM</p>
            </div>
          </div>

          <div className="space-y-3">
            {(settings.recipients?.alerts || []).map(email => (
              <div key={email} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                <span className="text-sm">{email}</span>
                <button onClick={() => removeRecipient('alerts', email)} className="text-red-500 hover:text-red-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input type="email" value={alertEmail} onChange={e => setAlertEmail(e.target.value)} placeholder="correo@ejemplo.com" className={ic}
                onKeyDown={e => e.key === 'Enter' && addRecipient('alerts', alertEmail, setAlertEmail)} />
              <button onClick={() => addRecipient('alerts', alertEmail, setAlertEmail)} className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Test Email */}
        <div className="bg-white rounded dark:bg-gray-900-lg shadow dark:bg-gray-900 dark:border dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-full bg-green-100"><Send className="w-5 h-5 text-green-600" /></div>
            <div>
              <h2 className="text-lg font-semibold">Enviar Prueba</h2>
              <p className="text-sm text-gray-500">Envía un correo de prueba para verificar configuración</p>
            </div>
          </div>

          <div className="space-y-3">
            <input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="correo@ejemplo.com" className={ic} />
            <div className="flex gap-2">
              <button
                onClick={() => testMutation.mutate({ type: 'daily', email: testEmail })}
                disabled={!testEmail || testMutation.isPending}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                Probar Diario
              </button>
              <button
                onClick={() => testMutation.mutate({ type: 'alerts', email: testEmail })}
                disabled={!testEmail || testMutation.isPending}
                className="flex-1 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm"
              >
                Probar Alertas
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded dark:bg-gray-900-lg shadow dark:bg-gray-900 dark:border dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold mb-4">Programación Automática</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Reporte Diario</p>
            <p className="text-lg font-bold text-blue-600">Todos los días a las {settings.schedule?.daily || '07:00'}</p>
            <p className="text-xs text-gray-500 mt-1">Resumen de viajes, ingresos y gastos</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Reporte Semanal</p>
            <p className="text-lg font-bold text-purple-600">Lunes a las {settings.schedule?.weekly || '08:00'}</p>
            <p className="text-xs text-gray-500 mt-1">Resumen completo de la semana</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Alertas</p>
            <p className="text-lg font-bold text-orange-600">Diario a las {settings.schedule?.alerts || '09:00'}</p>
            <p className="text-xs text-gray-500 mt-1">Inventario, mantenimiento, facturas</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Para activar el envío automático, configure un cron job en el servidor: <code className="bg-gray-100 px-2 py-1 rounded">* * * * * php /path/to/artisan schedule:run</code>
        </p>
      </div>
    </div>
  )
}
