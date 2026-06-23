import { useState, useCallback } from 'react'
import { supabase, RESTAURANT_ID } from '../lib/supabase'
import { getLocalRangeBoundsISO, coerceDateISO } from '../lib/dates'
import type { Tables } from '../lib/database.types'

export type AuditLog = Tables<'audit_logs'> & {
  users: { nombre: string } | null
}

export function useAudit(pageSize = 50) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  const fetchLogs = useCallback(async (filters?: {
    tabla?: string
    accion?: string
    dateFrom?: string
    dateTo?: string
    usuarioId?: string
    page?: number
  }) => {
    setLoading(true)
    setError(null)

    const currentPage = filters?.page ?? page
    const from = currentPage * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('audit_logs')
      .select('*, users(nombre)', { count: 'exact' })
      .eq('restaurant_id', RESTAURANT_ID)
      .order('fecha', { ascending: false })
      .range(from, to)

    if (filters?.tabla) query = query.eq('tabla', filters.tabla)
    if (filters?.accion) query = query.ilike('accion', `%${filters.accion}%`)
    if (filters?.usuarioId) query = query.eq('usuario_id', filters.usuarioId)
    if (filters?.dateFrom || filters?.dateTo) {
      const bounds = getLocalRangeBoundsISO(
        coerceDateISO(filters?.dateFrom),
        coerceDateISO(filters?.dateTo),
      )
      query = query.gte('fecha', bounds.start).lte('fecha', bounds.end)
    }

    const { data, error: err, count } = await query
    if (err) setError(err.message)
    else {
      setLogs((data ?? []) as unknown as AuditLog[])
      setTotalCount(count ?? 0)
      setPage(currentPage)
    }
    setLoading(false)
  }, [page, pageSize])

  const insertLog = useCallback(async (log: Omit<Tables<'audit_logs'>, 'id' | 'fecha' | 'restaurant_id'>) => {
    const { error: err } = await supabase.from('audit_logs').insert({
      ...log,
      restaurant_id: RESTAURANT_ID,
    })
    if (err) console.error('Audit log insert failed:', err.message)
  }, [])

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return {
    logs,
    loading,
    error,
    page,
    totalCount,
    totalPages,
    pageSize,
    fetchLogs,
    insertLog,
    setPage,
  }
}
