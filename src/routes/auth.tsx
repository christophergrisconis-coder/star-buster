import { createFileRoute } from '@tanstack/react-router'
import { AuthPanel } from '~/ui/AuthPanel'

export const Route = createFileRoute('/auth')({
  component: AuthPage,
})

function AuthPage() {
  return (
    <div className="px-4 pt-6">
      <AuthPanel />
    </div>
  )
}
