import { useState } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'motion/react'
import { Users, Plus, RefreshCw, Pencil, Store, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { useTables } from '../../hooks/useTables'
import { useAuthContext } from '../AuthContext'
import { getCounterTable, getPhysicalTables, isCounterTable } from '../../lib/pos'
import { PageHeader } from '../components/ui/PageHeader'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/button'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton'
import { ConfirmDialog, type ConfirmDialogState } from '../components/ui/ConfirmDialog'

export function Tables() {
  const { tables, loading, error, refetch, createTable, updateTable } = useTables()
  const { user } = useAuthContext()
  const navigate = useNavigate()
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editingTable, setEditingTable] = useState<typeof tables[0] | null>(null)
  const [newTableNum, setNewTableNum] = useState('')
  const [newTableCap, setNewTableCap] = useState('4')
  const [editNombre, setEditNombre] = useState('')
  const [editCap, setEditCap] = useState('4')
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)

  const [dialog, setDialog] = useState<ConfirmDialogState | null>(null)
  const [dialogLoading, setDialogLoading] = useState(false)
  const showConfirm = (d: ConfirmDialogState) => setDialog(d)
  const handleDialogConfirm = async (input?: string) => {
    if (!dialog) return
    setDialogLoading(true)
    try { await dialog.onConfirm(input) }
    finally { setDialogLoading(false); setDialog(null) }
  }

  const isAdmin = user?.roleName === 'admin'
  const counterTable = getCounterTable(tables)
  const physicalTables = getPhysicalTables(tables)
  const visibleTables = isAdmin
    ? physicalTables
    : physicalTables.filter(t => t.estado !== 'inactiva')
  const free = visibleTables.filter(t => t.estado === 'libre').length
  const occupied = visibleTables.filter(t => t.estado === 'ocupada').length

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const num = parseInt(newTableNum)
      await createTable({
        numero: num,
        nombre: `Mesa ${num}`,
        capacidad: parseInt(newTableCap),
        estado: 'libre',
        tipo: 'mesa',
      })
      setShowCreate(false)
      setNewTableNum('')
      setNewTableCap('4')
      toast.success('Mesa creada')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setCreating(false)
    }
  }

  function openEdit(table: typeof tables[0], e: React.MouseEvent) {
    e.stopPropagation()
    if (isCounterTable(table)) return
    setEditingTable(table)
    setEditNombre(table.nombre)
    setEditCap(String(table.capacidad))
    setShowEdit(true)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingTable) return
    setSaving(true)
    try {
      await updateTable(editingTable.id, {
        nombre: editNombre.trim(),
        capacidad: parseInt(editCap),
      })
      setShowEdit(false)
      setEditingTable(null)
      toast.success('Mesa actualizada')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  function handleDeactivate(table: typeof tables[0]) {
    showConfirm({
      title: 'Desactivar mesa',
      message: `¿Desactivar ${table.nombre}? Podrá reactivarla cuando lo necesite.`,
      confirmLabel: 'Desactivar',
      variant: 'warning',
      onConfirm: async () => {
        await updateTable(table.id, { estado: 'inactiva' })
        toast.success('Mesa desactivada')
      },
    })
  }


  function handleTableClick(tableId: string) {
    navigate(`/pos/${tableId}`)
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Mesas / POS"
        subtitle={
          <>
            <span className="text-success font-medium">{free} libres</span>
            {' · '}
            <span className="text-warning font-medium">{occupied} ocupadas</span>
            {' · '}
            {visibleTables.length} mesas
          </>
        }
        actions={
          <>
            <Button variant="outline" size="iconTouch" onClick={refetch} aria-label="Actualizar">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </Button>
            {isAdmin && (
              <Button variant="default" onClick={() => setShowCreate(true)}>
                <Plus size={16} /> Nueva Mesa
              </Button>
            )}
          </>
        }
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm mb-4">{error}</div>
      )}

      {counterTable && (
        <motion.button
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => handleTableClick(counterTable.id)}
          className="w-full mb-6 flex items-center gap-4 p-5 sm:p-6 rounded-2xl border-2 border-brand bg-brand-muted hover:shadow-lg hover:brightness-[1.02] transition-all duration-200 cursor-pointer active:scale-[0.99] text-left"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-brand/20 flex items-center justify-center shrink-0">
            <Store size={28} className="text-brand" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg sm:text-xl font-black text-gray-900">Venta Mostrador</p>
            <p className="text-sm text-gray-500 mt-0.5">Para llevar · Sin mesa asignada</p>
          </div>
          <div className="flex items-center gap-2 text-brand font-bold text-sm shrink-0">
            <ShoppingBag size={18} />
            <span className="hidden sm:inline">Iniciar venta</span>
          </div>
        </motion.button>
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Nueva Mesa"
        footer={
          <>
            <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button variant="default" className="flex-1" disabled={creating} type="submit" form="create-table-form">
              {creating ? 'Creando...' : 'Crear Mesa'}
            </Button>
          </>
        }
      >
        <form id="create-table-form" onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Número de mesa</label>
            <input type="number" min="1" value={newTableNum} onChange={e => setNewTableNum(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary min-h-11" required />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Capacidad (personas)</label>
            <input type="number" min="1" max="20" value={newTableCap} onChange={e => setNewTableCap(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary min-h-11" required />
          </div>
        </form>
      </Modal>

      <Modal
        open={showEdit && !!editingTable}
        onClose={() => setShowEdit(false)}
        title="Editar Mesa"
        footer={
          <>
            {editingTable && (
              <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDeactivate(editingTable)}>
                Desactivar
              </Button>
            )}
            <Button variant="outline" className="flex-1" onClick={() => setShowEdit(false)}>Cancelar</Button>
            <Button variant="default" className="flex-1" disabled={saving} type="submit" form="edit-table-form">
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </>
        }
      >
        <form id="edit-table-form" onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Nombre</label>
            <input type="text" value={editNombre} onChange={e => setEditNombre(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary min-h-11" required />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Capacidad</label>
            <input type="number" min="1" max="20" value={editCap} onChange={e => setEditCap(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary min-h-11" required />
          </div>
        </form>
      </Modal>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <LoadingSkeleton count={12} />
        </div>
      ) : visibleTables.length === 0 ? (
        <EmptyState
          icon={<Users size={28} className="text-primary" />}
          title="No hay mesas configuradas"
          action={isAdmin ? (
            <Button variant="default" onClick={() => setShowCreate(true)}>Crear Primera Mesa</Button>
          ) : undefined}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {visibleTables.map((table, i) => {
            const isOccupied = table.estado === 'ocupada'
            const isInactive = table.estado === 'inactiva'
            return (
              <motion.button
                key={table.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => !isInactive && handleTableClick(table.id)}
                disabled={isInactive}
                className={`relative flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all duration-200 hover:shadow-md active:scale-[0.98] min-h-[140px] ${
                  isInactive ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                  : isOccupied ? 'border-warning/40 bg-warning-muted cursor-pointer hover:border-warning/60'
                  : 'border-gray-200 bg-white hover:border-gray-300 cursor-pointer'
                }`}
              >
                {isAdmin && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={e => openEdit(table, e)}
                    onKeyDown={e => e.key === 'Enter' && openEdit(table, e as unknown as React.MouseEvent)}
                    className="absolute top-2 left-2 p-2 rounded-lg bg-white/80 border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-white transition-colors cursor-pointer min-h-11 min-w-11 flex items-center justify-center"
                    aria-label="Editar mesa"
                  >
                    <Pencil size={12} />
                  </span>
                )}
                {isOccupied && (
                  <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-warning animate-pulse" />
                )}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${isOccupied ? 'bg-warning-muted' : 'bg-gray-100'}`}>
                  <span className={`text-xl font-bold ${isOccupied ? 'text-warning' : 'text-gray-500'}`}>{table.numero}</span>
                </div>
                <p className={`font-semibold text-sm ${isOccupied ? 'text-warning' : 'text-gray-700'}`}>{table.nombre}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Users size={11} className={isOccupied ? 'text-warning' : 'text-gray-400'} />
                  <span className={`text-xs ${isOccupied ? 'text-warning' : 'text-gray-400'}`}>{table.capacidad} personas</span>
                </div>
                <span className={`mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                  isInactive ? 'bg-gray-200 text-gray-600'
                  : isOccupied ? 'bg-warning-muted text-warning'
                  : 'bg-success-muted text-success'
                }`}>
                  {isInactive ? 'Inactiva' : isOccupied ? 'Ocupada' : 'Libre'}
                </span>
              </motion.button>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!dialog}
        loading={dialogLoading}
        title={dialog?.title ?? ''}
        message={dialog?.message ?? ''}
        confirmLabel={dialog?.confirmLabel}
        variant={dialog?.variant}
        onConfirm={handleDialogConfirm}
        onCancel={() => setDialog(null)}
      />
    </div>
  )
}
