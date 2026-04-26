// src/pages/ProfilePage.jsx
import { useState } from 'react'
import { useAuthStore } from '../lib/store.js'
import { api } from '../lib/api.js'

export function ProfilePage() {
  const user    = useAuthStore(s => s.user)
  const fetchMe = useAuthStore(s => s.fetchMe)

  const [form, setForm]     = useState({
    name:       user?.name       || '',
    birth_date: user?.birth_date ? user.birth_date.slice(0,10) : '',
    birth_time: user?.birth_time || '',
    birth_city: user?.birth_city || '',
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved]     = useState(false)
  const [error, setError]     = useState('')

  function update(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSaved(false)
    setLoading(true)
    try {
      await api.patch('/auth/me', form)
      await fetchMe()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.message || 'Erro ao salvar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth:'520px', margin:'0 auto' }} className="fade-up">
      <h1 style={{ fontSize:'34px', marginBottom:'6px' }}>Perfil</h1>
      <p style={{ color:'var(--text2)', marginBottom:'32px', fontFamily:'Cormorant Garamond, serif', fontStyle:'italic', fontSize:'17px' }}>
        Seus dados astrológicos enriquecem cada leitura
      </p>

      {/* Plan badge */}
      <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'28px', padding:'14px 18px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)' }}>
        <div style={{ width:'38px', height:'38px', borderRadius:'50%', background:'rgba(139,130,220,0.15)', border:'1px solid rgba(139,130,220,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', flexShrink:0 }}>
          {user?.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div style={{ flex:1 }}>
          <p style={{ fontWeight:500, fontSize:'14px', marginBottom:'2px' }}>{user?.email}</p>
          <p style={{ fontSize:'12px', color:'var(--text3)' }}>
            {user?.sun_sign ? `${user.sun_sign} · ` : ''}
            {user?.plan === 'premium' ? 'Plano Premium ✦' : 'Plano Gratuito'}
          </p>
        </div>
      </div>

      {error && (
        <div style={{ background:'rgba(226,75,74,0.1)', border:'1px solid rgba(226,75,74,0.3)', borderRadius:'var(--radius-sm)', padding:'10px 14px', marginBottom:'16px', color:'#f09595', fontSize:'13px' }}>
          {error}
        </div>
      )}
      {saved && (
        <div style={{ background:'rgba(30,160,100,0.1)', border:'1px solid rgba(30,160,100,0.3)', borderRadius:'var(--radius-sm)', padding:'10px 14px', marginBottom:'16px', color:'#9FE1CB', fontSize:'13px' }}>
          ✓ Perfil atualizado com sucesso.
        </div>
      )}

      <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
        <div>
          <label style={{ fontSize:'12px', color:'var(--text2)', display:'block', marginBottom:'6px' }}>Nome</label>
          <input value={form.name} onChange={e => update('name', e.target.value)} placeholder="Seu nome" />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
          <div>
            <label style={{ fontSize:'12px', color:'var(--text2)', display:'block', marginBottom:'6px' }}>Data de nascimento</label>
            <input type="date" value={form.birth_date} onChange={e => update('birth_date', e.target.value)} style={{ colorScheme:'dark' }} />
          </div>
          <div>
            <label style={{ fontSize:'12px', color:'var(--text2)', display:'block', marginBottom:'6px' }}>
              Hora de nascimento
              {user?.plan !== 'premium' && <span style={{ color:'var(--gold)', marginLeft:'6px', fontSize:'10px' }}>Premium</span>}
            </label>
            <input
              type="time" value={form.birth_time}
              onChange={e => update('birth_time', e.target.value)}
              disabled={user?.plan !== 'premium'}
              style={{ opacity: user?.plan !== 'premium' ? .4 : 1 }}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize:'12px', color:'var(--text2)', display:'block', marginBottom:'6px' }}>
            Cidade natal
            {user?.plan !== 'premium' && <span style={{ color:'var(--gold)', marginLeft:'6px', fontSize:'10px' }}>Premium (ascendente)</span>}
          </label>
          <input value={form.birth_city} onChange={e => update('birth_city', e.target.value)} placeholder="Ex: São Paulo, SP" />
        </div>

        {user?.plan !== 'premium' && (
          <div style={{ background:'rgba(201,168,76,0.06)', border:'1px solid rgba(201,168,76,0.18)', borderRadius:'var(--radius-sm)', padding:'12px 16px', fontSize:'13px', color:'var(--text3)' }}>
            ✦ Com o plano Premium, calculamos seu signo lunar e ascendente para leituras ainda mais precisas.
          </div>
        )}

        <button type="submit" disabled={loading} style={{ padding:'13px', background:'var(--purple)', color:'white', fontWeight:500, borderRadius:'var(--radius-sm)', marginTop:'4px' }}>
          {loading ? 'Salvando...' : 'Salvar perfil'}
        </button>
      </form>
    </div>
  )
}
