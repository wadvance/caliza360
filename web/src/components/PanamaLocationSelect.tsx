import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { panamaApi } from '../services/api'

interface CorregimientoOption {
  nombre: string
}

interface DistritoOption {
  nombre: string
  corregimientos: string[] | CorregimientoOption[]
}

interface Provincia {
  nombre: string
  distritos: DistritoOption[]
}

interface Props {
  value: string
  onChange: (value: string) => void
  inputCls?: string
}

function corregimientoName(c: string | CorregimientoOption): string {
  return typeof c === 'string' ? c : c.nombre
}

const buildFullName = (provincia: string, distrito: string, corregimiento: string) =>
  `Corregimiento ${corregimiento}, Distrito de ${distrito}, ${provincia}`

export default function PanamaLocationSelect({ value, onChange, inputCls }: Props) {
  const { data } = useQuery({
    queryKey: ['panama-locations'],
    queryFn: () => panamaApi.locations().then((r) => r.data.provincias as Provincia[]),
  })

  const [provincia, setProvincia] = useState('')
  const [distrito, setDistrito] = useState('')
  const [corregimiento, setCorregimiento] = useState('')

  const provincias = useMemo(() => data ?? [], [data])
  const distritos = useMemo(
    () => provincias.find((p) => p.nombre === provincia)?.distritos ?? [],
    [provincias, provincia]
  )
  const corregimientos = useMemo(
    () => distritos.find((d) => d.nombre === distrito)?.corregimientos ?? [],
    [distritos, distrito]
  )

  const reset = () => {
    onChange('')
  }

  const handleProvincia = (p: string) => {
    setProvincia(p)
    setDistrito('')
    setCorregimiento('')
    reset()
  }

  const handleDistrito = (d: string) => {
    setDistrito(d)
    setCorregimiento('')
    reset()
  }

  const handleCorregimiento = (c: string) => {
    setCorregimiento(c)
    onChange(c ? buildFullName(provincia, distrito, c) : '')
  }

  const selectCls =
    inputCls ??
    'w-full px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white'

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <select
          value={provincia}
          onChange={(e) => handleProvincia(e.target.value)}
          className={selectCls}
        >
          <option value="">Provincia</option>
          {provincias.map((p) => (
            <option key={p.nombre} value={p.nombre}>
              {p.nombre}
            </option>
          ))}
        </select>

        <select
          value={distrito}
          onChange={(e) => handleDistrito(e.target.value)}
          className={selectCls}
          disabled={!provincia}
        >
          <option value="">Distrito</option>
          {distritos.map((d) => (
            <option key={d.nombre} value={d.nombre}>
              {d.nombre}
            </option>
          ))}
        </select>

        <select
          value={corregimiento}
          onChange={(e) => handleCorregimiento(e.target.value)}
          className={selectCls}
          disabled={!distrito}
        >
          <option value="">Corregimiento</option>
          {corregimientos.map((c) => (
            <option key={corregimientoName(c)} value={corregimientoName(c)}>
              {corregimientoName(c)}
            </option>
          ))}
        </select>
      </div>

      {value && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{value}</p>
      )}
    </div>
  )
}
