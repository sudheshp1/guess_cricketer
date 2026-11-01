import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import '@fontsource-variable/outfit'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    {/* Vercel Speed Insights: reports Core Web Vitals once deployed on Vercel. */}
    <SpeedInsights />
    {/* Vercel Web Analytics: privacy-friendly page views and visitors (no cookies). */}
    <Analytics />
  </StrictMode>,
)
