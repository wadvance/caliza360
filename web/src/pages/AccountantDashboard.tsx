import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { accountantApi } from '../services/api'
import {
  Calculator,
  Cog,
  TrendingUp,
  Scale,
  Landmark,
  Plus,
  Pencil,
  Trash2,
  X,
  Wallet,
  Factory,
  Flame,
  Activity,
  CircleDollarSign,
  ClipboardCheck,
} from 'lucide-react'

interface CostItem {
  id: string
  category: string
  description: string
  amount: number
  tonnage?: number | null
  unit_cost?: number | null
  cost_date: string
  notes?: string | null
  status: string
}

interface AssetItem {
  id: string
  name: string
  type: string
  acquisition_value: number
  acquisition_date: string
  useful_life_years?: number | null
  salvage_value?: number | null
  accumulated_depreciation: number
  notes?: string | null
  status: string
}

interface BudgetItem {
  id: string
  title: string
  budget_type: string
  category: string
  planned_amount: number
  actual_amount: number
  period?: string | null
  notes?: string | null
  status: string
}

interface ComplianceItem {
  id: string
  type: string
  title: string
  amount: number
  due_date?: string | null
  paid_date?: string | null
  notes?: string | null
  status: string
}

type ModalState<T> = { open: boolean; item: T | null }

const emptyCost: CostItem = { id: '', category: 'otros', description: '', amount: 0, tonnage: null, unit_cost: null, cost_date: '', notes: '', status: 'registrado' }
const emptyAsset: AssetItem = { id: '', name: '', type: 'maquinaria', acquisition_value: 0, acquisition_date: '', useful_life_years: null, salvage_value: null, accumulated_depreciation: 0, notes: '', status: 'activo' }
const emptyBudget: BudgetItem = { id: '', title: '', budget_type: 'opex', category: 'proceso', planned_amount: 0, actual_amount: 0, period: '', notes: '', status: 'borrador' }
const emptyCompliance: ComplianceItem = { id: '', type: 'impuesto_general', title: '', amount: 0, due_date: '', paid_date: '', notes: '', status: 'pendiente' }

const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
const labelCls = "block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300"

const costCategoryLabels: Record<string, string> = {
  electricidad: 'Electricidad',
  combustible: 'Combustible',
  maquinaria: 'Maquinaria',
  explosivos: 'Explosivos',
  personal: 'Personal',
  mantenimiento: 'Mantenimiento',
  otros: 'Otros',
}
const assetTypeLabels: Record<string, string> = {
  maquinaria: 'Maquinaria',
  horno_calero: 'Horno calero',
  concesion_minera: 'Concesión minera',
  vehiculo: 'Vehículo',
  instalacion: 'Instalación',
  otro: 'Otro',
}
const budgetTypeLabels: Record<string, string> = {
  capex: 'CAPEX',
  opex: 'OPEX',
}
const complianceTypeLabels: Record<string, string> = {
  impuesto_extractivo: 'Impuesto extractivo',
  impuesto_general: 'Impuesto general',
  provision_cierre_mina: 'Provisión cierre de mina',
  mitigacion_ambiental: 'Mitigación ambiental',
  tasa: 'Tasa',
  otro: 'Otro',
}
const statusColors: Record<string, string> = {
  registrado: 'bg-blue-100 text-blue-700',
  verificado: 'bg-green-100 text-green-700',
  anulado: 'bg-red-100 text-red-700',
  activo: 'bg-green-100 text-green-700',
  depreciado: 'bg-amber-100 text-amber-700',
  retirado: 'bg-gray-100 text-gray-600',
  borrador: 'bg-gray-100 text-gray-600',
  aprobado: 'bg-blue-100 text-blue-700',
  ejecutado: 'bg-green-100 text-green-700',
  cerrado: 'bg-gray-100 text-gray-600',
  pendiente: 'bg-amber-100 text-amber-700',
  provisionado: 'bg-purple-100 text-purple-700',
  pagado: 'bg-green-100 text-green-700',
  vencido: 'bg-red-100 text-red-700',
}

