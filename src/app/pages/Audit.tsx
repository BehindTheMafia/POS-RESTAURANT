import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { ScrollText, Search, RefreshCw, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useAudit } from '../../hooks/useAudit'
import type { AuditLog } from '../../hooks/useAudit'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/button'

const today = () => new Date().toISOString().split('T')[0]

export function Audit() {
  const { logs, loading, error, fetchLogs, page, totalPages, totalCount, pageSize } = useAudit(50)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState(today)
  const [dateTo, setDateTo] = useState(today)
  const [detailLog, setDetailLog] = useState<AuditLog | null>(null)

  useEffect(() => {
    fetchLogs({ accion: search || undefined, dateFrom, dateTo, page: 0 })
  }, [])

  const handleFilter = () => {
    fetchLogs({ accion: search || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, page: 0 })
  }

  const handlePageChange = (nextPage: number) => {
    fetchLogs({ accion: search || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, page: nextPage })
  }

  const actionColors: Record<string, string> = {
    VENTA_COMPLETADA: 'bg-success-muted text-success',
    VENTA_ANULADA: 'bg-red-100 text-red-700',
    CAJA_ABIERTA: 'bg-blue-100 text-blue-700',
    CAJA_CERRADA: 'bg-gray-100 text-gray-700',
    AJUSTE_INVENTARIO: 'bg-amber-100 text-amber-700',
    ADVERTENCIA_STOCK_BAJO: 'bg-warning-muted text-warning',
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Auditoría"
        subtitle="Registro completo de todas las acciones del sistema"
      />

      <div className="flex flex-wrap gap-3 bg-white rounded-2xl border border-gray-100 p-4">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar acción..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand"
          />
        </div>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand" />
        <span className="text-gray-400 self-center">→</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand" />
        <Button variant="default" onClick={handleFilter}>
          <Filter size={14} /> Filtrar
        </Button>
        <Button variant="outline" size="iconTouch" onClick={() => fetchLogs({ dateFrom, dateTo, page: 0 })} aria-label="Actualizar">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{error}</div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs text-gray-500 font-medium px-5 py-3.5">Fecha</th>
                <th className="text-left text-xs text-gray-500 font-medium px-5 py-3.5">Usuario</th>
                <th className="text-left text-xs text-gray-500 font-medium px-5 py-3.5">Acción</th>
                <th className="text-left text-xs text-gray-500 font-medium px-5 py-3.5">Tabla</th>
                <th className="text-left text-xs text-gray-500 font-medium px-5 py-3.5">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-gray-400">
                    <ScrollText size={32} className="mx-auto mb-3 opacity-30" />
                    No hay registros de auditoría
                  </td>
                </tr>
              ) : (
                logs.map((log, i) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.01 }}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => setDetailLog(log)}
                  >
                    <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(log.fecha).toLocaleString('es-NI')}
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 text-xs">
                      {log.users?.nombre ?? 'Sistema'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${actionColors[log.accion] ?? 'bg-gray-100 text-gray-600'}`}>
                        {log.accion}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs font-mono">{log.tabla}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs truncate max-w-48">
                      {log.valor_nuevo ? JSON.stringify(log.valor_nuevo).slice(0, 60) : '—'}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalCount > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {totalCount} registros · Página {page + 1} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 0 || loading}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                aria-label="Página anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages - 1 || loading}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                aria-label="Página siguiente"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {detailLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Detalle de auditoría</h3>
              <button onClick={() => setDetailLog(null)} className="p-2 rounded-lg hover:bg-gray-100" aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>
            <dl className="space-y-3 text-sm">
              <div><dt className="text-gray-400 text-xs">Acción</dt><dd className="font-medium">{detailLog.accion}</dd></div>
              <div><dt className="text-gray-400 text-xs">Usuario</dt><dd>{detailLog.users?.nombre ?? 'Sistema'}</dd></div>
              <div><dt className="text-gray-400 text-xs">Tabla</dt><dd className="font-mono">{detailLog.tabla}</dd></div>
              <div><dt className="text-gray-400 text-xs">Registro ID</dt><dd className="font-mono text-xs break-all">{detailLog.registro_id ?? '—'}</dd></div>
              <div>
                <dt className="text-gray-400 text-xs mb-1">Valor anterior</dt>
                <dd className="bg-gray-50 rounded-lg p-3 font-mono text-xs overflow-x-auto">
                  {detailLog.valor_anterior ? JSON.stringify(detailLog.valor_anterior, null, 2) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-400 text-xs mb-1">Valor nuevo</dt>
                <dd className="bg-gray-50 rounded-lg p-3 font-mono text-xs overflow-x-auto">
                  {detailLog.valor_nuevo ? JSON.stringify(detailLog.valor_nuevo, null, 2) : '—'}
                </dd>
              </div>
            </dl>
          </motion.div>
        </div>
      )}
    </div>
  )
}
