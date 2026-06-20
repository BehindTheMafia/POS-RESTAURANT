import { useState } from 'react';
import { motion } from 'motion/react';
import { Save, Building2, Printer, Banknote, CreditCard } from 'lucide-react';
import { useStore, addAuditLog } from '../store';

const BANKS_LIST = ['BAC', 'Lafise', 'Banpro', 'Ficohsa', 'Banco Avanz', 'BDF'];

export function Settings() {
  const { state, dispatch } = useStore();
  const [tab, setTab] = useState<'restaurant' | 'payments' | 'ticket' | 'banks'>('restaurant');
  const [form, setForm] = useState({ ...state.restaurant });
  const [saved, setSaved] = useState(false);
  const [enabledBanks, setEnabledBanks] = useState(BANKS_LIST.slice(0, 4));
  const [payMethods, setPayMethods] = useState({
    cash: true, transfer: true, card: true, mixed: true,
  });

  function save() {
    dispatch({ type: 'UPDATE_RESTAURANT', restaurant: form });
    addAuditLog(dispatch, state.currentUser!.id, state.currentUser!.name,
      'Configuración Actualizada', 'Restaurante', {
        newValue: `${form.commercialName} | Moneda: ${form.currency}`
      }
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const tabs = [
    { key: 'restaurant', label: 'Restaurante', icon: <Building2 size={14} /> },
    { key: 'payments', label: 'Métodos de Pago', icon: <CreditCard size={14} /> },
    { key: 'banks', label: 'Bancos', icon: <Banknote size={14} /> },
    { key: 'ticket', label: 'Ticket', icon: <Printer size={14} /> },
  ];

  return (
    <div className="p-6 space-y-5">
      {/* Tab navigation */}
      <div className="flex gap-2 bg-white border border-gray-200 rounded-2xl p-1.5">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all flex-1 justify-center ${tab === t.key ? 'text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
            style={tab === t.key ? { background: '#FF5A1F' } : undefined}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {tab === 'restaurant' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-5">
          <h3 className="text-gray-900">Información del restaurante</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { label: 'Nombre legal', key: 'name', placeholder: 'Prime Wings S.A.' },
              { label: 'Nombre comercial', key: 'commercialName', placeholder: 'Prime Wings' },
              { label: 'Dirección', key: 'address', placeholder: 'Dirección completa' },
              { label: 'Teléfono', key: 'phone', placeholder: '+505 0000-0000' },
              { label: 'RUC', key: 'ruc', placeholder: 'J031000000000' },
              { label: 'Moneda', key: 'currency', placeholder: 'C$' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-gray-600 text-sm block mb-1.5">{f.label}</label>
                <input
                  value={(form as any)[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#FF5A1F] transition-colors"
                />
              </div>
            ))}
            <div>
              <label className="text-gray-600 text-sm block mb-1.5">Tipo de cambio (C$ por $)</label>
              <input
                type="number"
                value={form.exchangeRate}
                onChange={e => setForm(prev => ({ ...prev, exchangeRate: parseFloat(e.target.value) }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#FF5A1F]"
              />
            </div>
            <div>
              <label className="text-gray-600 text-sm block mb-1.5">IVA (%)</label>
              <input
                type="number"
                value={form.igv}
                onChange={e => setForm(prev => ({ ...prev, igv: parseFloat(e.target.value) }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#FF5A1F]"
              />
            </div>
          </div>
        </motion.div>
      )}

      {tab === 'payments' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-gray-900">Métodos de pago habilitados</h3>
          <p className="text-gray-500 text-sm">Configura qué métodos de pago están disponibles en el POS.</p>
          <div className="space-y-3">
            {[
              { key: 'cash', label: 'Efectivo', desc: 'Pago en billetes y monedas' },
              { key: 'transfer', label: 'Transferencia bancaria', desc: 'Pago via app bancaria o SWIFT' },
              { key: 'card', label: 'Tarjeta', desc: 'Débito o crédito POS físico' },
              { key: 'mixed', label: 'Pago Mixto', desc: 'Combinación de métodos' },
            ].map(m => (
              <div key={m.key} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-gray-800 font-medium text-sm">{m.label}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{m.desc}</p>
                </div>
                <button
                  onClick={() => setPayMethods(p => ({ ...p, [m.key]: !p[m.key as keyof typeof p] }))}
                  className={`w-12 h-6 rounded-full transition-all relative ${payMethods[m.key as keyof typeof payMethods] ? 'bg-[#FF5A1F]' : 'bg-gray-200'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${payMethods[m.key as keyof typeof payMethods] ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {tab === 'banks' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-gray-900">Bancos configurados</h3>
          <p className="text-gray-500 text-sm">Selecciona los bancos aceptados para transferencias y tarjetas.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {BANKS_LIST.map(bank => {
              const enabled = enabledBanks.includes(bank);
              return (
                <button key={bank}
                  onClick={() => setEnabledBanks(bs => bs.includes(bank) ? bs.filter(b => b !== bank) : [...bs, bank])}
                  className={`px-4 py-3 rounded-xl border-2 text-sm transition-all ${enabled ? 'text-white border-[#FF5A1F]' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  style={enabled ? { background: '#FF5A1F' } : undefined}>
                  {bank}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {tab === 'ticket' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-5">
          <h3 className="text-gray-900">Configuración del ticket</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-gray-600 text-sm block mb-1.5">Mensaje final del ticket</label>
                <textarea
                  value={form.ticketMessage}
                  onChange={e => setForm(prev => ({ ...prev, ticketMessage: e.target.value }))}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#FF5A1F] resize-none"
                />
              </div>
              <div>
                <label className="text-gray-600 text-sm block mb-1.5">Ancho de impresora</label>
                <div className="flex gap-2">
                  {['58mm', '80mm', 'Personalizado'].map(w => (
                    <button key={w} className="flex-1 py-2 rounded-xl text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Ticket preview */}
            <div className="bg-gray-50 rounded-xl p-4 border border-dashed border-gray-200">
              <p className="text-gray-400 text-xs mb-3 text-center">Vista previa</p>
              <div className="bg-white rounded-lg p-3 shadow-sm font-mono text-xs space-y-1 text-center">
                <p className="font-bold text-sm">{form.commercialName}</p>
                <p className="text-gray-500">{form.address}</p>
                <p className="text-gray-500">RUC: {form.ruc}</p>
                <p className="text-gray-500">Tel: {form.phone}</p>
                <div className="border-t border-dashed border-gray-200 my-2" />
                <p className="text-gray-700">Mesa: 3 | Cajero: Ana L.</p>
                <p className="text-gray-500">20/06/2024 · 14:32</p>
                <div className="border-t border-dashed border-gray-200 my-2" />
                <div className="text-left space-y-0.5">
                  <div className="flex justify-between"><span>Wings 10 x1</span><span>C$280</span></div>
                  <div className="flex justify-between"><span>Coca Cola x2</span><span>C$100</span></div>
                </div>
                <div className="border-t border-dashed border-gray-200 my-2" />
                <div className="flex justify-between font-bold"><span>TOTAL</span><span>C$380</span></div>
                <p className="text-gray-500 mt-2">{form.ticketMessage}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Save button */}
      <div className="flex justify-end">
        <button onClick={save}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm transition-all hover:opacity-90 ${saved ? 'bg-green-500' : ''}`}
          style={!saved ? { background: '#FF5A1F' } : undefined}>
          <Save size={14} />
          {saved ? '¡Guardado!' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}
