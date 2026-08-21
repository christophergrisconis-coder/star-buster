import { createFileRoute } from '@tanstack/react-router'
import { UniverseMap } from '~/ui/Map'
import { MapSkeleton } from '~/ui/skeletons'

export const Route = createFileRoute('/')({
  component: Home,
  pendingComponent: MapSkeleton,
})

function Home() {
  return <UniverseMap />
}
