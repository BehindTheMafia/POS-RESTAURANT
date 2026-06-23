import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart3, TrendingUp, DollarSign, RefreshCw,
  FileText, Download, Calendar, Plus, Edit2, Trash2, X,
  Search, Eye, ChevronLeft, ChevronRight, Printer, AlertTriangle, ArrowUpDown, Layers, ShoppingBag, CheckCircle, Ban,
  SlidersHorizontal
} from 'lucide-react';
import { ConfirmDialog, type ConfirmDialogState } from '../components/ui/ConfirmDialog';
import { useSalesReports, type SaleReportItem } from '../../hooks/useSalesReports';
import { printSaleTicket } from '../../lib/printTicket';
import { useExpenses, type Expense } from '../../hooks/useExpenses';
import { useRestaurant } from '../../hooks/useRestaurant';
import { useAuthContext } from '../AuthContext';
import { toast } from 'sonner';
import { getLocalDateISO, getLocalDateFromISO, coerceDateISO } from '../../lib/dates';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

type ReportRange = 'today' | 'week' | 'month' | 'custom';

function getDateRange(range: ReportRange, customFrom?: string, customTo?: string) {
  const today = new Date();
  const fmt = (d: Date) => getLocalDateISO(d);

  switch (range) {
    case 'today':
      return { from: fmt(today), to: fmt(today) };
    case 'week': {
      const start = new Date(today);
      start.setDate(today.getDate() - 6);
      return { from: fmt(start), to: fmt(today) };
    }
    case 'month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: fmt(start), to: fmt(today) };
    }
    case 'custom':
      return { from: coerceDateISO(customFrom), to: coerceDateISO(customTo) };
    default:
      return { from: fmt(today), to: fmt(today) };
  }
}

