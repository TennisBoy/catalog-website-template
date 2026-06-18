import { useState } from 'react'
import { useCatalog } from '../store/useCatalog'
import './SignIn.css'

/** Teacher sign-in modal. Only the account holder can edit the catalog. */
export function SignIn({ onClose }: { onClose: () => void }) {
  const { signIn } = useCatalog()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await signIn(email.trim(), password)
    setBusy(false)
    if (error) setError(error)
    else onClose()
  }

  return (
    <>
      <div className="signin__scrim" onClick={onClose} />
      <div className="signin card" role="dialog" aria-label="Teacher sign in" aria-modal="true">
        <h2 className="signin__title">Teacher sign in</h2>
        <p className="muted signin__sub">Only the department’s account can add or edit items.</p>
        <form onSubmit={submit}>
          <label className="field-label" htmlFor="si-email">
            Email
          </label>
          <input
            id="si-email"
            className="input"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            required
          />
          <label className="field-label signin__gap" htmlFor="si-pw">
            Password
          </label>
          <input
            id="si-pw"
            className="input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="signin__error">{error}</p>}
          <div className="signin__actions">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
