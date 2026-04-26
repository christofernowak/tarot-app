// src/pages/RegisterPage.jsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../lib/store.js'

export function RegisterPage() {
  const [form, setForm]   = useState({ name:'', email:'', password:'', birth_date:'', birth_city:'' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const register = useAuthStore(s => s.register)
  const navigate = useNavigate()

  function update(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) { setError('Senha deve ter ao menos 8 caracteres.'); return }
    setLoading(true)
    try {
      await register(form)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Erro ao criar conta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:'24px' }}>
      <div className="fade-up" style={{ width:'100%', maxWidth:'440px' }}>
        <div style={{ textAlign:'center', marginBottom:'32px' }}>
          <h1 style={{ fontSize:'36px', color:'var(--gold-lt)' }}>✦ Mística</h1>
          <p style={{ color:'var(--text2)', fontFamily:'Cormorant Garamond, serif', fontSize:'17px', fontStyle:'italic' }}>Inicie sua jornada espiritual</p>
        </div>

        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'32px' }}>
          <h2 style={{ fontSize:'22px', marginBottom:'24px' }}>Criar conta gratuita</h2>

          {error && (
            <div style={{ background:'rgba(226,75,74,0.1)', border:'1px solid rgba(226,75,74,0.3)', borderRadius:'var(--radius-sm)', padding:'10px 14px', marginBottom:'16px', color:'#f09595', fontSize:'13px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <div>
              <label style={{ fontSize:'12px', color:'var(--text2)', display:'block', marginBottom:'6px' }}>Nome</label>
              <input value={form.name} onChange={e=>update('name',e.target.value)} placeholder="Seu nome" required />
            </div>
            <div>
              <label style={{ fontSize:'12px', color:'var(--text2)', display:'block', marginBottom:'6px' }}>Email</label>
              <input type="email" value={form.email} onChange={e=>update('email',e.target.value)} placeholder="seu@email.com" required autoComplete="email" />
            </div>
            <div>
              <label style={{ fontSize:'12px', color:'var(--text2)', display:'block', marginBottom:'6px' }}>Senha</label>
              <input type="password" value={form.password} onChange={e=>update('password',e.target.value)} placeholder="Mínimo 8 caracteres" required autoComplete="new-password" />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
              <div>
                <label style={{ fontSize:'12px', color:'var(--text2)', display:'block', marginBottom:'6px' }}>Data de nascimento</label>
                <input type="date" value={form.birth_date} onChange={e=>update('birth_date',e.target.value)} style={{ colorScheme:'dark' }} />
              </div>
              <div>
                <label style={{ fontSize:'12px', color:'var(--text2)', display:'block', marginBottom:'6px' }}>Cidade natal</label>
                <input value={form.birth_city} onChange={e=>update('birth_city',e.target.value)} placeholder="Ex: São Paulo" />
              </div>
            </div>
            <p style={{ fontSize:'11px', color:'var(--text3)', marginTop:'-4px' }}>
              Data e cidade são opcionais mas enriquecem sua leitura astrológica.
            </p>
            <button type="submit" disabled={loading} style={{ marginTop:'8px', padding:'12px', background:'var(--purple)', color:'white', fontWeight:500, borderRadius:'var(--radius-sm)' }}>
              {loading ? 'Criando conta...' : 'Criar conta gratuita'}
            </button>
          </form>

          <p style={{ marginTop:'20px', textAlign:'center', fontSize:'13px', color:'var(--text2)' }}>
            Já tem conta? <Link to="/login" style={{ color:'var(--gold-lt)' }}>Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
