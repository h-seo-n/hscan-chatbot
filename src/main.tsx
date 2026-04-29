import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AuthProvider } from 'react-oidc-context'
import { oidcConfig } from './core/util/auth/oidcConfig.ts'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './AppRoutes.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider {...oidcConfig}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter> 
    </AuthProvider>
  </StrictMode>,
)
