// @refresh reload
import { Links, Routes, Scripts } from "solid-start/root"
import { Suspense } from "solid-js"
import { ErrorBoundary } from "solid-start/error-boundary"
import { isServer } from "solid-js/web"
import Nav from "./components/nav"
import "./root.css"

import { attachDebugger, useLocatorPlugin } from "solid-devtools"

useLocatorPlugin({
  targetIDE: "vscode",
})

export default function Root() {
  attachDebugger()
  return (
    <html lang="en">
      <head>
        <title>Solid - Hacker News</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Hacker News Clone built with Solid" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <Links />
      </head>
      <body>
        <Nav />
        <ErrorBoundary>
          <Suspense fallback={<div class="news-list-nav">Loading...</div>}>
            <Routes />
          </Suspense>
        </ErrorBoundary>
        <Scripts />
      </body>
    </html>
  )
}

if (import.meta.env.PROD && !isServer && "serviceWorker" in navigator) {
  // Use the window load event to keep the page load performant
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`/sw.js`)
  })
}
