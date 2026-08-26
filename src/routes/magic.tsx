import { createFileRoute, redirect } from '@tanstack/react-router'
import { loginWithPasscode } from '~/lib/owner'
import { mergeGuestIntoUser } from '~/lib/progress'
import { z } from 'zod'

export const Route = createFileRoute('/magic')({
  validateSearch: z.object({
    code: z.string().optional(),
  }),
  beforeLoad: ({ search, navigate }) => {
    if (search.code) {
      const res = loginWithPasscode(search.code)
      if (!res.error) {
        mergeGuestIntoUser()
        throw redirect({ to: '/profile', replace: true })
      }
    }
    throw redirect({ to: '/auth', replace: true })
  },
})
