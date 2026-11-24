import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// --- Performance baselines: LCP, CLS, INP ---------------------------------
// Dependency-free PerformanceObserver: the browser measures, we print each
// Web Vital once it has settled — LCP and INP in ms (lower is better), CLS
// as a shift score (≈ 0 is ideal). LCP freezes at the first interaction, so
// it reports then; CLS and INP keep changing until the page is hidden, so
// those report when the page goes to the background or is left.
type VitalEntry = PerformanceEntry & {
  value?: number
  hadRecentInput?: boolean
  interactionId?: number
  duration?: number
}

const vitals: Record<string, number> = { LCP: 0, CLS: 0, INP: 0 }
const reported = new Set<string>()

const emit = (name: string) => {
  if (reported.has(name) || vitals[name] <= 0) return
  reported.add(name)
  const value = vitals[name]
  console.info(
    `[perf] ${name} ${name === 'CLS' ? value.toFixed(3) : `${Math.round(value)} ms`}`,
  )
}

const observe = (type: string, onEntry: (entry: VitalEntry) => void) => {
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) onEntry(entry as VitalEntry)
    }).observe({ type, buffered: true })
  } catch {
    // This browser doesn't know the entry type — skip that metric.
  }
}

observe('largest-contentful-paint', (entry) => {
  vitals.LCP = entry.startTime
})
observe('layout-shift', (entry) => {
  if (!entry.hadRecentInput) vitals.CLS += entry.value ?? 0
})
observe('event', (entry) => {
  // The real INP is a high percentile of interaction durations; the worst
  // one so far is a good-enough lightweight stand-in.
  if ((entry.interactionId ?? 0) > 0 && (entry.duration ?? 0) > vitals.INP) {
    vitals.INP = entry.duration ?? 0
  }
})

const settleLcp = () => emit('LCP')
const settleAll = () => {
  emit('LCP')
  emit('CLS')
  emit('INP')
}

window.addEventListener('pointerdown', settleLcp, { once: true })
window.addEventListener('keydown', settleLcp, { once: true })
window.addEventListener('pagehide', settleAll, { once: true })
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') settleAll()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
