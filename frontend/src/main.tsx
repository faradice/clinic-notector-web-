import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

/**
 * Pick up a new deploy on the first reload, not the second.
 *
 * The app is a PWA: the service worker serves the precached shell, so an open page keeps running the
 * build it started with. Our SW does skipWaiting + clientsClaim, so a fresh SW takes control as soon as
 * it installs — but the page you are looking at was already served from the old cache, which is why a
 * reload after a deploy could still show the previous version (it cost us a round of "still the same"
 * while testing). When control changes hands, reload once so the new assets are what you see.
 *
 * `controllerchange` also fires the first time a SW ever claims an uncontrolled page — that page is
 * already running the newest assets, so reloading it would be pointless churn. Only a swap on a page
 * that WAS controlled means "you are looking at an older build".
 */
if ('serviceWorker' in navigator) {
  const wasControlled = !!navigator.serviceWorker.controller
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!wasControlled || reloading) return
    reloading = true
    window.location.reload()
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
