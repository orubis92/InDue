import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.warn('Variabili VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY mancanti: crea il file .env (vedi .env.example)')
}

export const supabase = createClient(url, anonKey)
