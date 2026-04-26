// src/pages/HomePage.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore, useReadingStore } from '../lib/store.js'
import { api } from '../lib/api.js'

export function HomePage() {
  const user  = useAuthStore(s => s.user)
  const usage = useReadingStore(s => s.usage)
  const fetchUsage = useReadingStore(s => s.fetchUsage)
  const [signData, setSignData] = useState(null)
  const [recentReadings, setRecentReadings] = useState([])

  useEffect(() => {
    fetchUsage()
    api.get('/sign/me').then(setSignData).catch(() => {})
    api.get('/reading?limit=3').then(d => setRecentReadings(d.readings || [])).catch(() => {})
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'32px' }}>
      {/* Header */}
      <div className="fade-up" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:'16px' }}>
        <div>
          <h1 style={{ fontSize:'36px', marginBottom:'6px' }}>{greeting}, {user?.name?.split(' ')[0]} ✦</h1>
          <p style={{ color:'var(--text2)', fontFamily:'Cormorant Garamond, serif', fontSize:'18px', fontStyle:'italic' }}>
            O que os astros revelam para você hoje?
          </p>
        </div>
        {usage && !usage.isPremium && (
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'12px 18px', textAlign:'right' }}>
            <p style={{ fontSize:'11px', color:'var(--text3)', marginBottom:'4px' }}>Leituras este mês</p>
            <p style={{ fontSize:'22px', fontWeight:500, color: usage.remaining === 0 ? '#f09595' : 'var(--text)' }}>
              {usage.used} <span style={{ fontSize:'14px', color:'var(--text3)' }}>/ {usage.limit}</span>
            </p>
            {usage.remaining === 0 && (
              <Link to="/planos" style={{ fontSize:'11px', color:'var(--gold)', display:'block', marginTop:'4px' }}>Fazer upgrade →</Link>
            )}
          </div>
        )}
      </div>

      {/* CTA principal */}
      <div className="fade-up anim-delay-1" style={{ background:'linear-gradient(135deg, rgba(139,130,220,0.12) 0%, rgba(201,168,76,0.08) 100%)', border:'1px solid var(--border2)', borderRadius:'var(--radius)', padding:'32px', textAlign:'center' }}>
        <p style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'42px', marginBottom:'8px' }}>✦ ◎ ✦</p>
        <h2 style={{ fontSize:'28px', marginBottom:'10px' }}>Consulte as cartas</h2>
        <p style={{ color:'var(--text2)', marginBottom:'24px', maxWidth:'400px', margin:'0 auto 24px' }}>
          Escolha suas cartas e receba uma interpretação personalizada com base no seu mapa astral.
        </p>
        <Link to="/leitura">
          <button style={{ padding:'13px 32px', background:'var(--purple)', color:'white', fontWeight:500, fontSize:'15px', borderRadius:'var(--radius-sm)' }}>
            Iniciar leitura
          </button>
        </Link>
      </div>

      {/* Signo */}
      {signData?.sun_sign && (
        <div className="fade-up anim-delay-2" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'12px' }}>
          {[
            { label:'Signo Solar', value:`${signData.sun_data?.symbol} ${signData.sun_sign}`, sub: signData.sun_data?.element },
            { label:'Planeta Regente', value: signData.sun_data?.planet, sub: signData.sun_data?.quality },
            { label:'Signo Lunar', value: user?.plan === 'premium' ? `${signData.moon_data?.symbol || ''} ${signData.moon_sign || '?'}` : '— Premium', sub: user?.plan === 'premium' ? signData.moon_data?.element : 'Faça upgrade', locked: user?.plan !== 'premium' },
            { label:'Ascendente', value: user?.plan === 'premium' ? `${signData.rising_data?.symbol || ''} ${signData.rising_sign || '?'}` : '— Premium', sub: user?.plan === 'premium' ? signData.rising_data?.element : 'Faça upgrade', locked: user?.plan !== 'premium' },
          ].map(card => (
            <div key={card.label} style={{ background:'var(--bg2)', border:`1px solid ${card.locked ? 'var(--border)' : 'var(--border2)'}`, borderRadius:'var(--radius-sm)', padding:'16px', opacity: card.locked ? .6 : 1 }}>
              <p style={{ fontSize:'11px', color:'var(--text3)', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'.06em' }}>{card.label}</p>
              <p style={{ fontSize:'18px', fontWeight:500, color: card.locked ? 'var(--text3)' : 'var(--text)', marginBottom:'2px' }}>{card.value}</p>
              <p style={{ fontSize:'12px', color:'var(--text3)' }}>{card.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Leituras recentes */}
      {recentReadings.length > 0 && (
        <div className="fade-up anim-delay-3">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
            <h3 style={{ fontSize:'20px' }}>Leituras recentes</h3>
            <Link to="/historico" style={{ fontSize:'13px', color:'var(--text2)' }}>Ver todas →</Link>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {recentReadings.map(r => (
              <div key={r.id} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <p style={{ fontWeight:500, fontSize:'15px', marginBottom:'2px' }}>{r.title || 'Leitura de tarô'}</p>
                  <p style={{ fontSize:'12px', color:'var(--text3)' }}>
                    {new Date(r.created_at).toLocaleDateString('pt-BR')} · {r.spread_type} · {r.focus_area}
                  </p>
                </div>
                {r.is_favorite && <span style={{ color:'var(--gold)' }}>★</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
