import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';
import { Download, TrendingUp, TrendingDown, DollarSign, Receipt } from 'lucide-react';
import { useStore } from '../store';

function fmt(n: number) {
  return `C$${(n ?? 0).toLocaleString('es-NI', { minimumFractionDigits: 0 })}`;
}

const ORANGE = '#FF5A1F';

export function Reports() {
  const { state } = useStore();
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

  const filtered = useMemo(() =>
    state.sales.filter(s => s.date >= dateFrom && s.date <= dateTo && s.status === 'completed'),
    [state.sales, dateFrom, dateTo]
  );

  const totalRevenue = filtered.reduce((s, x) => s + x.total - x.discount, 0);
  const totalDiscount = filtered.reduce((s, x) => s + x.discount, 0);
  const totalTax = filtered.reduce((s, x) => s + x.tax, 0);
  const avgTicket = filtered.length > 0 ? totalRevenue / filtered.length : 0;
  const cancelledCount = state.sales.filter(s => s.date >= dateFrom && s.date <= dateTo && s.status === 'cancelled').length;

  // Daily data
  const dailyData = useMemo(() => {
    const map: Record<string, { date: string; ventas: number; ordenes: number }> = {};
    filtered.forEach(s => {
      if (!map[s.date]) map[s.date] = { date: s.date, ventas: 0, ordenes: 0 };
      map[s.date].ventas += s.total - s.discount;
      map[s.date].ordenes += 1;
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date)).map(d => ({
      ...d,
      dia: new Date(d.date + 'T00:00:00').toLocaleDateString('es-NI', { month: 'short', day: 'numeric' }),
    }));
  }, [filtered]);

  // By payment method
  const byMethod = useMemo(() => {
    const m: Record<string, number> = {};
    const labels: Record<string, string> = { cash: 'Efectivo', transfer: 'Transferencia', card: 'Tarjeta', mixed: 'Mixto' };
    filtered.forEach(s => {
      const l = labels[s.paymentMethod];
      m[l] = (m[l] ?? 0) + (s.total - s.discount);
    });
    return Object.entries(m).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);
  }, [filtered]);

  // By cashier
  const byCashier = useMemo(() => {
    const m: Record<string, { name: string; total: number; count: number }> = {};
    filtered.forEach(s => {
      if (!m[s.cashierId]) m[s.cashierId] = { name: s.cashierName, total: 0, count: 0 };
      m[s.cashierId].total += s.total - s.discount;
      m[s.cashierId].count += 1;
    });
    return Object.values(m).sort((a, b) => b.total - a.total);
  }, [filtered]);

  return (
    <div className="p-6 space-y-6">
      {/* Date range */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <span className="text-gray-500 text-sm">Período:</span>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#FF5A1F]" />
        <span className="text-gray-400 text-sm">—</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#FF5A1F]" />
        <div className="ml-auto flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm transition-all">
            <Download size={14} />
            Excel
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm hover:opacity-90 transition-all"
            style={{ background: '#FF5A1F' }}>
            <Download size={14} />
            PDF
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Ventas totales', value: fmt(totalRevenue), icon: <DollarSign size={18} />, color: ORANGE },
          { label: 'Transacciones', value: `${filtered.length}`, icon: <Receipt size={18} />, color: '#3B82F6' },
          { label: 'Ticket promedio', value: fmt(avgTicket), icon: <TrendingUp size={18} />, color: '#10B981' },
          { label: 'Descuentos', value: fmt(totalDiscount), icon: <TrendingDown size={18} />, color: '#F59E0B' },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: kpi.color + '15' }}>
              <span style={{ color: kpi.color }}>{kpi.icon}</span>
            </div>
            <p className="text-gray-400 text-xs">{kpi.label}</p>
            <p className="text-gray-900 font-bold mt-0.5" style={{ fontSize: '22px' }}>{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Sales chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-gray-900">Ventas diarias</h3>
            <p className="text-gray-400 text-xs mt-0.5">{filtered.length} transacciones en el período</p>
          </div>
        </div>
        {dailyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="dia" axisLine={false} tickLine={false} style={{ fontSize: '11px', fill: '#9CA3AF' }} />
              <YAxis axisLine={false} tickLine={false} style={{ fontSize: '11px', fill: '#9CA3AF' }} tickFormatter={v => `C$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v: number, name: string) => [name === 'ventas' ? fmt(v) : v, name === 'ventas' ? 'Ventas' : 'Órdenes']}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="ventas" stroke={ORANGE} strokeWidth={2.5} dot={false} name="Ventas" />
              <Line type="monotone" dataKey="ordenes" stroke="#3B82F6" strokeWidth={2} dot={false} name="Órdenes" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
            No hay datos para el período seleccionado
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By payment method */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
        >
          <h3 className="text-gray-900 mb-4">Por método de pago</h3>
          {byMethod.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={byMethod} layout="vertical" barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} style={{ fontSize: '11px', fill: '#9CA3AF' }} tickFormatter={v => `C$${(v / 1000).toFixed(0)}k`} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} style={{ fontSize: '12px', fill: '#6B7280' }} width={90} />
                <Tooltip formatter={(v: number) => [fmt(v), 'Total']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                <Bar dataKey="total" fill={ORANGE} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>}
        </motion.div>

        {/* By cashier */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
        >
          <h3 className="text-gray-900 mb-4">Por cajero</h3>
          <div className="space-y-3">
            {byCashier.map((c, i) => {
              const max = byCashier[0]?.total ?? 1;
              return (
                <div key={c.name}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-gray-700 text-sm">{c.name}</span>
                    <span className="text-gray-500 text-xs">{c.count} ventas · {fmt(c.total)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(c.total / max) * 100}%` }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
                      className="h-full rounded-full"
                      style={{ background: ORANGE }}
                    />
                  </div>
                </div>
              );
            })}
            {byCashier.length === 0 && <p className="text-gray-400 text-sm text-center py-8">Sin datos</p>}
          </div>
        </motion.div>
      </div>

      {/* Recent sales table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-gray-900">Historial de ventas</h3>
          <p className="text-gray-400 text-xs mt-0.5">{filtered.length} transacciones</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                {['#', 'Fecha', 'Mesa', 'Cajero', 'Total', 'Método', 'Estado'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs text-gray-400 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 20).map(s => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3 text-gray-500 text-sm">#{s.number}</td>
                  <td className="px-5 py-3 text-gray-600 text-sm">{s.date}</td>
                  <td className="px-5 py-3 text-gray-700 text-sm">{s.tableName}</td>
                  <td className="px-5 py-3 text-gray-600 text-sm">{s.cashierName}</td>
                  <td className="px-5 py-3 text-gray-900 text-sm font-medium">{fmt(s.total - s.discount)}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
                      {{ cash: 'Efectivo', transfer: 'Transferencia', card: 'Tarjeta', mixed: 'Mixto' }[s.paymentMethod]}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full ${s.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                      {s.status === 'completed' ? 'Completada' : 'Anulada'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