const fmtDate = (iso?: string | null) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}
const fmtMoney = (v?: number | null) => {
  if (v == null) return '—'
  return 'B/. ' + Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const errMsg = (e: any, fallback: string) => {
  const msg = e?.response?.data?.message
  if (typeof msg === 'string') return msg
  const first = e?.response?.data?.errors
  if (first) { const k = Object.keys(first)[0]; return first[k]?.[0] || fallback }
  return fallback
}

export default function AccountantDashboard() {
  const queryClient = useQueryClient()
  const [costModal, setCostModal] = useState<ModalState<CostItem>>({ open: false, item: null })
  const [assetModal, setAssetModal] = useState<ModalState<AssetItem>>({ open: false, item: null })
  const [budgetModal, setBudgetModal] = useState<ModalState<BudgetItem>>({ open: false, item: null })
  const [complianceModal, setComplianceModal] = useState<ModalState<ComplianceItem>>({ open: false, item: null })

  const { data: summary } = useQuery({
    queryKey: ['accountant-summary'],
    queryFn: () => accountantApi.getSummary().then((r) => r.data),
    refetchInterval: 30000,
  })

  const { data: costs } = useQuery({ queryKey: ['accountant-costs'], queryFn: () => accountantApi.getCosts().then((r) => r.data) })
  const { data: assets } = useQuery({ queryKey: ['accountant-assets'], queryFn: () => accountantApi.getAssets().then((r) => r.data) })
  const { data: budgets } = useQuery({ queryKey: ['accountant-budgets'], queryFn: () => accountantApi.getBudgets().then((r) => r.data) })
  const { data: compliance } = useQuery({ queryKey: ['accountant-compliance'], queryFn: () => accountantApi.getCompliance().then((r) => r.data) })

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['accountant-summary'] })
    queryClient.invalidateQueries({ queryKey: ['accountant-costs'] })
    queryClient.invalidateQueries({ queryKey: ['accountant-assets'] })
    queryClient.invalidateQueries({ queryKey: ['accountant-budgets'] })
    queryClient.invalidateQueries({ queryKey: ['accountant-compliance'] })
  }

  const saveCost = useMutation({
    mutationFn: ({ id, data }: { id?: string; data: any }) => id ? accountantApi.updateCost(id, data) : accountantApi.createCost(data),
    onSuccess: () => { setCostModal({ open: false, item: null }); invalidateAll() },
  })
  const deleteCost = useMutation({ mutationFn: (id: string) => accountantApi.deleteCost(id), onSuccess: () => invalidateAll() })

  const saveAsset = useMutation({
    mutationFn: ({ id, data }: { id?: string; data: any }) => id ? accountantApi.updateAsset(id, data) : accountantApi.createAsset(data),
    onSuccess: () => { setAssetModal({ open: false, item: null }); invalidateAll() },
  })
  const deleteAsset = useMutation({ mutationFn: (id: string) => accountantApi.deleteAsset(id), onSuccess: () => invalidateAll() })

  const saveBudget = useMutation({
    mutationFn: ({ id, data }: { id?: string; data: any }) => id ? accountantApi.updateBudget(id, data) : accountantApi.createBudget(data),
    onSuccess: () => { setBudgetModal({ open: false, item: null }); invalidateAll() },
  })
  const deleteBudget = useMutation({ mutationFn: (id: string) => accountantApi.deleteBudget(id), onSuccess: () => invalidateAll() })

  const saveCompliance = useMutation({
    mutationFn: ({ id, data }: { id?: string; data: any }) => id ? accountantApi.updateCompliance(id, data) : accountantApi.createCompliance(data),
    onSuccess: () => { setComplianceModal({ open: false, item: null }); invalidateAll() },
  })
  const deleteCompliance = useMutation({ mutationFn: (id: string) => accountantApi.deleteCompliance(id), onSuccess: () => invalidateAll() })

  const cards = [
    { label: 'Costo unitario por tonelada', value: fmtMoney(summary?.costs?.unit_cost_per_ton), icon: Calculator, color: 'bg-teal-100 text-teal-600', link: '#costs' },
    { label: 'Costos del mes', value: fmtMoney(summary?.costs?.month_amount), icon: Wallet, color: 'bg-blue-100 text-blue-600', link: '#costs' },
    { label: 'Tonelaje del mes', value: Number(summary?.costs?.month_tonnage ?? 0).toLocaleString('es-MX') + ' t', icon: Scale, color: 'bg-amber-100 text-amber-600', link: '#costs' },
    { label: 'Activos activos', value: summary?.assets?.active ?? 0, icon: Factory, color: 'bg-indigo-100 text-indigo-600', link: '#assets' },
    { label: 'Depreciación anual', value: fmtMoney(summary?.assets?.annual_depreciation), icon: Cog, color: 'bg-purple-100 text-purple-600', link: '#assets' },
    { label: 'OPEX planificado', value: fmtMoney(summary?.budgets?.opex_planned), icon: Activity, color: 'bg-emerald-100 text-emerald-600', link: '#budgets' },
    { label: 'CAPEX planificado', value: fmtMoney(summary?.budgets?.capex_planned), icon: TrendingUp, color: 'bg-cyan-100 text-cyan-600', link: '#budgets' },
    { label: 'Obligaciones pendientes', value: summary?.compliance?.pending ?? 0, icon: Landmark, color: 'bg-red-100 text-red-600', link: '#compliance' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Espacio de Trabajo · Contador</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Contabilidad de costos: costos de producción, activos y depreciación, presupuestos CAPEX/OPEX y cumplimiento tributario y ambiental</p>
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

      {/* ============ 1. CONTROL DE COSTOS DE PRODUCCIÓN ============ */}
      <section id="costs" className="bg-white rounded-lg shadow dark:bg-gray-900 dark:border dark:border-gray-800">
        <div className="flex items-center justify-between px-5 pt-5">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-teal-600" /> Control de Costos de Producción
            </h2>
            <p className="text-sm text-gray-500">Monitoreo de gastos operativos (electricidad, combustible, maquinaria, explosivos, personal) para el costo unitario real por tonelada.</p>
          </div>
          <button onClick={() => setCostModal({ open: true, item: { ...emptyCost } })} className="flex items-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium">
            <Plus className="w-4 h-4" /> Registrar costo
          </button>
        </div>
        <div className="p-5">
          {(costs ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No hay costos de producción registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <th className="px-3 py-2">Categoría</th>
                    <th className="px-3 py-2">Descripción</th>
                    <th className="px-3 py-2 text-right">Monto</th>
                    <th className="px-3 py-2 text-right">Toneladas</th>
                    <th className="px-3 py-2 text-right">Costo/t</th>
                    <th className="px-3 py-2">Fecha</th>
                    <th className="px-3 py-2">Estado</th>
                    <th className="px-3 py-2 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {(costs ?? []).map((c: CostItem) => (
                    <tr key={c.id} className="text-sm text-gray-700 dark:text-gray-300">
                      <td className="px-3 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">{costCategoryLabels[c.category] || c.category}</span></td>
                      <td className="px-3 py-3 font-medium max-w-[220px] truncate">{c.description}</td>
                      <td className="px-3 py-3 text-right font-semibold">{fmtMoney(c.amount)}</td>
                      <td className="px-3 py-3 text-right">{c.tonnage != null ? Number(c.tonnage).toLocaleString('es-MX') : '—'}</td>
                      <td className="px-3 py-3 text-right">{c.unit_cost != null ? fmtMoney(c.unit_cost) : '—'}</td>
                      <td className="px-3 py-3">{fmtDate(c.cost_date)}</td>
                      <td className="px-3 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[c.status] || ''}`}>{c.status}</span></td>
                      <td className="px-3 py-3 text-right">
                        <button onClick={() => setCostModal({ open: true, item: c })} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg dark:hover:bg-blue-900/30"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => deleteCost.mutate(c.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/30"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ============ 2. GESTIÓN DE INVENTARIOS Y ACTIVOS ============ */}
      <section id="assets" className="bg-white rounded-lg shadow dark:bg-gray-900 dark:border dark:border-gray-800">
        <div className="flex items-center justify-between px-5 pt-5">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Cog className="w-5 h-5 text-purple-600" /> Gestión de Inventarios y Activos
            </h2>
            <p className="text-sm text-gray-500">Depreciación de maquinaria pesada, hornos caleros y amortización por agotamiento de la concesión minera.</p>
          </div>
          <button onClick={() => setAssetModal({ open: true, item: { ...emptyAsset } })} className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium">
            <Plus className="w-4 h-4" /> Registrar activo
          </button>
        </div>
        <div className="p-5">
          {(assets ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No hay activos registrados.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {(assets ?? []).map((a: AssetItem) => (
                <div key={a.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{a.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5"><span className="font-medium">{assetTypeLabels[a.type] || a.type}</span></p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => setAssetModal({ open: true, item: a })} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg dark:hover:bg-blue-900/30"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteAsset.mutate(a.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/30"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 space-y-1">
                    <p>Valor adquisición: <strong>{fmtMoney(a.acquisition_value)}</strong></p>
                    <p>Depreciación acumulada: <strong>{fmtMoney(a.accumulated_depreciation)}</strong></p>
                    {a.useful_life_years ? <p>Vida útil: {a.useful_life_years} años</p> : null}
                    <p>Adquirido: {fmtDate(a.acquisition_date)} · <span className={`px-1.5 py-0.5 rounded-full font-medium ${statusColors[a.status] || ''}`}>{a.status}</span></p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============ 3. ANÁLISIS DE RENTABILIDAD ============ */}
      <section id="budgets" className="bg-white rounded-lg shadow dark:bg-gray-900 dark:border dark:border-gray-800">
        <div className="flex items-center justify-between px-5 pt-5">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" /> Análisis de Rentabilidad (Presupuestos CAPEX/OPEX)
            </h2>
            <p className="text-sm text-gray-500">Evalúa la eficiencia de los procesos y elabora presupuestos para la gerencia.</p>
          </div>
          <button onClick={() => setBudgetModal({ open: true, item: { ...emptyBudget } })} className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium">
            <Plus className="w-4 h-4" /> Nuevo presupuesto
          </button>
        </div>
        <div className="p-5">
          {(budgets ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No hay presupuestos registrados.</p>
          ) : (
            <div className="space-y-2">
              {(budgets ?? []).map((b: BudgetItem) => {
                const variance = b.planned_amount - b.actual_amount
                return (
                  <div key={b.id} className="flex items-center justify-between flex-wrap gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900 dark:text-white">{b.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[b.status] || ''}`}>{b.status}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">{budgetTypeLabels[b.budget_type] || b.budget_type}</span>
                        {b.period ? <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">{b.period}</span> : null}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Planificado: <strong>{fmtMoney(b.planned_amount)}</strong> · Ejecutado: <strong>{fmtMoney(b.actual_amount)}</strong>
                        <span className={`ml-2 font-medium ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          Var. {variance >= 0 ? '+' : ''}{fmtMoney(variance)}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => setBudgetModal({ open: true, item: b })} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg dark:hover:bg-blue-900/30"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => deleteBudget.mutate(b.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/30"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ============ 4. CUMPLIMIENTO TRIBUTARIO Y AMBIENTAL ============ */}
      <section id="compliance" className="bg-white rounded-lg shadow dark:bg-gray-900 dark:border dark:border-gray-800">
        <div className="flex items-center justify-between px-5 pt-5">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Landmark className="w-5 h-5 text-red-600" /> Cumplimiento Tributario y Ambiental
            </h2>
            <p className="text-sm text-gray-500">Impuestos del sector extractivo y provisiones financieras para el cierre de la mina y la mitigación ambiental.</p>
          </div>
          <button onClick={() => setComplianceModal({ open: true, item: { ...emptyCompliance } })} className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">
            <Plus className="w-4 h-4" /> Registrar obligación
          </button>
        </div>
        <div className="p-5">
          {(compliance ?? []).length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No hay obligaciones registradas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2">Descripción</th>
                    <th className="px-3 py-2 text-right">Monto</th>
                    <th className="px-3 py-2">Vence</th>
                    <th className="px-3 py-2">Pagado</th>
                    <th className="px-3 py-2">Estado</th>
                    <th className="px-3 py-2 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {(compliance ?? []).map((c: ComplianceItem) => (
                    <tr key={c.id} className="text-sm text-gray-700 dark:text-gray-300">
                      <td className="px-3 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">{complianceTypeLabels[c.type] || c.type}</span></td>
                      <td className="px-3 py-3 font-medium max-w-[220px] truncate">{c.title}</td>
                      <td className="px-3 py-3 text-right font-semibold">{fmtMoney(c.amount)}</td>
                      <td className="px-3 py-3">{fmtDate(c.due_date)}</td>
                      <td className="px-3 py-3">{fmtDate(c.paid_date)}</td>
                      <td className="px-3 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[c.status] || ''}`}>{c.status}</span></td>
                      <td className="px-3 py-3 text-right">
                        <button onClick={() => setComplianceModal({ open: true, item: c })} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg dark:hover:bg-blue-900/30"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => deleteCompliance.mutate(c.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/30"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* MODALS */}
      {costModal.open && (
        <Modal title={costModal.item?.id ? 'Editar costo' : 'Registrar costo de producción'} onClose={() => setCostModal({ open: false, item: null })}>
          <form onSubmit={(e) => { e.preventDefault(); saveCost.mutate({ id: costModal.item?.id || undefined, data: costModal.item }) }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Categoría</label>
                <select value={costModal.item?.category || 'otros'} onChange={(e) => setCostModal({ open: true, item: { ...costModal.item!, category: e.target.value } })} className={inputCls}>
                  {Object.entries(costCategoryLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Estado</label>
                <select value={costModal.item?.status || 'registrado'} onChange={(e) => setCostModal({ open: true, item: { ...costModal.item!, status: e.target.value } })} className={inputCls}>
                  {['registrado', 'verificado', 'anulado'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Descripción *</label>
              <input type="text" required value={costModal.item?.description || ''} onChange={(e) => setCostModal({ open: true, item: { ...costModal.item!, description: e.target.value } })} className={inputCls} placeholder="Ej. Combustible para horno calero" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Monto (B/.) *</label>
                <input type="number" step="0.01" min="0" required value={costModal.item?.amount ?? 0} onChange={(e) => setCostModal({ open: true, item: { ...costModal.item!, amount: Number(e.target.value) } })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Toneladas</label>
                <input type="number" step="0.01" min="0" value={costModal.item?.tonnage ?? ''} onChange={(e) => setCostModal({ open: true, item: { ...costModal.item!, tonnage: e.target.value === '' ? null : Number(e.target.value) } })} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Fecha *</label>
              <input type="date" required value={costModal.item?.cost_date || ''} onChange={(e) => setCostModal({ open: true, item: { ...costModal.item!, cost_date: e.target.value } })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Notas</label>
              <textarea value={costModal.item?.notes || ''} onChange={(e) => setCostModal({ open: true, item: { ...costModal.item!, notes: e.target.value } })} className={inputCls} rows={2} />
            </div>
            {costModal.item?.tonnage ? <p className="text-xs text-gray-500">Costo unitario calculado: <strong>{fmtMoney((costModal.item?.amount ?? 0) / (costModal.item?.tonnage || 1))} por tonelada</strong></p> : null}
            {saveCost.isError && <p className="text-sm text-red-600">{errMsg(saveCost.error, 'Error al guardar el costo.')}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setCostModal({ open: false, item: null })} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">Cancelar</button>
              <button type="submit" disabled={saveCost.isPending} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm font-medium">Guardar</button>
            </div>
          </form>
        </Modal>
      )}

      {assetModal.open && (
        <Modal title={assetModal.item?.id ? 'Editar activo' : 'Registrar activo'} onClose={() => setAssetModal({ open: false, item: null })}>
          <form onSubmit={(e) => { e.preventDefault(); saveAsset.mutate({ id: assetModal.item?.id || undefined, data: assetModal.item }) }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Nombre *</label>
                <input type="text" required value={assetModal.item?.name || ''} onChange={(e) => setAssetModal({ open: true, item: { ...assetModal.item!, name: e.target.value } })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Tipo</label>
                <select value={assetModal.item?.type || 'maquinaria'} onChange={(e) => setAssetModal({ open: true, item: { ...assetModal.item!, type: e.target.value } })} className={inputCls}>
                  {Object.entries(assetTypeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Valor de adquisición (B/.) *</label>
                <input type="number" step="0.01" min="0" required value={assetModal.item?.acquisition_value ?? 0} onChange={(e) => setAssetModal({ open: true, item: { ...assetModal.item!, acquisition_value: Number(e.target.value) } })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Fecha de adquisición *</label>
                <input type="date" required value={assetModal.item?.acquisition_date || ''} onChange={(e) => setAssetModal({ open: true, item: { ...assetModal.item!, acquisition_date: e.target.value } })} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Vida útil (años)</label>
                <input type="number" step="0.01" min="0" value={assetModal.item?.useful_life_years ?? ''} onChange={(e) => setAssetModal({ open: true, item: { ...assetModal.item!, useful_life_years: e.target.value === '' ? null : Number(e.target.value) } })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Valor salvamento</label>
                <input type="number" step="0.01" min="0" value={assetModal.item?.salvage_value ?? ''} onChange={(e) => setAssetModal({ open: true, item: { ...assetModal.item!, salvage_value: e.target.value === '' ? null : Number(e.target.value) } })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Deprec. acumulada</label>
                <input type="number" step="0.01" min="0" value={assetModal.item?.accumulated_depreciation ?? 0} onChange={(e) => setAssetModal({ open: true, item: { ...assetModal.item!, accumulated_depreciation: Number(e.target.value) } })} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Estado</label>
              <select value={assetModal.item?.status || 'activo'} onChange={(e) => setAssetModal({ open: true, item: { ...assetModal.item!, status: e.target.value } })} className={inputCls}>
                {['activo', 'depreciado', 'retirado'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Notas</label>
              <textarea value={assetModal.item?.notes || ''} onChange={(e) => setAssetModal({ open: true, item: { ...assetModal.item!, notes: e.target.value } })} className={inputCls} rows={2} />
            </div>
            {saveAsset.isError && <p className="text-sm text-red-600">{errMsg(saveAsset.error, 'Error al guardar el activo.')}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setAssetModal({ open: false, item: null })} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">Cancelar</button>
              <button type="submit" disabled={saveAsset.isPending} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium">Guardar</button>
            </div>
          </form>
        </Modal>
      )}

      {budgetModal.open && (
        <Modal title={budgetModal.item?.id ? 'Editar presupuesto' : 'Nuevo presupuesto'} onClose={() => setBudgetModal({ open: false, item: null })}>
          <form onSubmit={(e) => { e.preventDefault(); saveBudget.mutate({ id: budgetModal.item?.id || undefined, data: budgetModal.item }) }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Título *</label>
                <input type="text" required value={budgetModal.item?.title || ''} onChange={(e) => setBudgetModal({ open: true, item: { ...budgetModal.item!, title: e.target.value } })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Periodo</label>
                <input type="text" value={budgetModal.item?.period || ''} onChange={(e) => setBudgetModal({ open: true, item: { ...budgetModal.item!, period: e.target.value } })} className={inputCls} placeholder="2026, Q3-2026..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Tipo</label>
                <select value={budgetModal.item?.budget_type || 'opex'} onChange={(e) => setBudgetModal({ open: true, item: { ...budgetModal.item!, budget_type: e.target.value } })} className={inputCls}>
                  <option value="opex">OPEX (operativo)</option>
                  <option value="capex">CAPEX (capital)</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Categoría</label>
                <select value={budgetModal.item?.category || 'proceso'} onChange={(e) => setBudgetModal({ open: true, item: { ...budgetModal.item!, category: e.target.value } })} className={inputCls}>
                  {['proceso', 'personal', 'combustible', 'energia', 'mantenimiento', 'proyecto', 'otro'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Planificado (B/.) *</label>
                <input type="number" step="0.01" min="0" required value={budgetModal.item?.planned_amount ?? 0} onChange={(e) => setBudgetModal({ open: true, item: { ...budgetModal.item!, planned_amount: Number(e.target.value) } })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Ejecutado (B/.)</label>
                <input type="number" step="0.01" min="0" value={budgetModal.item?.actual_amount ?? 0} onChange={(e) => setBudgetModal({ open: true, item: { ...budgetModal.item!, actual_amount: Number(e.target.value) } })} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Estado</label>
              <select value={budgetModal.item?.status || 'borrador'} onChange={(e) => setBudgetModal({ open: true, item: { ...budgetModal.item!, status: e.target.value } })} className={inputCls}>
                {['borrador', 'aprobado', 'ejecutado', 'cerrado'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Notas</label>
              <textarea value={budgetModal.item?.notes || ''} onChange={(e) => setBudgetModal({ open: true, item: { ...budgetModal.item!, notes: e.target.value } })} className={inputCls} rows={2} />
            </div>
            {saveBudget.isError && <p className="text-sm text-red-600">{errMsg(saveBudget.error, 'Error al guardar el presupuesto.')}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setBudgetModal({ open: false, item: null })} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">Cancelar</button>
              <button type="submit" disabled={saveBudget.isPending} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium">Guardar</button>
            </div>
          </form>
        </Modal>
      )}

      {complianceModal.open && (
        <Modal title={complianceModal.item?.id ? 'Editar obligación' : 'Registrar obligación'} onClose={() => setComplianceModal({ open: false, item: null })}>
          <form onSubmit={(e) => { e.preventDefault(); saveCompliance.mutate({ id: complianceModal.item?.id || undefined, data: complianceModal.item }) }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Tipo</label>
                <select value={complianceModal.item?.type || 'impuesto_general'} onChange={(e) => setComplianceModal({ open: true, item: { ...complianceModal.item!, type: e.target.value } })} className={inputCls}>
                  {Object.entries(complianceTypeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Estado</label>
                <select value={complianceModal.item?.status || 'pendiente'} onChange={(e) => setComplianceModal({ open: true, item: { ...complianceModal.item!, status: e.target.value } })} className={inputCls}>
                  {['pendiente', 'provisionado', 'pagado', 'vencido'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Descripción *</label>
              <input type="text" required value={complianceModal.item?.title || ''} onChange={(e) => setComplianceModal({ open: true, item: { ...complianceModal.item!, title: e.target.value } })} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Monto (B/.) *</label>
                <input type="number" step="0.01" min="0" required value={complianceModal.item?.amount ?? 0} onChange={(e) => setComplianceModal({ open: true, item: { ...complianceModal.item!, amount: Number(e.target.value) } })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Fecha de vencimiento</label>
                <input type="date" value={complianceModal.item?.due_date || ''} onChange={(e) => setComplianceModal({ open: true, item: { ...complianceModal.item!, due_date: e.target.value } })} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Fecha de pago</label>
              <input type="date" value={complianceModal.item?.paid_date || ''} onChange={(e) => setComplianceModal({ open: true, item: { ...complianceModal.item!, paid_date: e.target.value } })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Notas</label>
              <textarea value={complianceModal.item?.notes || ''} onChange={(e) => setComplianceModal({ open: true, item: { ...complianceModal.item!, notes: e.target.value } })} className={inputCls} rows={2} />
            </div>
            {saveCompliance.isError && <p className="text-sm text-red-600">{errMsg(saveCompliance.error, 'Error al guardar la obligación.')}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setComplianceModal({ open: false, item: null })} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">Cancelar</button>
              <button type="submit" disabled={saveCompliance.isPending} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium">Guardar</button>
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
