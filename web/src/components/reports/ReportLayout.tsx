import { ReactNode, useState } from 'react'
import { Download, FileText, Filter } from 'lucide-react'

interface ReportLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
  onExport?: (format: 'pdf' | 'excel') => void
  filters?: ReactNode
}

export default function ReportLayout({ title, subtitle, children, onExport, filters }: ReportLayoutProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          {filters}
          {onExport && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onExport('pdf')}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                <FileText className="w-4 h-4" />
                PDF
              </button>
              <button
                onClick={() => onExport('excel')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                <Download className="w-4 h-4" />
                Excel
              </button>
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  icon: ReactNode
  color: string
}

export function StatCard({ title, value, change, icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change !== undefined && (
            <p className={`text-xs mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '+' : ''}{change}% vs mes anterior
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

interface DateRangeProps {
  startDate: string
  endDate: string
  onStartChange: (date: string) => void
  onEndChange: (date: string) => void
}

export function DateRange({ startDate, endDate, onStartChange, onEndChange }: DateRangeProps) {
  return (
    <div className="flex items-center gap-2">
      <Filter className="w-4 h-4 text-gray-400" />
      <input
        type="date"
        value={startDate}
        onChange={e => onStartChange(e.target.value)}
        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
      />
      <span className="text-gray-400">-</span>
      <input
        type="date"
        value={endDate}
        onChange={e => onEndChange(e.target.value)}
        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
      />
    </div>
  )
}
