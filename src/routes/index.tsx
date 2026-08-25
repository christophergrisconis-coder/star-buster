import { createFileRoute } from '@tanstack/react-router'
import { VoyageMap } from '~/ui/VoyageMap'
import { MapSkeleton } from '~/ui/skeletons'

export const Route = createFileRoute('/')({
  component: Home,
  pendingComponent: MapSkeleton,
})

function Home() {
  return <VoyageMap />
}
