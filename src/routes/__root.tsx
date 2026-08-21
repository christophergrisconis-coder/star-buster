import type { ReactNode } from 'react'
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { Shell } from '~/ui/Shell'
import appCss from '~/styles/app.css?url'

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { title: 'Star Buster' },
      { name: 'description', content: 'Glide a solar system. Burst superstar gems. 250 levels.' },
      { name: 'theme-color', content: '#07060f' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }, { rel: 'icon', href: '/favicon.svg' }],
  }),
  component: RootComponent,
  shellComponent: RootDocument,
})

function RootComponent() {
  return (
    <Shell>
      <Outlet />
    </Shell>
  )
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('sb-theme')==='light')document.documentElement.classList.add('light')}catch(e){}`,
          }}
        />
      </head>
      <body className="antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  )
}
