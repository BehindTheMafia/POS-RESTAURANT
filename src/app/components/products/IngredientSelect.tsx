import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Search, ChevronDown } from 'lucide-react'
import type { InventoryItem } from '../../../hooks/useInventory'
import { suggestIngredients } from '../../../lib/stock'

type IngredientSelectProps = {
  inventoryItems: InventoryItem[]
  productName: string
  excludeIds: string[]
  onSelect: (item: InventoryItem) => void
}

type DropdownRect = { top: number; left: number; width: number }

export const IngredientSelect = ({
  inventoryItems,
  productName,
  excludeIds,
  onSelect,
}: IngredientSelectProps) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [rect, setRect] = useState<DropdownRect | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClose = (e: MouseEvent) => {
      const target = e.target as Node
      const insideTrigger = triggerRef.current?.contains(target)
      const insideDropdown = dropdownRef.current?.contains(target)
      if (!insideTrigger && !insideDropdown) setOpen(false)
    }
    document.addEventListener('mousedown', handleClose)
    return () => document.removeEventListener('mousedown', handleClose)
  }, [open])

  useEffect(() => {
    if (!open) return
    const updateRect = () => {
      if (!triggerRef.current) return
      const r = triggerRef.current.getBoundingClientRect()
      setRect({ top: r.bottom + 4, left: r.left, width: r.width })
    }
    updateRect()
    window.addEventListener('scroll', updateRect, true)
    window.addEventListener('resize', updateRect)
    return () => {
      window.removeEventListener('scroll', updateRect, true)
      window.removeEventListener('resize', updateRect)
    }
  }, [open])

  const available = suggestIngredients(productName, inventoryItems).filter(
    item => !excludeIds.includes(item.id)
  )

  const filtered = query
    ? available.filter(item => item.nombre.toLowerCase().includes(query.toLowerCase()))
    : available

  const handleSelect = (item: InventoryItem) => {
    onSelect(item)
    setQuery('')
    setOpen(false)
  }

  const handleToggle = () => {
    setOpen(o => !o)
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between gap-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand bg-white cursor-pointer hover:border-gray-300 transition-colors"
      >
        <span className="text-gray-400">Seleccionar ingrediente...</span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && rect && createPortal(
        <div
          ref={dropdownRef}
          style={{ top: rect.top, left: rect.left, width: rect.width }}
          className="fixed z-[200] bg-white border border-gray-150 rounded-xl shadow-lg overflow-hidden"
        >
          <div className="relative border-b border-gray-100">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              autoFocus
              placeholder="Buscar materia prima..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm outline-none bg-white"
            />
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6 px-3">
                {available.length === 0
                  ? 'No quedan ingredientes disponibles'
                  : 'Sin coincidencias'}
              </p>
            ) : (
              filtered.map(item => {
                const isLow = item.stock_actual <= item.stock_minimo
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-brand-muted/40 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{item.nombre}</p>
                      <p className="text-[11px] text-gray-400">Unidad: {item.unidad}</p>
                    </div>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 ${isLow ? 'bg-warning-muted text-warning' : 'bg-gray-100 text-gray-500'}`}>
                      {item.stock_actual} {item.unidad}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
