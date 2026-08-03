import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { UserPlus, Trash2, Save, Users, Shield, ShieldCheck, ShieldAlert } from 'lucide-react'

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  dispatcher: 'Despacho',
  driver: 'Camionero',
  accountant: 'Contador',
  supervisor: 'Supervisor',
  secretary: 'Secretaria',
}

const roleColors: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  admin: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  dispatcher: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  driver: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  accountant: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  supervisor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
  secretary: 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300',
}

const roleIcon: Record<string, any> = {
  super_admin: ShieldCheck,
  admin: ShieldAlert,
  supervisor: Shield,
}

export default function UsersPage() {
  const queryClient = useQueryClient()
  const { user: me } = useAuthStore()
  const isSuperAdmin = me?.role === 'super_admin'

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'driver',
    phone: '',
  })
  const [showForm, setShowForm] = useState(false)

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => authApi.getUsers().then((r) => r.data),
  })

  const create = useMutation({
    mutationFn: (data: any) => authApi.register(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowForm(false)
      setForm({ name: '', email: '', password: '', role: 'driver', phone: '' })
    },
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => authApi.updateUser(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  const remove = useMutation({
    mutationFn: (id: string) => authApi.deleteUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  const selectableRoles = isSuperAdmin
    ? ['super_admin', 'admin', 'dispatcher', 'driver', 'accountant', 'supervisor', 'secretary']
    : ['dispatcher', 'driver', 'accountant', 'supervisor', 'secretary']

  const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600"
  const labelCls = "block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usuarios del Sistema</h1>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <UserPlus className="w-4 h-4" /> {showForm ? 'Cancelar' : 'Registrar Usuario'}
        </button>
      </div>

      {!isSuperAdmin && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg text-sm dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-200">
          Puedes registrar Despacho, Camioneros, Contadores y Supervisores. Solo el Super Admin registra Admins.
        </div>
      )}

      {showForm && (
        <form
          onSubmit={(e) => { e.preventDefault(); create.mutate(form) }}
          className="bg-white rounded-lg shadow p-6 space-y-4 dark:bg-gray-900 dark:border dark:border-gray-800"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Registrar nuevo usuario</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Nombre completo *</label>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="Ej. Juan Pérez" />
            </div>
            <div>
              <label className={labelCls}>Correo electrónico *</label>
              <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="correo@calizalosos.com" />
            </div>
            <div>
              <label className={labelCls}>Contraseña *</label>
              <input required type="password" minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className={inputCls} placeholder="Mínimo 6 caracteres" />
            </div>
            <div>
              <label className={labelCls}>Rol *</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className={inputCls}>
                {selectableRoles.map(r => (
                  <option key={r} value={r}>{roleLabels[r]}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={labelCls}>Teléfono</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputCls} placeholder="555-0101" />
            </div>
          </div>

          {create.isError && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm dark:bg-red-900/30 dark:border-red-700 dark:text-red-200">
              {(create.error as any)?.response?.data?.message?.role?.[0] || (create.error as any)?.response?.data?.message || 'Error al registrar el usuario.'}
            </div>
          )}

          <div className="flex justify-end">
            <button type="submit" disabled={create.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
              <Save className="w-4 h-4" /> {create.isPending ? 'Registrando...' : 'Registrar'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden dark:bg-gray-900 dark:border dark:border-gray-800">
        <div className="px-4 py-3 border-b border-gray-200 font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-200">
          Usuarios registrados
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-sm text-gray-400">Cargando usuarios...</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {(users ?? []).map((u: any) => {
              const Icon = roleIcon[u.role] || Users
              return (
                <div key={u.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium flex-shrink-0">
                      {u.name?.charAt(0) || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                        {u.name} {u.id === me?.id && <span className="text-xs text-gray-400">(tú)</span>}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium ${roleColors[u.role] || roleColors.driver}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {roleLabels[u.role] || u.role}
                    </span>
                    {u.id !== me?.id && (
                      <>
                        <select
                          value={u.role}
                          onChange={(e) => update.mutate({ id: u.id, data: { role: e.target.value } })}
                          className="text-xs border border-gray-300 rounded px-2 py-1 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
                        >
                          {(isSuperAdmin ? ['super_admin', 'admin', 'dispatcher', 'driver', 'accountant', 'supervisor', 'secretary'] : ['dispatcher', 'driver', 'accountant', 'supervisor', 'secretary']).map(r => (
                            <option key={r} value={r}>{roleLabels[r]}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => { if (confirm(`¿Eliminar a ${u.name}?`)) remove.mutate(u.id) }}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/20"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}