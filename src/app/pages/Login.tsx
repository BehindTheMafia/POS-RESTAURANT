import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Flame, Eye, EyeOff, Shield, CreditCard, User, Drumstick } from 'lucide-react';
import { useAuthContext } from '../AuthContext';
import { getDefaultRoute } from '../../lib/routing';
import { Button } from '../components/ui/button';
import { supabase } from '../../lib/supabase';

const isDev = import.meta.env.DEV;

const QUICK_ACCOUNTS = isDev ? [
  { email: 'admin@restaurant.com', password: 'Admin2024!', label: 'Administrador', icon: <Shield size={14} /> },
  { email: 'cajero@restaurant.com', password: 'Cajero2024!', label: 'Cajero', icon: <CreditCard size={14} /> },
  { email: 'mesero@restaurant.com', password: 'Mesero2024!', label: 'Mesero', icon: <User size={14} /> },
] : [];

export function Login() {
  const { user, loading: authLoading, signIn, error: authError } = useAuthContext();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      navigate(getDefaultRoute(user), { replace: true });
    }
  }, [user, authLoading, navigate]);

  const fillQuick = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const ok = await signIn(email, password);
    if (!ok) {
      setError(authError ?? 'Correo o contraseña incorrectos.');
    }
    setLoading(false);
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setError('Ingrese su correo para recuperar la contraseña.');
      return;
    }
    setLoading(true);
    setError('');
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setLoading(false);
    if (resetErr) {
      setError(resetErr.message);
      return;
    }
    setResetSent(true);
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-sidebar">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Hero panel */}
      <div className="hidden lg:flex flex-col w-[52%] relative overflow-hidden bg-sidebar">
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 80%, var(--brand) 0%, transparent 50%), radial-gradient(circle at 80% 20%, var(--brand-muted) 0%, transparent 50%)'
          }} />
        <div className="relative z-10 flex flex-col h-full p-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center">
              <Flame size={20} className="text-brand-foreground" />
            </div>
            <span className="text-sidebar-foreground text-xl font-bold">POS Restaurant</span>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <div className="w-20 h-20 rounded-3xl bg-brand/15 flex items-center justify-center mb-6">
                <Drumstick size={40} className="text-brand" />
              </div>
              <h2 className="text-sidebar-foreground mb-4" style={{ fontSize: '36px', fontWeight: 700, lineHeight: 1.2 }}>
                El sabor que<br /><span className="text-brand">todos buscan.</span>
              </h2>
              <p className="text-sidebar-foreground/50 text-lg leading-relaxed max-w-md">
                Sistema integral de gestión para tu restaurante. Control total de ventas, inventario y finanzas en tiempo real.
              </p>
            </motion.div>
          </div>
          <p className="text-sidebar-foreground/30 text-xs">POS Restaurant v2.0</p>
        </div>
      </div>

      {/* Login panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center">
              <Flame size={18} className="text-brand-foreground" />
            </div>
            <span className="text-gray-900 text-xl font-bold">POS Restaurant</span>
          </div>

          <h2 className="text-gray-900 mb-1">{showForgot ? 'Recuperar contraseña' : 'Iniciar sesión'}</h2>
          <p className="text-gray-500 text-sm mb-8">
            {showForgot ? 'Le enviaremos un enlace a su correo' : 'Accede con tus credenciales de usuario'}
          </p>

          {isDev && QUICK_ACCOUNTS.length > 0 && !showForgot && (
            <div className="mb-6">
              <p className="text-xs text-gray-400 mb-2">Acceso rápido (solo desarrollo)</p>
              <div className="flex gap-2">
                {QUICK_ACCOUNTS.map(acc => (
                  <button key={acc.email} type="button" onClick={() => fillQuick(acc.email, acc.password)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-brand/30 bg-brand/5 text-brand text-xs transition-all hover:scale-105 cursor-pointer">
                    {acc.icon}{acc.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {resetSent ? (
            <div className="bg-success-muted border border-success-border text-success rounded-xl p-4 text-sm">
              Revise su correo para restablecer la contraseña.
              <button type="button" onClick={() => { setResetSent(false); setShowForgot(false); }}
                className="block mt-3 font-medium underline cursor-pointer">
                Volver al login
              </button>
            </div>
          ) : (
            <form onSubmit={showForgot ? handleForgotPassword : handleSubmit} className="space-y-4">
              <div>
                <label className="text-gray-700 text-sm block mb-1.5">Correo electrónico</label>
                <input id="login-email" type="email" value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="correo@restaurant.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm outline-none focus:border-brand focus:bg-white transition-all"
                  required autoComplete="email" />
              </div>
              {!showForgot && (
                <div>
                  <label className="text-gray-700 text-sm block mb-1.5">Contraseña</label>
                  <div className="relative">
                    <input id="login-password" type={showPass ? 'text' : 'password'} value={password}
                      onChange={e => { setPassword(e.target.value); setError(''); }}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm outline-none focus:border-brand focus:bg-white transition-all pr-10"
                      required autoComplete="current-password" />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="text-destructive text-sm bg-destructive-muted px-3 py-2 rounded-lg">{error}</motion.p>
              )}

              <Button id="login-submit" type="submit" size="touch" disabled={loading} className="w-full">
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Procesando...</>
                ) : showForgot ? 'Enviar enlace' : 'Ingresar'}
              </Button>

              <button type="button" onClick={() => { setShowForgot(!showForgot); setError(''); }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200 cursor-pointer min-h-11">
                {showForgot ? 'Volver al login' : '¿Olvidaste tu contraseña?'}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
