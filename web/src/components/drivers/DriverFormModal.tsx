import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { driversApi } from '../../services/api'
import { DriverData } from '../../pages/Drivers'

interface Props {
  driver: DriverData | null
  onClose: () => void
}

const defaultData = {
  name: '', email: '', password: '', phone: '',
  license_number: '', license_type: 'A', license_expiry_date: '',
  curp: '', rfc: '', address: '', hire_date: '',
}

export default function DriverFormModal({ driver, onClose }: Props) {
  const [form, setForm] = useState(defaultData)
  const queryClient = useQueryClient()
  const isEdit = !!driver

  useEffect(() => {
    if (driver) setForm({
      name: driver.name || '', email: '', password: '', phone: driver.phone || '',
      license_number: driver.license_number || '', license_type: driver.license_type || 'A',
      license_expiry_date: driver.license_expiry_date || '',
      curp: driver.curp || '', rfc: driver.rfc || '', address: driver.address || '',
      hire_date: driver.hire_date || '',
    })
  }, [driver])

  const mutation = useMutation({
    mutationFn: (data: typeof form) => isEdit
      ? driversApi.update(driver!.id, data)
      : driversApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate(form)
  }

  const ic = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
  const lc = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{isEdit ? 'Editar Conductor' : 'Nuevo Conductor'}</h2>
              <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={lc}>Nombre Completo *</label>
                <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={ic} />
              </div>
              {!isEdit && (
                <>
                  <div>
                    <label className={lc}>Email *</label>
                    <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={ic} />
                  </div>
                  <div>
                    <label className={lc}>Contraseña *</label>
                    <input type="password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} className={ic} />
                  </div>
                </>
              )}
              <div>
                <label className={lc}>Teléfono</label>
                <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className={ic} />
              </div>
              <div>
                <label className={lc}>No. Licencia *</label>
                <input type="text" required value={form.license_number} onChange={e => setForm({...form, license_number: e.target.value})} className={ic} />
              </div>
              <div>
                <label className={lc}>Tipo de Licencia *</label>
                <select value={form.license_type} onChange={e => setForm({...form, license_type: e.target.value})} className={ic}>
                  <option value="A">A - Camión</option>
                  <option value="B">B - Autobús</option>
                  <option value="C">C - Carga</option>
                </select>
              </div>
              <div>
                <label className={lc}>Vigencia Licencia *</label>
                <input type="date" required value={form.license_expiry_date} onChange={e => setForm({...form, license_expiry_date: e.target.value})} className={ic} />
              </div>
              <div>
                <label className={lc}>CURP</label>
                <input type="text" value={form.curp} onChange={e => setForm({...form, curp: e.target.value})} className={ic} maxLength={18} />
              </div>
              <div>
                <label className={lc}>RFC</label>
                <input type="text" value={form.rfc} onChange={e => setForm({...form, rfc: e.target.value})} className={ic} maxLength={13} />
              </div>
              <div>
                <label className={lc}>Fecha de Ingreso *</label>
                <input type="date" required value={form.hire_date} onChange={e => setForm({...form, hire_date: e.target.value})} className={ic} />
              </div>
              <div className="md:col-span-2">
                <label className={lc}>Dirección</label>
                <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className={ic} />
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3 rounded-b-xl">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={mutation.isPending} className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {mutation.isPending ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
