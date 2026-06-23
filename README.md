# POS Restaurant

Sistema POS para restaurantes con React, Vite, Tailwind y Supabase.

## Requisitos

- Node.js 18+
- Proyecto en [Supabase](https://supabase.com) con las migraciones de `supabase/migrations/` aplicadas

## Configuración local

1. Instala dependencias:

```bash
npm install
```

2. Crea tu archivo de entorno ( **no se sube a GitHub** ):

```bash
cp .env.example .env
```

3. Completa `.env` con tus valores de Supabase:

| Variable | Dónde obtenerla |
|----------|-----------------|
| `VITE_SUPABASE_URL` | Supabase → **Settings** → **API** → **Project URL** |
| `VITE_SUPABASE_ANON_KEY` | Supabase → **Settings** → **API** → **anon public** |
| `VITE_RESTAURANT_ID` | Supabase → **Table Editor** → `restaurants` → columna `id` |

4. Inicia el servidor:

```bash
npm run dev
```

## Despliegue (Vercel, Netlify, Cloudflare Pages, etc.)

**No subas `.env` al repositorio.** Eso es buena práctica: las credenciales van en el panel del hosting.

1. Conecta el repo [POS-RESTAURANT](https://github.com/BehindTheMafia/POS-RESTAURANT) a tu plataforma.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Agrega estas **Environment Variables** (las mismas 3 del `.env.example`):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_RESTAURANT_ID`
5. **Redeploy** después de guardar las variables (Vite las embebe en build time).

Si faltan variables, verás una pantalla de aviso en lugar de una página en blanco.

### ¿Por qué la clave `anon` puede ir en el frontend?

La clave **anon** es pública por diseño. La seguridad real está en **Row Level Security (RLS)** en PostgreSQL. Nunca uses la clave **service_role** en el frontend ni la subas a GitHub.

## Base de datos

Aplica las migraciones SQL en tu proyecto Supabase (SQL Editor o CLI):

```bash
supabase db push
```

O ejecuta manualmente los archivos en `supabase/migrations/` en orden.

## Scripts

- `npm run dev` — desarrollo
- `npm run build` — build de producción
- `npm run preview` — preview del build local
