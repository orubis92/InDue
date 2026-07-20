import { supabase } from './supabase'

/** Carica una foto nel bucket "foto" e restituisce il percorso (o null). */
export async function uploadPhoto(file) {
  if (!file || file.size === 0) return null
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('foto').upload(path, file)
  return error ? null : path
}

/** URL pubblico di una foto caricata. */
export const photoUrl = path =>
  supabase.storage.from('foto').getPublicUrl(path).data.publicUrl
