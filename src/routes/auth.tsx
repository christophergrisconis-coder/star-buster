import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { createBrowserSupabase } from '~/lib/supabase/client'
import { mergeGuestIntoUser } from '~/lib/progress'

export const Route = createFileRoute('/auth')({
  component: AuthPage,
})

function AuthPage() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'in' | 'up'>('in')

  const run = async (fn: () => Promise<void>) => {
    setError(null)
    try {
      await fn()
      mergeGuestIntoUser()
      nav({ to: '/profile' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Auth failed')
    }
  }

  return (
    <div className="space-y-4 px-4 pt-6">
      <h1 className="display text-[28px] text-gold">Docking Bay</h1>
      <p className="text-[13px] text-white/70">
        Guests may fly levels 1–3. Sign in to merge progress and climb the board.
      </p>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          void run(async () => {
            const sb = createBrowserSupabase()
            if (!sb) throw new Error('Supabase env vars are missing.')
            if (mode === 'up') {
              const { error: err } = await sb.auth.signUp({ email, password })
              if (err) throw err
            } else {
              const { error: err } = await sb.auth.signInWithPassword({ email, password })
              if (err) throw err
            }
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
        {error ? <p className="text-[12px] text-red-300">{error}</p> : null}
        <button type="submit" className="w-full rounded-full bg-magenta py-3 font-semibold">
          {mode === 'in' ? 'Sign in' : 'Create pilot'}
        </button>
      </form>
      <button
        type="button"
        className="w-full rounded-full border border-gold/40 py-3 text-gold"
        onClick={() =>
          void run(async () => {
            const sb = createBrowserSupabase()
            if (!sb) throw new Error('Supabase env vars are missing.')
            const { error: err } = await sb.auth.signInWithOAuth({
              provider: 'google',
              options: { redirectTo: `${import.meta.env.VITE_SITE_URL ?? window.location.origin}/profile` },
            })
            if (err) throw err
          })
        }
      >
        Continue with Google
      </button>
      <button
        type="button"
        className="w-full text-[12px] text-white/50"
        onClick={() => setMode(mode === 'in' ? 'up' : 'in')}
      >
        {mode === 'in' ? 'Need an account?' : 'Have an account?'}
      </button>
    </div>
  )
}
