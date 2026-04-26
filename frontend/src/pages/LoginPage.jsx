// src/pages/LoginPage.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../lib/store.js'

export function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const login    = useAuthStore(s => s.login)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Erro ao fazer login.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:'24px' }}>
      <div className="fade-up" style={{ width:'100%', maxWidth:'400px' }}>
        <div style={{ textAlign:'center', marginBottom:'40px' }}>
          <h1 style={{ fontSize:'42px', color:'var(--gold-lt)', marginBottom:'8px' }}>✦ Mística</h1>
          <p style={{ color:'var(--text2)', fontFamily:'Cormorant Garamond, serif', fontSize:'18px', fontStyle:'italic' }}>O oráculo te aguarda</p>
        </div>

        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'32px' }}>
          <h2 style={{ fontSize:'24px', marginBottom:'24px' }}>Entrar</h2>

          {error && (
            <div style={{ background:'rgba(226,75,74,0.1)', border:'1px solid rgba(226,75,74,0.3)', borderRadius:'var(--radius-sm)', padding:'10px 14px', marginBottom:'16px', color:'#f09595', fontSize:'13px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <div>
              <label style={{ fontSize:'12px', color:'var(--text2)', display:'block', marginBottom:'6px' }}>Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" required autoComplete="email" />
            </div>
            <div>
              <label style={{ fontSize:'12px', color:'var(--text2)', display:'block', marginBottom:'6px' }}>Senha</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password" />
            </div>
            <button type="submit" disabled={loading} style={{ marginTop:'8px', padding:'12px', background:'var(--purple)', color:'white', fontWeight:500, fontSize:'14px', borderRadius:'var(--radius-sm)' }}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p style={{ marginTop:'20px', textAlign:'center', fontSize:'13px', color:'var(--text2)' }}>
            Não tem conta? <Link to="/registro" style={{ color:'var(--gold-lt)' }}>Criar conta gratuita</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
