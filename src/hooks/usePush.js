import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

// Converte la chiave VAPID nel formato richiesto dal browser
function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

/**
 * Gestisce l'iscrizione alle notifiche push di QUESTO dispositivo.
 * Ogni dispositivo (il tuo telefono, il suo, il PC...) si iscrive
 * separatamente toccando la campanella.
 */
export function usePush(session) {
  const supported =
    !!PUBLIC_KEY &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window

  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)

  // All'avvio controlla se questo dispositivo è già iscritto
  useEffect(() => {
    if (!supported || !session) return
    navigator.serviceWorker.ready
      .then(reg => reg.pushManager.getSubscription())
      .then(sub => setEnabled(!!sub))
      .catch(() => {})
  }, [supported, session])

  async function enable() {
    setBusy(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY)
      })
      await supabase.from('push_subscriptions').insert({
        profile_id: session.user.id,
        subscription: sub.toJSON()
      })
      setEnabled(true)
    } finally {
      setBusy(false)
    }
  }

  async function disable() {
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('profile_id', session.user.id)
          .contains('subscription', { endpoint: sub.endpoint })
        await sub.unsubscribe()
      }
      setEnabled(false)
    } finally {
      setBusy(false)
    }
  }

  return { supported, enabled, busy, toggle: enabled ? disable : enable }
}
