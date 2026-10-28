import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ToastProvider } from './components/ui/Toast'
import { AuthProvider } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import ErrorBoundary from './components/ui/ErrorBoundary'
import '@fontsource/permanent-marker'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <AppProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </AppProvider>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>,
)
