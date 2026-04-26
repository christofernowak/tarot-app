// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'

import { useAuthStore } from './lib/store.js'
import { Layout } from './components/Layout.jsx'
import { LoginPage } from './pages/LoginPage.jsx'
import { RegisterPage } from './pages/RegisterPage.jsx'
import { HomePage } from './pages/HomePage.jsx'
import { ReadingPage } from './pages/ReadingPage.jsx'
import { HistoryPage } from './pages/HistoryPage.jsx'
import { PlansPage } from './pages/PlansPage.jsx'
import { ProfilePage } from './pages/ProfilePage.jsx'

function PrivateRoute({ children }) {
  const { token, loading } = useAuthStore()
  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'var(--text2)'}}>Carregando...</div>
  return token ? children : <Navigate to="/login" replace />
}

function App() {
  const fetchMe = useAuthStore(s => s.fetchMe)
  const token = useAuthStore(s => s.token)

  React.useEffect(() => {
    if (token) fetchMe()
    else useAuthStore.setState({ loading: false })
  }, [token])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index            element={<HomePage />} />
          <Route path="/leitura"  element={<ReadingPage />} />
          <Route path="/historico" element={<HistoryPage />} />
          <Route path="/planos"   element={<PlansPage />} />
          <Route path="/perfil"   element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
)