export function Reports() {
  const { restaurant } = useRestaurant();
  const { user } = useAuthContext();
  const isAdmin = user?.roleName === 'admin';

  const [activeTab, setActiveTab] = useState<'sales' | 'products' | 'expenses'>('sales');
  const [activeRange, setActiveRange] = useState<ReportRange>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  // Modals
  const [showCreateGasto, setShowCreateGasto] = useState(false);
  const [showEditGasto, setShowEditGasto] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [detailSale, setDetailSale] = useState<SaleReportItem | null>(null);
  
  const [saving, setSaving] = useState(false);
  const [gForm, setGForm] = useState({ monto: '', descripcion: '', categoria: '', fecha: '' });

  const { from, to } = getDateRange(activeRange, customFrom, customTo);
  const currency = restaurant?.moneda ?? 'C$';

  // Sales hook
  const {
    sales,
    loading: salesLoading,
    error: salesError,
    cajeros,
    mesas,
    paymentMethods,
    totalToday,
    totalMonth,
    refetch: refetchSales,
    cancelSale,
    deleteSale,
  } = useSalesReports(from, to);

  // Expenses hook
  const {
    expenses,
    total: expensesTotal,
    getByCategory,
    loading: expLoading,
    error: expError,
    refetch: refetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense
  } = useExpenses(from, to);

  const loading = salesLoading || expLoading;

  // Confirm dialog state (replaces native confirm/prompt)
  const [dialog, setDialog] = useState<ConfirmDialogState | null>(null)
  const [dialogLoading, setDialogLoading] = useState(false)

  const showConfirm = (d: ConfirmDialogState) => setDialog(d)
  const handleDialogConfirm = async (input?: string) => {
    if (!dialog) return
    setDialogLoading(true)
    try {
      await dialog.onConfirm(input)
      setDialog(null)
    } catch (err: any) {
      toast.error(err?.message || 'Error al ejecutar la acción')
    } finally {
      setDialogLoading(false)
    }
  }

  // Pre-fill custom date inputs when switching to personalizado
  useEffect(() => {
    if (activeRange !== 'custom') return
    const today = getLocalDateISO()
    if (!customFrom) setCustomFrom(today)
    if (!customTo) setCustomTo(today)
  }, [activeRange, customFrom, customTo])

  // Filter States
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('Todos');
  const [filterCajero, setFilterCajero] = useState('Todos');
  const [filterMesa, setFilterMesa] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Sales Table Sorting & Pagination
  const [sortField, setSortField] = useState<'fecha' | 'total' | 'subtotal' | 'impuestos' | 'cliente'>('fecha');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Products Table Sorting & Pagination
  const [prodSortField, setProdSortField] = useState<'producto' | 'categoria' | 'cantidad' | 'ingresos' | 'participacion'>('cantidad');
  const [prodSortDir, setProdSortDir] = useState<'asc' | 'desc'>('desc');
  const [prodPage, setProdPage] = useState(1);
  const prodItemsPerPage = 10;

  // Format currency helper
  const fmt = (n: number) =>
    `${currency} ${n.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Reset pagination on filter or range change
  useEffect(() => {
    setCurrentPage(1);
    setProdPage(1);
  }, [filterStatus, filterPaymentMethod, filterCajero, filterMesa, searchTerm, from, to]);

  // Apply Filters to Sales list
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      if (filterStatus !== 'Todos' && s.estado !== filterStatus) return false;

      if (filterPaymentMethod !== 'Todos') {
        const hasPM = s.payments.some(p => p.payment_method?.id === filterPaymentMethod);
        if (!hasPM) return false;
      }

      if (filterCajero !== 'Todos' && s.cajero_id !== filterCajero) return false;

      if (filterMesa !== 'Todos' && s.orders?.mesa_id !== filterMesa) return false;

      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const orderId = String(s.orders?.id || '').toLowerCase();
        const client = String(s.cliente || '').toLowerCase();
        const cashier = String(s.cajero?.nombre || '').toLowerCase();
        const table = String(s.orders?.mesa?.nombre || '').toLowerCase();

        return orderId.includes(term) || client.includes(term) || cashier.includes(term) || table.includes(term);
      }

      return true;
    });
  }, [sales, filterStatus, filterPaymentMethod, filterCajero, filterMesa, searchTerm]);

  // Sort Sales
  const sortedSales = useMemo(() => {
    const list = [...filteredSales];
    list.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'fecha') {
        valA = new Date(a.fecha).getTime();
        valB = new Date(b.fecha).getTime();
      }

      if (typeof valA === 'string') {
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
    });
    return list;
  }, [filteredSales, sortField, sortDirection]);

  // Paginated Sales
  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedSales.slice(start, start + itemsPerPage);
  }, [sortedSales, currentPage]);

  const totalPages = Math.ceil(sortedSales.length / itemsPerPage);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Top products calculation for Tab 2 & Charts
  const productsBreakdown = useMemo(() => {
    const map: Record<string, { product: string; category: string; quantity: number; revenue: number }> = {};
    let totalRevenue = 0;

    sales.filter(s => s.estado === 'completada').forEach(s => {
      s.orders?.order_items?.forEach(item => {
        const prodId = item.product?.id || 'unknown';
        if (!map[prodId]) {
          map[prodId] = {
            product: item.product?.nombre || 'Producto Eliminado',
            category: item.product?.categories?.nombre || 'Sin Categoría',
            quantity: 0,
            revenue: 0
          };
        }
        map[prodId].quantity += Number(item.cantidad);
        map[prodId].revenue += Number(item.subtotal);
        totalRevenue += Number(item.subtotal);
      });
    });

    const list = Object.values(map).map(p => ({
      ...p,
      participacion: totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0
    }));

    // Sort
    list.sort((a, b) => {
      const fieldMap: Record<'producto' | 'categoria' | 'cantidad' | 'ingresos' | 'participacion', keyof typeof a> = {
        producto: 'product',
        categoria: 'category',
        cantidad: 'quantity',
        ingresos: 'revenue',
        participacion: 'participacion'
      };
      const key = fieldMap[prodSortField];
      let valA: any = a[key];
      let valB: any = b[key];
      if (typeof valA === 'string') {
        return prodSortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        return prodSortDir === 'asc' ? valA - valB : valB - valA;
      }
    });

    return { list, totalRevenue };
  }, [sales, prodSortField, prodSortDir]);

  const paginatedProducts = useMemo(() => {
    const start = (prodPage - 1) * prodItemsPerPage;
    return productsBreakdown.list.slice(start, start + prodItemsPerPage);
  }, [productsBreakdown.list, prodPage]);

  const totalProdPages = Math.ceil(productsBreakdown.list.length / prodItemsPerPage);

  const toggleProdSort = (field: typeof prodSortField) => {
    if (prodSortField === field) {
      setProdSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setProdSortField(field);
      setProdSortDir('desc');
    }
  };

  // Period stats (from filteredSales)
  const periodStats = useMemo(() => {
    const completed = filteredSales.filter(s => s.estado === 'completada');
    const totalSales = completed.reduce((sum, s) => sum + Number(s.total), 0);
    const count = completed.length;
    const ticketPromedio = count > 0 ? totalSales / count : 0;
    const impuestos = completed.reduce((sum, s) => sum + Number(s.impuestos), 0);

    return { totalSales, count, ticketPromedio, impuestos };
  }, [filteredSales]);

  // Chart Data Calculations
  const chartSalesByDay = useMemo(() => {
    const days: Record<string, number> = {};
    sales.filter(s => s.estado === 'completada').forEach(s => {
      const d = getLocalDateFromISO(s.fecha);
      days[d] = (days[d] ?? 0) + Number(s.total);
    });
    return Object.entries(days)
      .map(([date, total]) => ({ date: date.slice(5), sortKey: date, total }))
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [sales]);

  const chartSalesByPayment = useMemo(() => {
    const methods: Record<string, number> = {};
    sales.filter(s => s.estado === 'completada').forEach(s => {
      s.payments.forEach(p => {
        const name = p.payment_method?.nombre || 'Otro';
        methods[name] = (methods[name] ?? 0) + Number(p.monto);
      });
    });
    return Object.entries(methods).map(([name, value]) => ({ name, value }));
  }, [sales]);

  const chartTopProducts = useMemo(() => {
    return [...productsBreakdown.list]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .map(p => ({ name: p.product.slice(0, 12), cantidad: p.quantity }));
  }, [productsBreakdown.list]);

  const chartTopCategories = useMemo(() => {
    const cats: Record<string, number> = {};
    sales.filter(s => s.estado === 'completada').forEach(s => {
      s.orders?.order_items?.forEach(item => {
        const name = item.product?.categories?.nombre || 'Sin Categoría';
        cats[name] = (cats[name] ?? 0) + Number(item.subtotal);
      });
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [sales]);

  const chartSalesByHour = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: `${String(i).padStart(2, '0')}:00`,
      ventas: 0
    }));
    sales.filter(s => s.estado === 'completada').forEach(s => {
      const h = new Date(s.fecha).getHours();
      hours[h].ventas += Number(s.total);
    });
    return hours.filter(h => h.ventas > 0);
  }, [sales]);

  // Actions
  async function handleCreateGasto(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createExpense({
        monto: parseFloat(gForm.monto) || 0,
        descripcion: gForm.descripcion,
        categoria: gForm.categoria || 'otros',
        fecha: gForm.fecha ? `${gForm.fecha}T12:00:00` : new Date().toISOString(),
        usuario_id: user?.id ?? null,
      });
      setShowCreateGasto(false);
      setGForm({ monto: '', descripcion: '', categoria: '', fecha: '' });
      toast.success('Gasto registrado con éxito');
    } catch (err: any) {
      toast.error('Error al crear gasto: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleEditGasto(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedExpense) return;
    setSaving(true);
    try {
      await updateExpense(selectedExpense.id, {
        monto: parseFloat(gForm.monto) || 0,
        descripcion: gForm.descripcion,
        categoria: gForm.categoria || 'otros',
        fecha: gForm.fecha ? `${gForm.fecha}T12:00:00` : new Date().toISOString(),
      });
      setShowEditGasto(false);
      setSelectedExpense(null);
      setGForm({ monto: '', descripcion: '', categoria: '', fecha: '' });
      toast.success('Gasto actualizado con éxito');
    } catch (err: any) {
      toast.error('Error al actualizar gasto: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteGasto(id: string) {
    showConfirm({
      title: 'Eliminar gasto',
      message: '¿Está seguro de eliminar este gasto? Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      variant: 'danger',
      onConfirm: async () => {
        await deleteExpense(id)
        toast.success('Gasto eliminado')
      },
    })
  }

  function handleDeleteSale(sale: SaleReportItem) {
    if (!isAdmin) {
      toast.error('Acción restringida: Solo administradores pueden eliminar ventas')
      return
    }
    const saleRef = sale.orders?.id?.slice(0, 8) || sale.id.slice(0, 8)
    const msg = sale.estado === 'completada'
      ? `¿Eliminar permanentemente la venta #${saleRef}? Se revertirá el inventario y se borrará el registro.`
      : `¿Eliminar permanentemente la venta #${saleRef}? Esta acción no se puede deshacer.`

    showConfirm({
      title: 'Eliminar venta',
      message: msg,
      confirmLabel: 'Eliminar permanentemente',
      variant: 'danger',
      onConfirm: async () => {
        await deleteSale(sale.id, user?.id || '')
        if (detailSale?.id === sale.id) setDetailSale(null)
        toast.success('Venta eliminada permanentemente')
        refetchSales()
      },
    })
  }

  const renderSaleActions = (sale: SaleReportItem, compact = false) => (
    <div className={`flex items-center ${compact ? 'justify-end' : 'justify-center'} gap-1.5 flex-wrap`}>
      <button
        type="button"
        onClick={() => setDetailSale(sale)}
        className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-brand dark:text-gray-300 transition-colors cursor-pointer"
        title="Ver Detalle"
        aria-label="Ver detalle de venta"
      >
        <Eye size={15} />
      </button>
      <button
        type="button"
        onClick={() => handlePrint(sale)}
        className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-brand dark:text-gray-300 transition-colors cursor-pointer"
        title="Imprimir Ticket"
        aria-label="Imprimir ticket"
      >
        <Printer size={15} />
      </button>
      {sale.estado !== 'anulada' && (
        <button
          type="button"
          onClick={() => handleCancelSale(sale)}
          disabled={!isAdmin}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30 disabled:opacity-40 transition-colors cursor-pointer"
          title={isAdmin ? 'Anular Venta' : 'Requiere Admin para Anular'}
          aria-label="Anular venta"
        >
          <Ban size={15} />
        </button>
      )}
      {isAdmin && (
        <button
          type="button"
          onClick={() => handleDeleteSale(sale)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-destructive-muted text-destructive hover:bg-destructive/20 transition-colors cursor-pointer"
          title="Eliminar Venta"
          aria-label="Eliminar venta permanentemente"
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );

  const renderSaleStatus = (estado: string) => (
    <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full uppercase ${
      estado === 'completada'
        ? 'bg-success-muted text-success'
        : 'bg-destructive-muted text-destructive'
    }`}>
      {estado}
    </span>
  );

  function handleCancelSale(sale: SaleReportItem) {
    if (!isAdmin) {
      toast.error('Acción restringida: Solo administradores pueden anular ventas')
      return
    }
    const saleRef = sale.orders?.id?.slice(0, 8) || sale.id.slice(0, 8)

    showConfirm({
      title: `Anular venta #${saleRef}`,
      message: 'Esta acción anulará la orden y revertirá el stock de ingredientes consumidos. No se puede deshacer.',
      confirmLabel: 'Anular venta',
      variant: 'warning',
      inputLabel: 'Motivo de anulación',
      inputPlaceholder: 'Describa el motivo de la anulación...',
      inputRequired: true,
      onConfirm: async (motivo) => {
        if (!motivo?.trim()) {
          throw new Error('Motivo requerido para proceder con la anulación')
        }
        await cancelSale(sale.id, motivo.trim(), user?.id || '')
        toast.success('Venta anulada correctamente y stock de inventario revertido')
        refetchSales()
      },
    })
  }

  // Printing & Exports
  const handlePrint = async (sale: SaleReportItem) => {
    try {
      await printSaleTicket(sale, {
      restaurantName: restaurant?.nombre,
      commercialName: restaurant?.nombre_comercial,
      currency,
      ticketMessage: restaurant?.settings?.ticket_mensaje,
      ticketSize: restaurant?.settings?.ticket_tamano as '58mm' | '80mm' | undefined,
      title: 'Copia de Ticket',
    })
    } catch (err: any) {
      toast.error('Error al imprimir: ' + err.message)
    }
  };

  const handleExportCSV = () => {
    const headers = ['#', 'Fecha', 'Hora', 'Orden', 'Mesa', 'Cliente', 'Metodo de Pago', 'Cajero', 'Subtotal', 'Impuestos', 'Total', 'Estado'];
    const rows = sortedSales.map((s, index) => {
      const d = new Date(s.fecha);
      const dateStr = d.toLocaleDateString('es-NI');
      const timeStr = d.toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' });
      const pmStr = s.payments.map(p => p.payment_method?.nombre).filter(Boolean).join(' / ') || 'N/A';
      return [
        index + 1,
        dateStr,
        timeStr,
        s.orders?.id?.slice(0, 8) || s.id.slice(0, 8),
        s.orders?.mesa?.nombre || 'N/A',
        s.cliente || 'Consumidor Final',
        pmStr,
        s.cajero?.nombre || 'Sistema',
        s.subtotal,
        s.impuestos,
        s.total,
        s.estado
      ];
    });

    const csvContent = [headers, ...rows].map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_ventas_${from}_a_${to}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8" /></head>
      <body>
      <table border="1">
        <tr style="background-color:#166534; color:white; font-weight:bold;">
          <th>#</th>
          <th>Fecha</th>
          <th>Hora</th>
          <th>Orden</th>
          <th>Mesa</th>
          <th>Cliente</th>
          <th>Metodo de Pago</th>
          <th>Cajero</th>
          <th>Subtotal</th>
          <th>Impuestos</th>
          <th>Total</th>
          <th>Estado</th>
        </tr>
    `;

    sortedSales.forEach((s, index) => {
      const d = new Date(s.fecha);
      const dateStr = d.toLocaleDateString('es-NI');
      const timeStr = d.toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' });
      const pmStr = s.payments.map(p => p.payment_method?.nombre).filter(Boolean).join(' / ') || 'N/A';
      html += `
        <tr>
          <td>${index + 1}</td>
          <td>${dateStr}</td>
          <td>${timeStr}</td>
          <td>${s.orders?.id?.slice(0, 8) || s.id.slice(0, 8)}</td>
          <td>${s.orders?.mesa?.nombre || 'N/A'}</td>
          <td>${s.cliente || 'Consumidor Final'}</td>
          <td>${pmStr}</td>
          <td>${s.cajero?.nombre || 'Sistema'}</td>
          <td style="text-align:right;">${s.subtotal}</td>
          <td style="text-align:right;">${s.impuestos}</td>
          <td style="text-align:right;">${s.total}</td>
          <td>${s.estado}</td>
        </tr>
      `;
    });

    html += `</table></body></html>`;

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_ventas_${from}_a_${to}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const rName = restaurant?.nombre || 'POS Restaurant';
    const rows = sortedSales.map((s, index) => {
      const d = new Date(s.fecha);
      const dateStr = d.toLocaleDateString('es-NI');
      const timeStr = d.toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' });
      const pmStr = s.payments.map(p => p.payment_method?.nombre).filter(Boolean).join(' / ') || 'N/A';
      return `
        <tr${index % 2 === 0 ? '' : ' class="alt"'}>
          <td class="text-center">${index + 1}</td>
          <td>${dateStr}</td>
          <td>${timeStr}</td>
          <td class="text-mono">#${s.orders?.id?.slice(0, 8) || s.id.slice(0, 8)}</td>
          <td>${s.orders?.mesa?.nombre || '—'}</td>
          <td>${s.cliente || 'Consumidor Final'}</td>
          <td>${pmStr}</td>
          <td>${s.cajero?.nombre || 'Sistema'}</td>
          <td class="text-right">${currency} ${Number(s.subtotal).toFixed(2)}</td>
          <td class="text-right">${currency} ${Number(s.impuestos).toFixed(2)}</td>
          <td class="text-right font-bold">${currency} ${Number(s.total).toFixed(2)}</td>
          <td class="text-center"><span class="badge ${s.estado}">${s.estado === 'completada' ? 'Completada' : 'Anulada'}</span></td>
        </tr>
      `;
    }).join('');

    const { totalSales, count, ticketPromedio, impuestos } = periodStats;

    const printWindow = window.open('', '_blank', 'width=1024,height=768');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Reporte de Ventas - ${rName}</title>
          <style>
            @page { margin: 18mm 14mm; }
            * { box-sizing: border-box; }
            body {
              font-family: 'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
              font-size: 10px;
              color: #1e293b;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .page { max-width: 1100px; margin: 0 auto; }

            /* Header */
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              padding-bottom: 16px;
              border-bottom: 3px solid #166534;
              margin-bottom: 20px;
            }
            .header-left .brand { font-size: 20px; font-weight: 800; color: #166534; letter-spacing: -0.3px; }
            .header-left .subtitle { font-size: 11px; color: #64748b; margin-top: 2px; }
            .header-right { text-align: right; font-size: 9px; color: #94a3b8; line-height: 1.6; }

            /* Summary cards */
            .summary {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
              margin-bottom: 20px;
            }
            .card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 12px 14px;
              text-align: center;
            }
            .card .label { font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; font-weight: 700; }
            .card .value { font-size: 16px; font-weight: 800; color: #166534; margin-top: 4px; }
            .card .value.sub { color: #0f172a; }

            /* Table */
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 9.5px;
            }
            thead th {
              background: #166534;
              color: white;
              font-weight: 700;
              font-size: 8px;
              text-transform: uppercase;
              letter-spacing: 0.4px;
              padding: 9px 7px;
              text-align: left;
              border: none;
            }
            tbody td {
              padding: 7px;
              border-bottom: 1px solid #f1f5f9;
            }
            tbody tr.alt td { background: #f8fafc; }
            tbody tr:hover td { background: #f1f5f9; }

            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .text-mono { font-family: 'SF Mono', 'Cascadia Code', monospace; font-size: 9px; }
            .font-bold { font-weight: 700; }

            .badge {
              display: inline-block;
              padding: 2px 8px;
              font-size: 8px;
              font-weight: 700;
              border-radius: 10px;
              text-transform: capitalize;
            }
            .badge.completada { background: #d1fae5; color: #065f46; }
            .badge.anulada { background: #fee2e2; color: #991b1b; }

            /* Footer */
            .footer {
              margin-top: 24px;
              padding-top: 12px;
              border-top: 1px solid #e2e8f0;
              font-size: 8px;
              color: #94a3b8;
              display: flex;
              justify-content: space-between;
            }
          </style>
        </head>
        <body>
          <div class="page">
            <!-- Header -->
            <div class="header">
              <div class="header-left">
                <div class="brand">${rName}</div>
                <div class="subtitle">Reporte de Ventas · ${from} al ${to}</div>
              </div>
              <div class="header-right">
                <div>Generado: ${new Date().toLocaleString('es-NI')}</div>
                <div>${count} transacciones</div>
              </div>
            </div>

            <!-- Summary -->
            <div class="summary">
              <div class="card">
                <div class="label">Ventas Totales</div>
                <div class="value">${currency} ${totalSales.toFixed(2)}</div>
              </div>
              <div class="card">
                <div class="label">Transacciones</div>
                <div class="value sub">${count}</div>
              </div>
              <div class="card">
                <div class="label">Ticket Promedio</div>
                <div class="value">${currency} ${ticketPromedio.toFixed(2)}</div>
              </div>
              <div class="card">
                <div class="label">IVA Total</div>
                <div class="value sub">${currency} ${impuestos.toFixed(2)}</div>
              </div>
            </div>

            <!-- Table -->
            <table>
              <thead>
                <tr>
                  <th class="text-center">#</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Orden</th>
                  <th>Mesa</th>
                  <th>Cliente</th>
                  <th>Método Pago</th>
                  <th>Cajero</th>
                  <th class="text-right">Subtotal</th>
                  <th class="text-right">IVA</th>
                  <th class="text-right">Total</th>
                  <th class="text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>

            <!-- Footer -->
            <div class="footer">
              <span>${rName} · Reporte de Ventas</span>
              <span>Página 1 de 1</span>
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  function openEditGasto(exp: Expense) {
    setSelectedExpense(exp);
    setGForm({
      monto: String(exp.monto),
      descripcion: exp.descripcion,
      categoria: exp.categoria,
      fecha: exp.fecha.split('T')[0],
    });
    setShowEditGasto(true);
  }

  function openCreateGasto() {
    setGForm({
      monto: '',
      descripcion: '',
      categoria: 'insumos',
      fecha: getLocalDateISO(),
    });
    setShowCreateGasto(true);
  }

  const COLORS = ['#166534', '#3B82F6', '#047857', '#ca8a04', '#8B5CF6', '#0f766e'];

  const ranges: { id: ReportRange; label: string }[] = [
    { id: 'today', label: 'Hoy' },
    { id: 'week',  label: 'Esta semana' },
    { id: 'month', label: 'Este mes' },
    { id: 'custom', label: 'Personalizado' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gray-50/50 dark:bg-gray-900/50 min-h-screen text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Panel de Reportes</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {from === to ? `${new Date(from + 'T12:00:00').toLocaleDateString('es-NI', { weekday: 'long', day: 'numeric', month: 'long' })}`
              : `Periodo: ${from} al ${to}`}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button onClick={() => { refetchSales(); refetchExpenses(); toast.success('Datos actualizados'); }}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
            <RefreshCw size={18} className={`text-gray-600 dark:text-gray-300 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {activeTab === 'expenses' && isAdmin && (
            <button
              onClick={openCreateGasto}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand text-brand-foreground text-sm font-bold transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-brand/20 cursor-pointer"
            >
              <Plus size={18} /> Nuevo Gasto
            </button>
          )}
        </div>
      </div>

      {salesError && (
        <div className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive-muted px-4 py-3 text-sm font-semibold text-destructive">
          <AlertTriangle size={16} />
          Error al cargar ventas: {salesError}
        </div>
      )}

      {/* Range Select */}
      <div className="flex flex-wrap gap-2 items-center bg-white dark:bg-gray-800 p-2.5 rounded-2xl border border-gray-150/80 dark:border-gray-800/80 shadow-sm">
        {ranges.map(r => (
          <button key={r.id}
            onClick={() => setActiveRange(r.id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
              activeRange === r.id ? 'bg-brand text-brand-foreground shadow-md shadow-brand/10' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}>
            {r.label}
          </button>
        ))}
        {activeRange === 'custom' && (
          <div className="flex items-center gap-2 ml-2">
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
              className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand bg-white dark:bg-gray-800"
            />
            <span className="text-gray-400">→</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
              className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand bg-white dark:bg-gray-800"
            />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 gap-4">
        {[
          { id: 'sales', label: 'Reporte de Ventas', icon: <ShoppingBag size={16} /> },
          { id: 'products', label: 'Detalle de Productos Vendidos', icon: <Layers size={16} /> },
          { id: 'expenses', label: 'Detalle de Gastos (Egresos)', icon: <DollarSign size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 pb-3 px-2 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'border-brand text-brand'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: SALES REPORT */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          {/* KPI Dashboard Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Ventas del Día', value: fmt(totalToday), sub: 'Hoy en restaurante', icon: <TrendingUp size={18} /> },
              { label: 'Ventas del Mes', value: fmt(totalMonth), sub: 'Mes en curso', icon: <Calendar size={18} /> },
              { label: 'Órdenes en Filtro', value: periodStats.count, sub: 'Ventas completadas', icon: <ShoppingBag size={18} /> },
              { label: 'Ticket Promedio', value: fmt(periodStats.ticketPromedio), sub: 'Por orden en filtro', icon: <DollarSign size={18} /> },
              { label: 'Impuestos (IVA)', value: fmt(periodStats.impuestos), sub: 'Recaudados en filtro', icon: <Layers size={18} /> },
            ].map((card, i) => (
              <motion.div key={card.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150/70 dark:border-gray-800/80 p-5 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-brand-muted text-brand flex items-center justify-center mb-3">
                  {card.icon}
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold">{card.label}</p>
                <p className="font-extrabold text-gray-900 dark:text-white text-xl mt-1.5 truncate">
                  {loading ? <span className="inline-block w-20 h-5 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" /> : card.value}
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">{card.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Filters & Search Panel */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-150/70 dark:border-gray-800/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-sm font-extrabold text-gray-800 dark:text-gray-200">
              <SlidersHorizontal size={16} className="text-brand" />
              Filtrar y Buscar Ventas
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search input */}
              <div className="relative lg:col-span-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar orden, cliente..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm outline-none focus:border-brand bg-gray-50/50 dark:bg-gray-900/50"
                />
              </div>

              {/* Status Select */}
              <div>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm outline-none bg-white dark:bg-gray-800"
                >
                  <option value="Todos">Todos los Estados</option>
                  <option value="completada">Completadas</option>
                  <option value="anulada">Anuladas</option>
                </select>
              </div>

              {/* Payment Method Select */}
              <div>
                <select
                  value={filterPaymentMethod}
                  onChange={e => setFilterPaymentMethod(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm outline-none bg-white dark:bg-gray-800"
                >
                  <option value="Todos">Todos los Pagos</option>
                  {paymentMethods.map(pm => (
                    <option key={pm.id} value={pm.id}>{pm.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Cajero Select */}
              <div>
                <select
                  value={filterCajero}
                  onChange={e => setFilterCajero(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm outline-none bg-white dark:bg-gray-800"
                >
                  <option value="Todos">Todos los Cajeros</option>
                  {cajeros.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Mesa Select */}
              <div>
                <select
                  value={filterMesa}
                  onChange={e => setFilterMesa(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm outline-none bg-white dark:bg-gray-800"
                >
                  <option value="Todos">Todas las Mesas</option>
                  {mesas.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nombre === 'Mostrador' ? 'Mostrador' : m.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Collapsible Charts Section */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-150/70 dark:border-gray-800/80 shadow-sm">
            <h3 className="font-extrabold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
              <BarChart3 size={18} className="text-brand" />
              Gráficos de Análisis de Ventas
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Chart 1: Ventas por día */}
              <div className="bg-gray-50/50 dark:bg-gray-900/30 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Ventas por Día</p>
                <div className="h-56">
                  {chartSalesByDay.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-xs text-gray-400">Sin datos</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartSalesByDay}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 10 }} />
                        <YAxis tick={{ fill: '#888', fontSize: 10 }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="total" stroke="#166534" fill="#16653420" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Chart 2: Ventas por método de pago */}
              <div className="bg-gray-50/50 dark:bg-gray-900/30 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Métodos de Pago</p>
                <div className="h-56">
                  {chartSalesByPayment.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-xs text-gray-400">Sin datos</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartSalesByPayment}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 10 }} />
                        <YAxis tick={{ fill: '#888', fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                          {chartSalesByPayment.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Chart 3: Productos más vendidos */}
              <div className="bg-gray-50/50 dark:bg-gray-900/30 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Productos más Vendidos</p>
                <div className="h-56">
                  {chartTopProducts.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-xs text-gray-400">Sin datos</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartTopProducts} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tick={{ fill: '#888', fontSize: 10 }} />
                        <YAxis dataKey="name" type="category" width={80} tick={{ fill: '#888', fontSize: 9 }} />
                        <Tooltip />
                        <Bar dataKey="cantidad" fill="#10B981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Chart 4: Categorías más vendidas */}
              <div className="bg-gray-50/50 dark:bg-gray-900/30 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Ventas por Categoría</p>
                <div className="h-56">
                  {chartTopCategories.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-xs text-gray-400">Sin datos</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartTopCategories}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={75}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {chartTopCategories.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Chart 5: Horas con más ventas */}
              <div className="bg-gray-50/50 dark:bg-gray-900/30 p-4 rounded-xl border border-gray-100 dark:border-gray-800 lg:col-span-2 xl:col-span-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Horas con más Ventas</p>
                <div className="h-56">
                  {chartSalesByHour.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-xs text-gray-400">Sin datos</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartSalesByHour}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="hour" tick={{ fill: '#888', fontSize: 10 }} />
                        <YAxis tick={{ fill: '#888', fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="ventas" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sales Data Table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150/70 dark:border-gray-800/80 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3 bg-gray-50/20 dark:bg-gray-800/40">
              <h3 className="font-extrabold text-gray-900 dark:text-white">Listado de Ventas</h3>
              
              {/* Exports Buttons */}
              <div className="flex items-center gap-2">
                <button onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-bold transition-all shadow-sm cursor-pointer">
                  <Download size={14} className="text-gray-500" />
                  CSV
                </button>
                <button onClick={handleExportExcel}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-bold transition-all shadow-sm cursor-pointer">
                  <FileText size={14} className="text-brand" />
                  Excel
                </button>
                <button onClick={handleExportPDF}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-bold transition-all shadow-sm cursor-pointer">
                  <Printer size={14} className="text-blue-500" />
                  PDF
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-20 text-center text-gray-400 font-bold">Cargando registros...</div>
            ) : sortedSales.length === 0 ? (
              <div className="p-20 text-center text-gray-400">
                <ShoppingBag size={32} className="mx-auto mb-3 text-gray-300" />
                No se encontraron ventas para los criterios seleccionados.
              </div>
            ) : (
              <>
                {/* Vista móvil / tablet: tarjetas */}
                <div className="lg:hidden divide-y divide-gray-100 dark:divide-gray-800">
                  {paginatedSales.map((sale, index) => {
                    const d = new Date(sale.fecha);
                    const dateStr = d.toLocaleDateString('es-NI');
                    const timeStr = d.toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' });
                    const pmStr = sale.payments.map(p => p.payment_method?.nombre).filter(Boolean).join(' / ') || 'N/A';
                    const numConsecutivo = (currentPage - 1) * itemsPerPage + index + 1;

                    return (
                      <div key={sale.id} className="p-4 sm:p-5 space-y-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold text-gray-400">#{numConsecutivo}</span>
                              {renderSaleStatus(sale.estado)}
                            </div>
                            <p className="font-extrabold text-gray-900 dark:text-white mt-1 truncate">
                              {sale.cliente || 'Consumidor Final'}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">{dateStr} · {timeStr}</p>
                          </div>
                          <p className="text-base sm:text-lg font-black text-brand shrink-0">
                            {fmt(Number(sale.total))}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-gray-50 dark:bg-gray-900/40 rounded-xl px-3 py-2">
                            <span className="text-gray-400 font-semibold block">Orden</span>
                            <span className="font-mono text-gray-700 dark:text-gray-300">
                              #{sale.orders?.id?.slice(0, 8) || sale.id.slice(0, 8)}
                            </span>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-900/40 rounded-xl px-3 py-2">
                            <span className="text-gray-400 font-semibold block">Mesa</span>
                            <span className="text-gray-700 dark:text-gray-300">{sale.orders?.mesa?.nombre || 'N/A'}</span>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-900/40 rounded-xl px-3 py-2">
                            <span className="text-gray-400 font-semibold block">Pago</span>
                            <span className="text-gray-700 dark:text-gray-300 truncate block">{pmStr}</span>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-900/40 rounded-xl px-3 py-2">
                            <span className="text-gray-400 font-semibold block">Cajero</span>
                            <span className="text-gray-700 dark:text-gray-300 truncate block">{sale.cajero?.nombre || 'Sistema'}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-800">
                          <div className="text-[11px] text-gray-500 font-semibold">
                            Sub: {fmt(Number(sale.subtotal))} · IVA: {fmt(Number(sale.impuestos))}
                          </div>
                          {renderSaleActions(sale, true)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Vista desktop: tabla */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full min-w-[900px] text-sm text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800 text-xs text-gray-500 uppercase tracking-wider font-semibold bg-gray-50/50 dark:bg-gray-800/20 select-none">
                        <th className="px-4 xl:px-5 py-4">#</th>
                        <th className="px-4 xl:px-5 py-4 cursor-pointer hover:text-brand" onClick={() => toggleSort('fecha')}>
                          <div className="flex items-center gap-1">Fecha / Hora <ArrowUpDown size={12} /></div>
                        </th>
                        <th className="px-4 xl:px-5 py-4 hidden xl:table-cell">Orden</th>
                        <th className="px-4 xl:px-5 py-4">Mesa</th>
                        <th className="px-4 xl:px-5 py-4 cursor-pointer hover:text-brand" onClick={() => toggleSort('cliente')}>
                          <div className="flex items-center gap-1">Cliente <ArrowUpDown size={12} /></div>
                        </th>
                        <th className="px-4 xl:px-5 py-4 hidden xl:table-cell">Pago</th>
                        <th className="px-4 xl:px-5 py-4 hidden 2xl:table-cell">Cajero</th>
                        <th className="px-4 xl:px-5 py-4 text-right cursor-pointer hover:text-brand hidden 2xl:table-cell" onClick={() => toggleSort('subtotal')}>
                          <div className="flex items-center justify-end gap-1">Subtotal <ArrowUpDown size={12} /></div>
                        </th>
                        <th className="px-4 xl:px-5 py-4 text-right cursor-pointer hover:text-brand hidden 2xl:table-cell" onClick={() => toggleSort('impuestos')}>
                          <div className="flex items-center justify-end gap-1">IVA <ArrowUpDown size={12} /></div>
                        </th>
                        <th className="px-4 xl:px-5 py-4 text-right cursor-pointer hover:text-brand" onClick={() => toggleSort('total')}>
                          <div className="flex items-center justify-end gap-1">Total <ArrowUpDown size={12} /></div>
                        </th>
                        <th className="px-4 xl:px-5 py-4 text-center">Estado</th>
                        <th className="px-4 xl:px-5 py-4 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedSales.map((sale, index) => {
                        const d = new Date(sale.fecha);
                        const dateStr = d.toLocaleDateString('es-NI');
                        const timeStr = d.toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' });
                        const pmStr = sale.payments.map(p => p.payment_method?.nombre).filter(Boolean).join(' / ') || 'N/A';
                        const numConsecutivo = (currentPage - 1) * itemsPerPage + index + 1;

                        return (
                          <tr key={sale.id} className="border-b border-gray-50 dark:border-gray-800/40 hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors font-medium">
                            <td className="px-4 xl:px-5 py-3.5 text-gray-400 font-semibold">{numConsecutivo}</td>
                            <td className="px-4 xl:px-5 py-3.5">
                              <div>{dateStr}</div>
                              <div className="text-xs text-gray-400 font-medium">{timeStr}</div>
                            </td>
                            <td className="px-4 xl:px-5 py-3.5 font-mono text-xs text-gray-500 hidden xl:table-cell">
                              #{sale.orders?.id?.slice(0, 8) || sale.id.slice(0, 8)}
                            </td>
                            <td className="px-4 xl:px-5 py-3.5 text-gray-800 dark:text-gray-200">
                              {sale.orders?.mesa?.nombre || 'N/A'}
                            </td>
                            <td className="px-4 xl:px-5 py-3.5 text-gray-900 dark:text-white font-bold max-w-[140px] truncate">
                              {sale.cliente || 'Consumidor Final'}
                            </td>
                            <td className="px-4 xl:px-5 py-3.5 text-xs hidden xl:table-cell">
                              <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-lg">
                                {pmStr}
                              </span>
                            </td>
                            <td className="px-4 xl:px-5 py-3.5 text-gray-500 hidden 2xl:table-cell">
                              {sale.cajero?.nombre || 'Sistema'}
                            </td>
                            <td className="px-4 xl:px-5 py-3.5 text-right text-gray-600 dark:text-gray-400 hidden 2xl:table-cell">
                              {fmt(Number(sale.subtotal))}
                            </td>
                            <td className="px-4 xl:px-5 py-3.5 text-right text-gray-500 hidden 2xl:table-cell">
                              {fmt(Number(sale.impuestos))}
                            </td>
                            <td className="px-4 xl:px-5 py-3.5 text-right text-gray-900 dark:text-white font-extrabold text-sm">
                              {fmt(Number(sale.total))}
                            </td>
                            <td className="px-4 xl:px-5 py-3.5 text-center">
                              {renderSaleStatus(sale.estado)}
                            </td>
                            <td className="px-4 xl:px-5 py-3.5">
                              {renderSaleActions(sale)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-4 sm:px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/20 dark:bg-gray-800/40">
                <span className="text-xs text-gray-400 font-bold text-center sm:text-left">
                  Página {currentPage} de {totalPages} ({sortedSales.length} registros)
                </span>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 disabled:opacity-50 text-gray-600 dark:text-gray-300 cursor-pointer"
                    aria-label="Página anterior">
                    <ChevronLeft size={16} />
                  </button>
                  <div className="hidden sm:flex items-center gap-2">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          currentPage === i + 1 ? 'bg-brand text-brand-foreground' : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                        }`}>
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <span className="sm:hidden text-xs font-bold text-gray-500 px-2">{currentPage} / {totalPages}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 disabled:opacity-50 text-gray-600 dark:text-gray-300 cursor-pointer"
                    aria-label="Página siguiente">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DETALLE DE PRODUCTOS VENDIDOS */}
      {activeTab === 'products' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150/70 dark:border-gray-800/80 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-gray-900 dark:text-white">Desglose de Ventas por Producto</h3>
              <p className="text-xs text-gray-400 mt-0.5">Identifique los productos con mayor demanda e ingresos</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Ingreso Neto en Productos</span>
              <span className="text-lg font-black text-brand">{fmt(productsBreakdown.totalRevenue)}</span>
            </div>
          </div>

          {productsBreakdown.list.length === 0 ? (
            <div className="p-20 text-center text-gray-400">
              No hay datos disponibles en el rango de fechas seleccionado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-xs text-gray-500 uppercase tracking-wider font-semibold bg-gray-50/50 dark:bg-gray-800/20 select-none">
                    <th className="px-6 py-4 cursor-pointer hover:text-brand" onClick={() => toggleProdSort('producto')}>
                      <div className="flex items-center gap-1">Producto <ArrowUpDown size={12} /></div>
                    </th>
                    <th className="px-6 py-4 cursor-pointer hover:text-brand" onClick={() => toggleProdSort('categoria')}>
                      <div className="flex items-center gap-1">Categoría <ArrowUpDown size={12} /></div>
                    </th>
                    <th className="px-6 py-4 text-right cursor-pointer hover:text-brand" onClick={() => toggleProdSort('cantidad')}>
                      <div className="flex items-center justify-end gap-1">Cantidad Vendida <ArrowUpDown size={12} /></div>
                    </th>
                    <th className="px-6 py-4 text-right cursor-pointer hover:text-brand" onClick={() => toggleProdSort('ingresos')}>
                      <div className="flex items-center justify-end gap-1">Ingresos Generados <ArrowUpDown size={12} /></div>
                    </th>
                    <th className="px-6 py-4 text-right cursor-pointer hover:text-brand" onClick={() => toggleProdSort('participacion')}>
                      <div className="flex items-center justify-end gap-1">% Participación <ArrowUpDown size={12} /></div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map(p => (
                    <tr key={p.product} className="border-b border-gray-50 dark:border-gray-800/40 hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors font-medium">
                      <td className="px-6 py-3.5 text-gray-900 dark:text-white font-bold">{p.product}</td>
                      <td className="px-6 py-3.5">
                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-lg text-xs font-semibold capitalize">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono text-gray-900 dark:text-white font-bold">
                        {p.quantity} uds
                      </td>
                      <td className="px-6 py-3.5 text-right text-gray-900 dark:text-white font-extrabold">
                        {fmt(p.revenue)}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div>{p.participacion.toFixed(1)}%</div>
                        <div className="w-24 bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full ml-auto mt-1 overflow-hidden">
                          <div className="h-full bg-brand" style={{ width: `${p.participacion}%` }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Products Table Pagination */}
          {totalProdPages > 1 && (
            <div className="px-6 py-4.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/20 dark:bg-gray-800/40">
              <span className="text-xs text-gray-400 font-bold">
                Página {prodPage} de {totalProdPages} ({productsBreakdown.list.length} productos)
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => setProdPage(p => Math.max(p - 1, 1))}
                  disabled={prodPage === 1}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 disabled:opacity-50 text-gray-600 dark:text-gray-300 cursor-pointer">
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalProdPages }).map((_, i) => (
                  <button key={i}
                    onClick={() => setProdPage(i + 1)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      prodPage === i + 1 ? 'bg-brand text-brand-foreground' : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                    }`}>
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setProdPage(p => Math.min(p + 1, totalProdPages))}
                  disabled={prodPage === totalProdPages}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 disabled:opacity-50 text-gray-600 dark:text-gray-300 cursor-pointer">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DETALLE DE GASTOS */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          {expError && (
            <div className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive-muted px-4 py-3 text-sm font-semibold text-destructive">
              <AlertTriangle size={16} />
              Error al cargar gastos: {expError}
            </div>
          )}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-150/70 dark:border-gray-800/80 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/20 dark:bg-gray-800/40">
            <div>
              <h3 className="font-extrabold text-gray-900 dark:text-white">Detalle de Gastos (Egresos)</h3>
              <p className="text-xs text-gray-400 mt-0.5">Control de gastos operativos del restaurante</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-black text-destructive">{fmt(expensesTotal)}</span>
              {isAdmin && (
                <button
                  onClick={openCreateGasto}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-brand-foreground text-xs font-bold cursor-pointer"
                >
                  <Plus size={14} /> Agregar Gasto
                </button>
              )}
            </div>
          </div>
          {expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
              <DollarSign size={28} className="mb-2" />
              <p className="text-sm font-semibold">No hay gastos registrados en este período</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-xs text-gray-500 uppercase tracking-wider font-semibold bg-gray-50/50 dark:bg-gray-800/20">
                    <th className="px-5 py-3.5">Fecha</th>
                    <th className="px-5 py-3.5">Descripción</th>
                    <th className="px-5 py-3.5">Categoría</th>
                    <th className="px-5 py-3.5 text-right">Monto</th>
                    {isAdmin && <th className="px-5 py-3.5 text-center">Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(exp => (
                    <tr key={exp.id} className="border-b border-gray-50 dark:border-gray-800/40 hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors font-medium">
                      <td className="px-5 py-3.5 text-gray-500 text-xs">
                        {new Date(exp.fecha).toLocaleDateString('es-NI')}
                      </td>
                      <td className="px-5 py-3.5 text-gray-800 dark:text-gray-200">{exp.descripcion}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-lg capitalize font-bold">
                          {exp.categoria}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-extrabold text-gray-900 dark:text-white">{fmt(exp.monto)}</td>
                      {isAdmin && (
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openEditGasto(exp)}
                              className="w-8.5 h-8.5 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
                              title="Editar Gasto"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteGasto(exp.id)}
                              className="w-8.5 h-8.5 flex items-center justify-center rounded-xl bg-destructive-muted text-destructive hover:bg-destructive/20 transition-colors cursor-pointer"
                              title="Eliminar Gasto"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </div>
      )}

      {/* MODAL: DETAIL OF A SALE */}
      <AnimatePresence>
        {detailSale && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800"
            >
              <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-gray-900 dark:text-white text-lg">Detalle de la Venta</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Orden #{detailSale.orders?.id?.slice(0, 8) || detailSale.id.slice(0, 8)}</p>
                </div>
                <button onClick={() => setDetailSale(null)} className="p-1 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                  <X size={18} className="text-gray-400 hover:text-gray-600" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* General Info */}
                <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 dark:bg-gray-900/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800/60 font-semibold text-gray-600 dark:text-gray-400">
                  <div>
                    <span className="text-xs text-gray-400 block mb-0.5">Fecha y Hora</span>
                    <span className="text-gray-900 dark:text-white">{new Date(detailSale.fecha).toLocaleDateString()} {new Date(detailSale.fecha).toLocaleTimeString()}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block mb-0.5">Mesa / Ubicación</span>
                    <span className="text-gray-900 dark:text-white">{detailSale.orders?.mesa?.nombre || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block mb-0.5">Cliente</span>
                    <span className="text-gray-900 dark:text-white font-extrabold text-brand">{detailSale.cliente || 'Consumidor Final'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block mb-0.5">Cajero</span>
                    <span className="text-gray-900 dark:text-white">{detailSale.cajero?.nombre || 'Sistema'}</span>
                  </div>
                </div>

                {/* Items sold */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Productos Vendidos</p>
                  <div className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden bg-white dark:bg-gray-800">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 font-bold border-b border-gray-100 dark:border-gray-800">
                          <th className="px-4 py-2.5">Detalle</th>
                          <th className="px-4 py-2.5 text-right">Cant</th>
                          <th className="px-4 py-2.5 text-right">Unitario</th>
                          <th className="px-4 py-2.5 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(detailSale.orders?.order_items ?? []).map(item => (
                          <tr key={item.id} className="border-b border-gray-50 dark:border-gray-800/40 text-gray-700 dark:text-gray-300 font-medium">
                            <td className="px-4 py-2.5">{item.product?.nombre || 'Producto Eliminado'}</td>
                            <td className="px-4 py-2.5 text-right font-bold">{item.cantidad}</td>
                            <td className="px-4 py-2.5 text-right">{fmt(item.precio_unitario)}</td>
                            <td className="px-4 py-2.5 text-right font-bold">{fmt(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Finance Summary */}
                <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-gray-800 text-sm font-semibold">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal:</span>
                    <span>{fmt(Number(detailSale.subtotal))}</span>
                  </div>
                  {detailSale.descuento > 0 && (
                    <div className="flex justify-between text-destructive">
                      <span>Descuento:</span>
                      <span>-{fmt(Number(detailSale.descuento))}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-500">
                    <span>Impuestos (IVA):</span>
                    <span>{fmt(Number(detailSale.impuestos))}</span>
                  </div>
                  <div className="flex justify-between text-gray-900 dark:text-white font-extrabold text-base pt-1 border-t border-gray-50 dark:border-gray-800">
                    <span>TOTAL:</span>
                    <span className="text-lg text-brand">{fmt(Number(detailSale.total))}</span>
                  </div>
                </div>

                {/* Payments */}
                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Métodos de Pago Utilizados</p>
                  <div className="space-y-1.5">
                    {detailSale.payments.map((p, idx) => (
                      <div key={p.id || idx} className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                        <div>
                          <p className="font-extrabold text-gray-900 dark:text-white">{p.payment_method?.nombre || 'Pago'}</p>
                          {p.referencia && <p className="text-xs text-gray-400 font-medium">Ref: {p.referencia}</p>}
                          {p.nota && <p className="text-xs text-gray-400 font-medium">Nota: {p.nota}</p>}
                        </div>
                        <span className="text-sm font-extrabold text-brand">{fmt(p.monto)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex flex-col sm:flex-row justify-end gap-2">
                <button onClick={() => handlePrint(detailSale)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-bold transition-all cursor-pointer">
                  <Printer size={14} /> Reimprimir Ticket
                </button>
                {detailSale.estado !== 'anulada' && isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleCancelSale(detailSale)}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Ban size={14} /> Anular
                  </button>
                )}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDeleteSale(detailSale)}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-destructive/20 bg-destructive-muted text-destructive hover:bg-destructive/20 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Trash2 size={14} /> Eliminar
                  </button>
                )}
                <button onClick={() => setDetailSale(null)}
                  className="px-4 py-2 rounded-xl bg-brand text-brand-foreground text-xs font-bold cursor-pointer">
                  Cerrar Detalle
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: CREATE EXPENSE */}
      {showCreateGasto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900 dark:text-white">Registrar Nuevo Gasto</h3>
              <button onClick={() => setShowCreateGasto(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateGasto} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300 block mb-1">Monto ({currency})</label>
                <input
                  type="number"
                  step="0.01"
                  value={gForm.monto}
                  onChange={e => setGForm(f => ({ ...f, monto: e.target.value }))}
                  placeholder="0.00"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand bg-white dark:bg-gray-800"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300 block mb-1">Descripción</label>
                <input
                  type="text"
                  value={gForm.descripcion}
                  onChange={e => setGForm(f => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Ej: Compra de verduras / Pago de luz"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand bg-white dark:bg-gray-800"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300 block mb-1">Categoría</label>
                <select
                  value={gForm.categoria}
                  onChange={e => setGForm(f => ({ ...f, categoria: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand bg-white dark:bg-gray-800"
                  required
                >
                  <option value="insumos">Insumos / Ingredientes</option>
                  <option value="servicios">Servicios (Agua, Luz, Internet)</option>
                  <option value="nomina">Nómina / Salarios</option>
                  <option value="alquiler">Alquiler</option>
                  <option value="marketing">Marketing / Publicidad</option>
                  <option value="otros">Otros</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300 block mb-1">Fecha</label>
                <input
                  type="date"
                  value={gForm.fecha}
                  onChange={e => setGForm(f => ({ ...f, fecha: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand bg-white dark:bg-gray-800"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateGasto(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-brand text-brand-foreground text-sm font-medium disabled:opacity-60 cursor-pointer">
                  {saving ? 'Registrando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL: EDIT EXPENSE */}
      {showEditGasto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900 dark:text-white">Editar Gasto</h3>
              <button onClick={() => { setShowEditGasto(false); setSelectedExpense(null); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEditGasto} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300 block mb-1">Monto ({currency})</label>
                <input
                  type="number"
                  step="0.01"
                  value={gForm.monto}
                  onChange={e => setGForm(f => ({ ...f, monto: e.target.value }))}
                  placeholder="0.00"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand bg-white dark:bg-gray-800"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300 block mb-1">Descripción</label>
                <input
                  type="text"
                  value={gForm.descripcion}
                  onChange={e => setGForm(f => ({ ...f, descripcion: e.target.value }))}
                  placeholder="Ej: Compra de verduras / Pago de luz"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand bg-white dark:bg-gray-800"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300 block mb-1">Categoría</label>
                <select
                  value={gForm.categoria}
                  onChange={e => setGForm(f => ({ ...f, categoria: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand bg-white dark:bg-gray-800"
                  required
                >
                  <option value="insumos">Insumos / Ingredientes</option>
                  <option value="servicios">Servicios (Agua, Luz, Internet)</option>
                  <option value="nomina">Nómina / Salarios</option>
                  <option value="alquiler">Alquiler</option>
                  <option value="marketing">Marketing / Publicidad</option>
                  <option value="otros">Otros</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-600 dark:text-gray-300 block mb-1">Fecha</label>
                <input
                  type="date"
                  value={gForm.fecha}
                  onChange={e => setGForm(f => ({ ...f, fecha: e.target.value }))}
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand bg-white dark:bg-gray-800"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowEditGasto(false); setSelectedExpense(null); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 cursor-pointer font-bold">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-brand text-brand-foreground text-sm font-medium disabled:opacity-60 cursor-pointer font-bold">
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <ConfirmDialog
        open={!!dialog}
        loading={dialogLoading}
        title={dialog?.title ?? ''}
        message={dialog?.message ?? ''}
        confirmLabel={dialog?.confirmLabel}
        variant={dialog?.variant}
        inputLabel={dialog?.inputLabel}
        inputPlaceholder={dialog?.inputPlaceholder}
        inputRequired={dialog?.inputRequired}
        onConfirm={handleDialogConfirm}
        onCancel={() => setDialog(null)}
      />
    </div>
  );
}
