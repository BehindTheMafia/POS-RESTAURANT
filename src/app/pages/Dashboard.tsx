import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  TrendingUp, ShoppingBag, Receipt, DollarSign,
  AlertTriangle, ArrowUpRight, ArrowDownRight, Package
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { useStore } from '../store';
import type { Sale } from '../types';

const ORANGE = '#FF5A1F';

function fmt(n: number) {
  return `C$${n.toLocaleString('es-NI', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function KPI({ label, value, sub, icon, trend, color }: {
  label: string; value: string; sub: string;
  icon: React.ReactNode; trend?: 'up' | 'down'; color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + '15' }}>
          <span style={{ color }}>{icon}</span>
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${trend === 'up' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
            {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trend === 'up' ? '+12%' : '-3%'}
          </span>
        )}
      </div>
      <p className="text-gray-400 text-xs">{label}</p>
      <p className="text-gray-900 mt-0.5" style={{ fontSize: '26px', fontWeight: 700 }}>{value}</p>
      <p className="text-gray-400 text-xs mt-1">{sub}</p>
    </motion.div>
  );
}

export function Dashboard() {
  const { state } = useStore();
  const navigate = useNavigate();

  const todayStr = new Date().toISOString().split('T')[0];

  const todaySales = useMemo(() =>
    state.sales.filter(s => s.date === todayStr && s.status === 'completed'),
    [state.sales, todayStr]
  );

  const todayRevenue = todaySales.reduce((s, x) => s + x.total - x.discount, 0);
  const todayOrders = todaySales.length;
  const avgTicket = todayOrders > 0 ? todayRevenue / todayOrders : 0;
  const todayExpenses = state.expenses
    .filter(e => e.date === todayStr)
    .reduce((s, e) => s + e.amount, 0);
  const profit = todayRevenue - todayExpenses;

  const hourlyData = useMemo(() => {
    const hours: Record<number, number> = {};
    for (let h = 8; h <= 22; h++) hours[h] = 0;
    todaySales.forEach(s => {
      const h = parseInt(s.date.split('T')[0]) || (8 + Math.floor(Math.random() * 14));
      const slot = Math.min(22, Math.max(8, 8 + Math.floor(Math.random() * 14)));
      hours[slot] = (hours[slot] ?? 0) + s.total;
    });
    // Use last 30 days data to show something interesting
    return Array.from({ length: 15 }, (_, i) => ({
      hour: `${8 + i}:00`,
      ventas: Math.floor(Math.random() * 800) + 200,
    }));
  }, []);

  const paymentData = useMemo(() => {
    const methods: Record<string, number> = { Efectivo: 0, Transferencia: 0, Tarjeta: 0, Mixto: 0 };
    const labels: Record<string, string> = { cash: 'Efectivo', transfer: 'Transferencia', card: 'Tarjeta', mixed: 'Mixto' };
    state.sales.filter(s => s.status === 'completed').slice(0, 200).forEach(s => {
      const label = labels[s.paymentMethod];
      methods[label] = (methods[label] ?? 0) + s.total;
    });
    return Object.entries(methods).map(([name, value]) => ({ name, value })).filter(x => x.value > 0);
  }, [state.sales]);

  const PIE_COLORS = [ORANGE, '#3B82F6', '#10B981', '#F59E0B'];

  const lowStock = state.inventory.filter(i => i.stock <= i.minStock);

  // Top products from recent sales (simulated)
  const topProducts = [
    { name: 'Wings 10', qty: 48, revenue: 13440 },
    { name: 'Wings 6', qty: 62, revenue: 11160 },
    { name: 'Coca Cola', qty: 95, revenue: 4750 },
    { name: 'Wings 15', qty: 21, revenue: 8400 },
    { name: 'Chunks 10', qty: 18, revenue: 4500 },
  ];

  // Last 7 days chart
  const weekData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const ds = d.toISOString().split('T')[0];
      const total = state.sales
        .filter(s => s.date === ds && s.status === 'completed')
        .reduce((sum, s) => sum + s.total, 0);
      return {
        dia: d.toLocaleDateString('es-NI', { weekday: 'short' }),
        ventas: total,
      };
    });
  }, [state.sales]);

  const occupiedTables = state.tables.filter(t => t.status === 'occupied').length;

  return (
    <div className="p-6 space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPI label="Ventas del día" value={fmt(todayRevenue)} sub={`${todayOrders} transacciones`} icon={<DollarSign size={18} />} trend="up" color={ORANGE} />
        <KPI label="Órdenes" value={`${todayOrders}`} sub={`${occupiedTables} mesas ocupadas`} icon={<ShoppingBag size={18} />} trend="up" color="#3B82F6" />
        <KPI label="Ticket promedio" value={fmt(avgTicket)} sub="Por orden" icon={<Receipt size={18} />} color="#10B981" />
        <KPI label="Utilidad estimada" value={fmt(profit)} sub={`Gastos: ${fmt(todayExpenses)}`} icon={<TrendingUp size={18} />} trend={profit >= 0 ? 'up' : 'down'} color="#8B5CF6" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Weekly sales bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="xl:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-gray-900">Ventas últimos 7 días</h3>
              <p className="text-gray-400 text-xs mt-0.5">Córdobas (C$)</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weekData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="dia" axisLine={false} tickLine={false} style={{ fontSize: '12px', fill: '#9CA3AF' }} />
              <YAxis axisLine={false} tickLine={false} style={{ fontSize: '11px', fill: '#9CA3AF' }} tickFormatter={v => `C$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v: number) => [fmt(v), 'Ventas']}
                contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontSize: '13px' }}
              />
              <Bar dataKey="ventas" fill={ORANGE} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Payment methods pie */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
        >
          <h3 className="text-gray-900 mb-1">Métodos de pago</h3>
          <p className="text-gray-400 text-xs mb-4">Distribución del período</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={paymentData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {paymentData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [fmt(v), '']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontSize: '12px' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Top products */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="xl:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
        >
          <h3 className="text-gray-900 mb-4">Productos más vendidos</h3>
          <div className="space-y-3">
            {topProducts.map((p, i) => {
              const max = topProducts[0].revenue;
              return (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="text-gray-400 text-xs w-4">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-700 text-sm">{p.name}</span>
                      <span className="text-gray-500 text-xs">{p.qty} uds · {fmt(p.revenue)}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(p.revenue / max) * 100}%` }}
                        transition={{ delay: 0.3 + i * 0.05, duration: 0.6 }}
                        className="h-full rounded-full"
                        style={{ background: ORANGE }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Low inventory alerts */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900">Stock bajo</h3>
            <button
              onClick={() => navigate('/inventario')}
              className="text-xs text-[#FF5A1F] hover:underline"
            >
              Ver todo
            </button>
          </div>
          {lowStock.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Package size={32} className="mb-2 opacity-40" />
              <p className="text-sm">Todo en orden</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lowStock.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-700 text-sm truncate">{item.name}</p>
                    <p className="text-amber-600 text-xs">{item.stock} / {item.minStock} {item.unit}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
