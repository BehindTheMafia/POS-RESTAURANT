import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Users, Clock, Plus, RefreshCw, LayoutGrid } from 'lucide-react';
import { useStore } from '../store';
import type { Order } from '../types';

function elapsed(openedAt?: string) {
  if (!openedAt) return '';
  const diff = Math.floor((Date.now() - new Date(openedAt).getTime()) / 60000);
  if (diff < 60) return `${diff}m`;
  return `${Math.floor(diff / 60)}h ${diff % 60}m`;
}

export function Tables() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();

  function handleTableClick(tableId: string) {
    const table = state.tables.find(t => t.id === tableId)!;
    if (table.status === 'occupied' && table.currentOrderId) {
      dispatch({ type: 'SET_CURRENT_ORDER', orderId: table.currentOrderId });
      navigate(`/pos/${tableId}`);
    } else {
      // Open new order
      const orderNumber = state.orders.length + state.sales.length + 1;
      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        number: orderNumber,
        tableId,
        tableName: table.name,
        waiterId: state.currentUser!.id,
        waiterName: state.currentUser!.name,
        status: 'open',
        items: [],
        total: 0,
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: 'OPEN_TABLE', tableId, order: newOrder });
      navigate(`/pos/${tableId}`);
    }
  }

  const free = state.tables.filter(t => t.status === 'free').length;
  const occupied = state.tables.filter(t => t.status === 'occupied').length;

  return (
    <div className="p-6">
      {/* Stats bar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="text-gray-700 text-sm">{free} mesas libres</span>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
          <span className="text-gray-700 text-sm">{occupied} mesas ocupadas</span>
        </div>
        <div className="ml-auto">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-white border border-transparent hover:border-gray-100 transition-all text-sm"
          >
            <RefreshCw size={14} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Table grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
        {state.tables.map((table, i) => {
          const isOccupied = table.status === 'occupied';
          const time = elapsed(table.openedAt);
          return (
            <motion.button
              key={table.id}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleTableClick(table.id)}
              className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 aspect-square transition-shadow cursor-pointer ${
                isOccupied
                  ? 'bg-orange-50 border-orange-200 shadow-md'
                  : 'bg-white border-gray-100 hover:border-green-200 hover:shadow-sm'
              }`}
            >
              {/* Status dot */}
              <span className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${isOccupied ? 'bg-orange-400 animate-pulse' : 'bg-green-400'}`} />

              {/* Table icon */}
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-2 ${isOccupied ? 'bg-orange-100' : 'bg-gray-50'}`}>
                <LayoutGrid size={28} className={isOccupied ? 'text-orange-400' : 'text-gray-300'} />
              </div>

              <p className={`font-semibold text-sm ${isOccupied ? 'text-orange-700' : 'text-gray-700'}`}>
                Mesa {table.number}
              </p>

              <div className={`flex items-center gap-1 mt-1 text-xs ${isOccupied ? 'text-orange-500' : 'text-gray-400'}`}>
                <Users size={10} />
                {table.capacity} pers.
              </div>

              {isOccupied && time && (
                <div className="flex items-center gap-1 mt-1 text-xs text-orange-500 bg-orange-100 px-2 py-0.5 rounded-full">
                  <Clock size={9} />
                  {time}
                </div>
              )}

              {!isOccupied && (
                <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
                  <Plus size={10} />
                  Abrir
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
