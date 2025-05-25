import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.tsx'
import Scripts from './pages/scripts/Scripts.tsx'
import Support from './pages/support/support.tsx'
import Website from './pages/website/website.tsx'
import { ThemeProvider } from './theme/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard.tsx'
import AdminLogin from './pages/admin/Login.tsx'
import AdminSignup from './pages/admin/Signup.tsx'
import PaymentSettings from './pages/admin/PaymentSettings.tsx'
import AdminSupport from './pages/admin/support.tsx'
import ScriptFiles from './pages/admin/script-files';
import EditFile from './pages/admin/edit-file';

import './index.css'
import './theme/theme.css'

// Ensure dark theme is set
document.documentElement.setAttribute('data-theme', 'dark')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<App />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/scripts" element={<Scripts />} />
            <Route path="/support" element={<Support />} />
            <Route path="/website" element={<Website />} />
            
            {/* Admin authentication routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/signup" element={<AdminSignup />} />
            
            {/* Protected admin routes */}
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Support tickets route */}
            <Route 
              path="/admin/support" 
              element={
                <ProtectedRoute>
                  <AdminSupport />
                </ProtectedRoute>
              } 
            />
            
            {/* Script Files Pages */}
            <Route 
              path="/admin/script-files" 
              element={
                <ProtectedRoute>
                  <ScriptFiles />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/admin/edit-file/:id" 
              element={
                <ProtectedRoute>
                  <EditFile />
                </ProtectedRoute>
              } 
            />
            
            {/* Payment Settings Page */}
            <Route 
              path="/admin/payment-settings" 
              element={
                <ProtectedRoute>
                  <PaymentSettings />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
