import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SpeedInsights } from '@vercel/speed-insights/react'
import '@fontsource-variable/outfit'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    {/* Vercel Speed Insights: reports Core Web Vitals once deployed on Vercel. */}
    <SpeedInsights />
  </StrictMode>,
)
