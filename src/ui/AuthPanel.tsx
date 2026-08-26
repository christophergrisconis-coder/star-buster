import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { createBrowserSupabase, supabaseConfigured } from '~/lib/supabase/client'
import {
  getLastProvider,
  getRememberMe,
  providerLabel,
  setLastProvider,
  setRememberMe,
  type AuthProviderId,
} from '~/lib/authPrefs'
import { mergeGuestIntoUser } from '~/lib/progress'
import { signInOwner } from '~/lib/owner'

type OAuthId = Exclude<AuthProviderId, 'email'>
const OAUTH: OAuthId[] = ['google', 'apple', 'azure']

export function AuthPanel({ heading = 'Docking Bay' }: { heading?: string }) {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [remember, setRemember] = useState(getRememberMe)
  const last = getLastProvider()
  const [showAll, setShowAll] = useState(!last)

  const finish = () => {
    mergeGuestIntoUser()
    nav({ to: '/profile' })
  }

  const run = async (fn: () => Promise<void>) => {
    setError(null)
    setRememberMe(remember)
    try {
      await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Auth failed')
    }
  }

  const oauth = (provider: OAuthId) =>
    void run(async () => {
      const sb = createBrowserSupabase()
      if (!sb) throw new Error('Supabase env vars are missing.')
      setLastProvider(provider)
      const { error: err } = await sb.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${import.meta.env.VITE_SITE_URL ?? window.location.origin}/profile` },
      })
      if (err) throw err
    })

  const primary = last && last !== 'email' ? last : null
  const others = OAUTH.filter((p) => p !== primary)

  return (
    <div className="space-y-4">
      <h1 className="display text-[28px] text-gold">{heading}</h1>
      <p className="text-[13px] text-white/70">
        Guests may fly levels 1–3. Sign in to merge that progress and open the full 250-level lock.
      </p>
      {!supabaseConfigured() ? (
        <p className="rounded-xl border border-gold/30 bg-black/30 p-3 text-[12px] text-gold/90">
          Cloud docking is offline. Add Supabase keys to enable Google, Apple, and Microsoft sign-in.
        </p>
      ) : null}

      {primary ? (
        <button
          type="button"
          className="w-full rounded-full bg-magenta py-3 font-semibold"
          onClick={() => oauth(primary)}
        >
          Continue with {providerLabel(primary)}
        </button>
      ) : (
        <div className="space-y-2">
          {OAUTH.map((p) => (
            <button
              key={p}
              type="button"
              className="w-full rounded-full border border-gold/40 py-3 text-gold"
              onClick={() => oauth(p)}
            >
              Sign in with {providerLabel(p)}
            </button>
          ))}
        </div>
      )}

      {primary && (showAll || others.length) ? (
        showAll ? (
          <div className="space-y-2">
            {others.map((p) => (
              <button
                key={p}
                type="button"
                className="w-full rounded-full border border-white/20 py-2.5 text-[13px] text-white/80"
                onClick={() => oauth(p)}
              >
                Sign in with {providerLabel(p)}
              </button>
            ))}
          </div>
        ) : (
          <button type="button" className="w-full text-[12px] text-white/50" onClick={() => setShowAll(true)}>
            Other docking methods
          </button>
        )
      ) : null}

      <label className="flex items-center gap-2 text-[13px] text-white/80">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => {
            setRemember(e.target.checked)
            setRememberMe(e.target.checked)
          }}
        />
        Remember me
      </label>
      <p className="text-[11px] text-white/45">
        Unchecked keeps the session in this tab only — it will not survive a browser restart.
      </p>

      <details className="rounded-xl border border-white/10 bg-black/20 p-3">
        <summary className="cursor-pointer text-[12px] text-white/60">Email / password</summary>
        <form
          className="mt-3 space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            void run(async () => {
              const ownerRes = signInOwner(email, password)
              if (!ownerRes.error) {
                setLastProvider('email')
                finish()
                return
              }
              const sb = createBrowserSupabase()
              if (!sb) {
                throw new Error(ownerRes.error ?? 'Invalid email or password.')
              }
              setLastProvider('email')
              if (mode === 'up') {
                const { error: err } = await sb.auth.signUp({ email, password })
                if (err) throw err
              } else {
                const { error: err } = await sb.auth.signInWithPassword({ email, password })
                if (err) throw err
              }
              finish()
            })
          }}
        >
          <input
            className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-3 text-[16px]"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-3 text-[16px]"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="w-full rounded-full bg-white/15 py-3 text-[13px] font-semibold">
            {mode === 'in' ? 'Sign in with email' : 'Create pilot'}
          </button>
          <button type="button" className="w-full text-[12px] text-white/50" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>
            {mode === 'in' ? 'Need an account?' : 'Have an account?'}
          </button>
        </form>
      </details>
      {error ? <p className="text-[12px] text-red-300">{error}</p> : null}
      <details className="rounded-xl border border-gold/20 bg-black/20 p-3">
        <summary className="cursor-pointer text-[12px] text-gold">Admin dock</summary>
        <form
          className="mt-3 space-y-2"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            const code = String(fd.get('code') ?? '')
            void import('~/lib/progress').then(({ loginAdminDock }) => {
              const res = loginAdminDock(code)
              if (res.error) setError(res.error)
              else finish()
            })
          }}
        >
          <p className="text-[12px] text-white/55">Local admin code. Cloud admins use a signed-in profile flag.</p>
          <input name="code" type="password" className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-[14px]" placeholder="Dock code" />
          <button type="submit" className="w-full rounded-full bg-gold py-2 text-[13px] font-semibold text-void">
            Open admin
          </button>
        </form>
      </details>
    </div>
  )
}
