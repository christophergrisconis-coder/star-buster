import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/challenges')({
  component: ChallengesLayout,
})

function ChallengesLayout() {
  return <Outlet />
}
