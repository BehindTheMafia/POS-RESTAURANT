import { AlertTriangle } from 'lucide-react'

const REQUIRED_VARS = [
  { key: 'VITE_SUPABASE_URL', hint: 'Supabase → Settings → API → Project URL' },
  { key: 'VITE_SUPABASE_ANON_KEY', hint: 'Supabase → Settings → API → anon public' },
  { key: 'VITE_RESTAURANT_ID', hint: 'UUID de tu fila en la tabla restaurants' },
] as const

export const ConfigError = () => (
  <div className="min-h-dvh flex items-center justify-center bg-gray-50 p-6">
    <div className="max-w-lg w-full bg-white rounded-3xl border border-gray-200 shadow-xl p-8">
      <div className="w-14 h-14 rounded-2xl bg-warning-muted flex items-center justify-center mb-5">
        <AlertTriangle size={28} className="text-warning" />
      </div>
      <h1 className="text-xl font-black text-gray-900 mb-2">
        Falta configurar Supabase
      </h1>
      <p className="text-sm text-gray-500 leading-relaxed mb-6">
        La app no puede conectarse a la base de datos porque faltan variables de entorno.
        Esto es normal en un deploy nuevo: las credenciales no van en GitHub, se configuran
        en el hosting o en un archivo <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">.env</code> local.
      </p>

      <div className="space-y-3 mb-6">
        {REQUIRED_VARS.map(({ key, hint }) => (
          <div key={key} className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
            <p className="text-xs font-black text-gray-800 font-mono">{key}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{hint}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-brand-muted border border-brand/20 px-4 py-3 text-sm text-gray-700 space-y-2">
        <p className="font-bold text-brand">Local</p>
        <p className="text-xs leading-relaxed">
          Copia <code className="bg-white/80 px-1 rounded">.env.example</code> a{' '}
          <code className="bg-white/80 px-1 rounded">.env</code>, completa los valores y ejecuta{' '}
          <code className="bg-white/80 px-1 rounded">npm run dev</code>.
        </p>
        <p className="font-bold text-brand pt-1">Producción (Vercel / Netlify / similar)</p>
        <p className="text-xs leading-relaxed">
          Agrega las 3 variables en Environment Variables del panel y vuelve a desplegar.
        </p>
      </div>
    </div>
  </div>
)
