import { createFileRoute } from '@tanstack/react-router'
import { ChallengeBoard } from '~/ui/Challenges'

export const Route = createFileRoute('/challenges/')({
  component: ChallengesIndexPage,
})

function ChallengesIndexPage() {
  return <ChallengeBoard />
}
