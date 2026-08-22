import { createFileRoute } from '@tanstack/react-router'
import { ChallengeBoard } from '~/ui/Challenges'

export const Route = createFileRoute('/challenges/$nebulaId')({
  component: NebulaChallengesPage,
})

function NebulaChallengesPage() {
  const { nebulaId } = Route.useParams()
  return <ChallengeBoard nebulaId={nebulaId} />
}
