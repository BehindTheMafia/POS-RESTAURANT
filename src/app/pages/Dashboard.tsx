import { useEffect, useState } from 'react';
import {
  TrendingUp, ShoppingBag, Tag, XCircle, Package,
  RefreshCw, Calendar, AlertTriangle, DollarSign, BarChart2
} from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboard';
import { useAuthContext } from '../AuthContext';
import { useRestaurant } from '../../hooks/useRestaurant';
import { getLocalDateISO } from '../../lib/dates';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { Button } from '../components/ui/button';

export function Dashboard() {
  const { user } = useAuthContext();
  const { restaurant } = useRestaurant();
  const { stats, topProducts, inventoryLow, salesByPayment, expenses_total, loading, error, fetchDashboard } = useDashboard();
  const [dateFrom, setDateFrom] = useState(getLocalDateISO());
  const [dateTo, setDateTo] = useState(getLocalDateISO());

  const currency = restaurant?.moneda ?? 'C$';

  useEffect(() => { fetchDashboard(dateFrom, dateTo); }, [dateFrom, dateTo]);

  const fmt = (n: number) => `${currency} ${n.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const metricCards = [
    {
      label: 'Ventas del período', value: fmt(stats.ventas_total),
      sub: `${stats.ventas_count} transacciones`, icon: <TrendingUp size={20} />,
    },
    {
      label: 'Descuentos', value: fmt(stats.descuentos_total),
      sub: 'Total descontado', icon: <Tag size={20} />, color: '#8B5CF6', bg: '#8B5CF615',
    },
    {
      label: 'Anulaciones', value: `${stats.anulaciones_count}`,
      sub: fmt(stats.anulaciones_total), icon: <XCircle size={20} />, color: '#EF4444', bg: '#EF444415',
    },
    {
      label: 'Gastos', value: fmt(expenses_total),
      sub: 'Gastos del período', icon: <ShoppingBag size={20} />, color: '#F59E0B', bg: '#F59E0B15',
    },
    {
      label: 'Utilidad estimada', value: fmt(stats.ventas_total - expenses_total - stats.descuentos_total),
      sub: 'Ventas - Gastos - Descuentos', icon: <BarChart2 size={20} />, color: '#10B981', bg: '#10B98115',
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title={`Bienvenido, ${user?.profile?.nombre?.split(' ')[0] ?? 'Usuario'}`}
        subtitle="Resumen de tu negocio"
        actions={
          <>
            <input
              type="date" value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white outline-none focus:border-primary min-h-11"
            />
            <span className="text-gray-400 text-sm hidden sm:inline">→</span>
            <input
              type="date" value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white outline-none focus:border-primary min-h-11"
            />
            <Button variant="outline" size="iconTouch" onClick={() => fetchDashboard(dateFrom, dateTo)} aria-label="Actualizar">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </Button>
          </>
        }
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{error}</div>
      )}

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricCards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={loading ? '...' : card.value}
            sub={card.sub}
            icon={card.icon}
            color={card.color}
            bg={card.bg}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top productos */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package size={16} className="text-brand" /> Top Productos
          </h3>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg animate-pulse" />
                  <div className="flex-1 h-4 bg-gray-100 rounded animate-pulse" />
                  <div className="w-16 h-4 bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : topProducts.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Sin datos para el período seleccionado</p>
          ) : (
            <div className="space-y-2">
              {topProducts.map((p, i) => (
                <div key={p.nombre} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-brand-muted text-brand' : 'bg-gray-100 text-gray-500'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 font-medium truncate">{p.nombre}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-gray-700">{fmt(p.total_ventas)}</p>
                    <p className="text-xs text-gray-400">{p.cantidad_vendida} uds</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inventario bajo */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            Inventario Bajo Mínimo
            {inventoryLow.length > 0 && (
              <span className="ml-auto bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                {inventoryLow.length} alertas
              </span>
            )}
          </h3>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : inventoryLow.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 bg-success-muted rounded-full flex items-center justify-center mb-3">
                <Package size={20} className="text-success" />
              </div>
              <p className="text-gray-500 text-sm">Todo el inventario está en niveles correctos</p>
            </div>
          ) : (
            <div className="space-y-2">
              {inventoryLow.map(item => (
                <div key={item.id}
                  className="flex items-center gap-3 px-3 py-2.5 bg-amber-50 rounded-xl border border-amber-100">
                  <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.nombre}</p>
                    <p className="text-xs text-amber-600">
                      Stock: {item.stock_actual} {item.unidad} / Mín: {item.stock_minimo}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ventas por método de pago */}
      {salesByPayment.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Ventas por Método de Pago</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {salesByPayment.map((sp, i) => (
              <div key={i} className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">{sp.metodo_pago}</p>
                {sp.banco && <p className="text-xs text-gray-400 mb-1">{sp.banco}</p>}
                <p className="font-bold text-gray-900">{fmt(sp.total_monto ?? 0)}</p>
                <p className="text-xs text-gray-400">{sp.num_pagos} pagos</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
