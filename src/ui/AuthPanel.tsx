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
import { dockOwnerAccount, findAdminAccount, getOwnerSession, isFamilyDevice, signInOwner, loginWithPasscode } from '~/lib/owner'
import { hasCompletedTutorial } from '~/lib/tutorial'

type OAuthId = Exclude<AuthProviderId, 'email'>
const OAUTH: OAuthId[] = ['google', 'apple', 'azure']

export function AuthPanel({ heading = 'Docking Bay' }: { heading?: string }) {
  const nav = useNavigate()
  // One-tap docking only appears on devices that already passcode-authenticated once.
  const familyDock = isFamilyDevice()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [remember, setRemember] = useState(getRememberMe)
  const last = getLastProvider()
  const [showAllOAuth, setShowAllOAuth] = useState(false)

  const finish = () => {
    const owner = getOwnerSession()
    if (owner?.role !== 'co-admin') mergeGuestIntoUser()
    setSuccess('Docking authorized! Welcome aboard.')
    setTimeout(() => {
      if (owner?.role === 'co-admin' && !hasCompletedTutorial()) {
        nav({
          to: '/play/$levelId',
          params: { levelId: 'tutorial' },
          search: { challenge: undefined, seed: undefined },
        })
        return
      }
      nav({ to: '/profile' })
    }, 600)
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

  const dockOwner = (targetEmail: string) => {
    setEmail(targetEmail)
    setError(null)
    const res = dockOwnerAccount(targetEmail)
    if (res.error) {
      setError(res.error)
      return
    }
    setLastProvider('email')
    finish()
  }

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <div>
        <h1 className="display text-[28px] text-gold">{heading}</h1>
        <p className="text-[13px] text-white/70">
          Sign in to unlock all 330 campaign orbits, save your pilot progress, and claim daily supply crates.
        </p>
      </div>

      {familyDock ? (
      <div className="rounded-2xl border border-pink-500/30 bg-gradient-to-r from-pink-950/20 via-purple-950/20 to-void/40 p-3 space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-pink-300">✦ Quick Pilot Docking</p>
        <p className="text-[11px] text-white/50">Tap once — no password needed for Anaclara or Chris.</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => dockOwner('tartars_96_gauged@icloud.com')}
            className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-center text-[12px] font-bold transition-all ${
              email === 'tartars_96_gauged@icloud.com' || email === 'ana.rankin96@gmail.com'
                ? 'border-pink-400 bg-pink-500/20 text-pink-200 shadow-[0_0_15px_rgba(236,72,153,0.4)]'
                : 'border-pink-500/30 bg-pink-950/30 text-pink-300 hover:bg-pink-900/40'
            }`}
          >
            <img src="/luma-heart-128.png" alt="" className="h-5 w-5 object-contain" />
            <span>Anaclara 💖</span>
          </button>
          <button
            type="button"
            onClick={() => dockOwner('admnowner@advancedcreationstudio.com')}
            className={`flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-center text-[12px] font-bold transition-all ${
              email === 'admnowner@advancedcreationstudio.com'
                ? 'border-gold bg-gold/20 text-gold shadow-[0_0_15px_#ffd24a55]'
                : 'border-gold/30 bg-black/40 text-gold hover:bg-gold/10'
            }`}
          >
            <img src="/luma-star-128.png" alt="" className="h-5 w-5 object-contain" />
            <span>Chris ⚡</span>
          </button>
        </div>
      </div>
      ) : null}

      {/* Primary Email & Password Form */}
      <div className="rounded-2xl border border-white/15 bg-white/5 p-4 shadow-lg">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            void run(async () => {
              const fd = new FormData(e.currentTarget)
              const submittedEmail = String(fd.get('email') ?? email)
              const submittedPassword = String(fd.get('password') ?? password)
              const ownerRes = signInOwner(submittedEmail, submittedPassword)
              if (!ownerRes.error) {
                setLastProvider('email')
                finish()
                return
              }
              if (findAdminAccount(submittedEmail)) {
                throw new Error(ownerRes.error ?? 'Invalid email or password.')
              }
              const sb = createBrowserSupabase()
              if (!sb) {
                throw new Error(ownerRes.error ?? 'Invalid email or password.')
              }
              setLastProvider('email')
              if (mode === 'up') {
                const { error: err } = await sb.auth.signUp({ email: submittedEmail, password: submittedPassword })
                if (err) throw err
              } else {
                const { error: err } = await sb.auth.signInWithPassword({ email: submittedEmail, password: submittedPassword })
                if (err) throw err
              }
              finish()
            })
          }}
        >
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-1">
              Pilot Email
            </label>
            <input
              className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-[15px] text-white placeholder-white/30 focus:border-gold focus:outline-none"
              placeholder="ana.rankin96@gmail.com"
              type="email"
              name="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-1">
              Password
            </label>
            <input
              className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-[15px] text-white placeholder-white/30 focus:border-gold focus:outline-none"
              placeholder="Enter your pilot password"
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-[12px] text-white/70 cursor-pointer">
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
            <button
              type="button"
              className="text-[12px] text-white/50 hover:text-white"
              onClick={() => setMode(mode === 'in' ? 'up' : 'in')}
            >
              {mode === 'in' ? 'Need an account?' : 'Have an account?'}
            </button>
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-gradient-to-r from-magenta via-purple-600 to-magenta py-3 text-[14px] font-bold text-white shadow-[0_0_20px_#ff2bd644] active:scale-98 transition-transform"
          >
            {mode === 'in' ? 'Dock Into Orbit' : 'Create Pilot Account'}
          </button>
        </form>

        {error && (
          <div className="mt-3 rounded-xl border border-red-500/30 bg-red-950/40 p-2.5 text-center text-[12px] text-red-200">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-2.5 text-center text-[12px] text-emerald-200">
            ✅ {success}
          </div>
        )}
      </div>

      {familyDock ? (
      <details className="rounded-2xl border border-gold/20 bg-black/30 p-3">
        <summary className="cursor-pointer text-[12px] font-semibold text-gold">
          ⚡ 1-Step Passcode Dock
        </summary>
        <form
          className="mt-3 space-y-2"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            const code = String(fd.get('code') ?? '')
            const res = loginWithPasscode(code)
            if (res.error) setError(res.error)
            else finish()
          }}
        >
          <p className="text-[11px] text-white/50">
            Enter your secret admin/co-admin passcode directly to dock without entering an email.
          </p>
          <input
            name="code"
            type="password"
            className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-[14px] text-white placeholder-white/30"
            placeholder="Passcode"
            required
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-gold py-2 text-[13px] font-bold text-void active:scale-98 transition-transform"
          >
            Authenticate Passcode
          </button>
        </form>
      </details>
      ) : null}

      {/* Social Logins (Google / Apple / Microsoft) */}
      <details className="rounded-2xl border border-white/10 bg-black/20 p-3">
        <summary className="cursor-pointer text-[12px] text-white/50">
          OAuth Social Logins (Google, Apple, Microsoft)
        </summary>
        <div className="mt-3 space-y-2">
          {OAUTH.map((p) => (
            <button
              key={p}
              type="button"
              className="w-full rounded-xl border border-white/15 bg-white/5 py-2 text-[12px] text-white/80 hover:bg-white/10"
              onClick={() => oauth(p)}
            >
              Sign in with {providerLabel(p)}
            </button>
          ))}
        </div>
      </details>
    </div>
  )
}
