import { useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Login con email e password. Non c'è registrazione dall'app:
 * i due account si creano una volta sola dal pannello Supabase
 * (vedi README), così nessun altro può entrare.
 */
export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Email o password non corretti.')
    setBusy(false)
  }

  return (
    <form className="auth-card" onSubmit={handleLogin}>
      <h2>InDue<span style={{ color: 'var(--accent)' }}>.</span></h2>
      <p>Le cose da fare, in due. Accedi per vedere le vostre liste.</p>
      <input
        type="email"
        placeholder="Email"
        value={email}
        autoComplete="email"
        onChange={e => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        autoComplete="current-password"
        onChange={e => setPassword(e.target.value)}
        required
      />
      {error && <p className="error-msg">{error}</p>}
      <button className="btn-primary" disabled={busy}>
        {busy ? 'Accesso…' : 'Entra'}
      </button>
    </form>
  )
}
