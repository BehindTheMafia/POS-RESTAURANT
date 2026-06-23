import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const restaurantId = import.meta.env.VITE_RESTAURANT_ID as string | undefined;

/** True when all required env vars are present (local .env or hosting panel). */
export const isSupabaseConfigured = Boolean(
  supabaseUrl?.trim() && supabaseAnonKey?.trim() && restaurantId?.trim()
);

export const supabase = createClient<Database>(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

// Restaurant ID fijo (multitenant ready: en el futuro se puede leer del JWT claim)
export const RESTAURANT_ID = restaurantId ?? '';

export type SupabaseClient = typeof supabase;
