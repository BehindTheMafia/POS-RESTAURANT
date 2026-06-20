import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Flame, Eye, EyeOff, Shield, CreditCard, User, Drumstick } from 'lucide-react';
import { useStore } from '../store';

const DEMO_ACCOUNTS = [
  { username: 'admin', password: '1234', label: 'Administrador', icon: <Shield size={14} />, color: '#FF5A1F' },
  { username: 'cajero1', password: '1234', label: 'Cajero', icon: <CreditCard size={14} />, color: '#3B82F6' },
  { username: 'mesero1', password: '1234', label: 'Mesero', icon: <User size={14} />, color: '#10B981' },
];

export function Login() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (state.isAuthenticated) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  function fill(u: string, p: string) {
    setUsername(u);
    setPassword(p);
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    const user = state.users.find(u => u.username === username && u.status === 'active');
    if (user && password === '1234') {
      dispatch({ type: 'LOGIN', user });
      navigate(user.role === 'waiter' ? '/pos' : user.role === 'cashier' ? '/pos' : '/dashboard');
    } else {
      setError('Usuario o contraseña incorrectos.');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-[52%] relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0F0F1A 0%, #1A1A2E 60%, #16213E 100%)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 80%, #FF5A1F 0%, transparent 50%), radial-gradient(circle at 80% 20%, #FF8C42 0%, transparent 50%)'
          }} />

        {/* Pattern dots */}
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '32px 32px'
          }} />

        <div className="relative z-10 flex flex-col h-full p-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#FF5A1F' }}>
              <Flame size={20} color="white" />
            </div>
            <span className="text-white text-xl font-bold">Prime Wings</span>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6" style={{ background: 'rgba(255,90,31,0.15)' }}>
                <Drumstick size={40} style={{ color: '#FF5A1F' }} />
              </div>
              <h2 className="text-white mb-4" style={{ fontSize: '36px', fontWeight: 700, lineHeight: 1.2 }}>
                El sabor que<br />
                <span style={{ color: '#FF5A1F' }}>todos buscan.</span>
              </h2>
              <p className="text-white/50 text-lg leading-relaxed max-w-md">
                Sistema integral de gestión para tu restaurante. Control total de ventas, inventario y finanzas en tiempo real.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-12 grid grid-cols-3 gap-4"
            >
              {[
                { label: 'Ventas hoy', value: 'C$8,450' },
                { label: 'Órdenes', value: '34' },
                { label: 'Ticket prom.', value: 'C$248' },
              ].map(stat => (
                <div key={stat.label} className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
                  <p className="text-white/50 text-xs">{stat.label}</p>
                  <p className="text-white font-bold text-xl mt-1">{stat.value}</p>
                </div>
              ))}
            </motion.div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: '#FF5A1F' }} />
            <p className="text-white/30 text-xs">Prime Wings POS v1.0 • Managua, Nicaragua</p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#FF5A1F' }}>
              <Flame size={18} color="white" />
            </div>
            <span className="text-gray-900 text-xl font-bold">Prime Wings</span>
          </div>

          <h2 className="text-gray-900 mb-1">Iniciar sesión</h2>
          <p className="text-gray-500 text-sm mb-8">Accede con tus credenciales de usuario</p>

          {/* Quick demo buttons */}
          <div className="mb-6">
            <p className="text-xs text-gray-400 mb-2">Acceso rápido (demo)</p>
            <div className="flex gap-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.username}
                  onClick={() => fill(acc.username, acc.password)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs transition-all hover:scale-105"
                  style={{
                    borderColor: acc.color + '40',
                    background: acc.color + '08',
                    color: acc.color,
                  }}
                >
                  {acc.icon}
                  {acc.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-gray-700 text-sm block mb-1.5">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(''); }}
                placeholder="Ingresa tu usuario"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm outline-none focus:border-[#FF5A1F] focus:bg-white transition-all"
                required
              />
            </div>
            <div>
              <label className="text-gray-700 text-sm block mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm outline-none focus:border-[#FF5A1F] focus:bg-white transition-all pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
              style={{ background: '#FF5A1F' }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verificando...
                </>
              ) : 'Ingresar'}
            </button>
          </form>

          <p className="text-center text-gray-400 text-xs mt-8">
            Contraseña demo: <span className="font-mono bg-gray-100 px-1 rounded">1234</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
