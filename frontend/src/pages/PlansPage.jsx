// src/pages/PlansPage.jsx
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../lib/store.js'
import { api } from '../lib/api.js'

const FREE_FEATURES = [
  '3 leituras por mês',
  'Tiragem de 1 carta',
  'Tiragem Passado · Presente · Futuro',
  'Dados básicos do signo solar',
  'Horóscopo diário resumido',
]
const PREMIUM_FEATURES = [
  'Leituras ilimitadas',
  'Todos os tipos de tiragem',
  'Signo solar, lunar e ascendente',
  'Foco em Amor, Família e Dinheiro',
  'Previsão semanal e mensal',
  'Histórico completo de leituras',
  'Carta do Ano (tema anual)',
  'Compartilhamento com layout místico',
]
const LOCKED_FREE = [
  'Cruz Celta (10 cartas)',
  'Áreas de foco específicas',
  'Signo lunar e ascendente',
  'Histórico ilimitado',
]

export function PlansPage() {
  const user = useAuthStore(s => s.user)
  const fetchMe = useAuthStore(s => s.fetchMe)
  const [loading, setLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [searchParams] = useSearchParams()

  const success  = searchParams.get('success') === 'true'
  const canceled = searchParams.get('canceled') === 'true'

  useEffect(() => {
    // Após retorno do Stripe, recarrega dados do usuário
    if (success) fetchMe()
  }, [success])

  async function handleUpgrade() {
    setLoading(true)
    try {
      const { url } = await api.post('/stripe/checkout', {})
      window.location.href = url  // redireciona para Stripe Checkout
    } catch (err) {
      alert(err.message || 'Erro ao abrir checkout.')
    } finally {
      setLoading(false)
    }
  }

  async function handlePortal() {
    setPortalLoading(true)
    try {
      const { url } = await api.post('/stripe/portal', {})
      window.location.href = url
    } catch (err) {
      alert(err.message || 'Erro ao abrir portal.')
    } finally {
      setPortalLoading(false)
    }
  }

  return (
    <div style={{ maxWidth:'760px', margin:'0 auto' }} className="fade-up">
      <div style={{ textAlign:'center', marginBottom:'40px' }}>
        <h1 style={{ fontSize:'38px', marginBottom:'8px' }}>Planos</h1>
        <p style={{ color:'var(--text2)', fontFamily:'Cormorant Garamond, serif', fontSize:'19px', fontStyle:'italic' }}>
          Escolha sua jornada espiritual
        </p>
      </div>

      {/* Banners de retorno do Stripe */}
      {success && (
        <div style={{ background:'rgba(30,160,100,0.1)', border:'1px solid rgba(30,160,100,0.3)', borderRadius:'var(--radius-sm)', padding:'14px 18px', marginBottom:'24px', color:'#9FE1CB', textAlign:'center' }}>
          ✦ Bem-vindo ao Premium! Sua leitura ilimitada começa agora.
        </div>
      )}
      {canceled && (
        <div style={{ background:'rgba(226,75,74,0.08)', border:'1px solid rgba(226,75,74,0.25)', borderRadius:'var(--radius-sm)', padding:'14px 18px', marginBottom:'24px', color:'#f09595', textAlign:'center' }}>
          Checkout cancelado. Você pode tentar novamente quando quiser.
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'32px' }}>
        {/* FREE */}
        <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'28px' }}>
          <p style={{ fontSize:'11px', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'8px' }}>Gratuito</p>
          <p style={{ fontSize:'32px', fontWeight:500, marginBottom:'4px' }}>R$ 0</p>
          <p style={{ fontSize:'13px', color:'var(--text3)', marginBottom:'24px' }}>para sempre</p>

          <div style={{ borderTop:'1px solid var(--border)', paddingTop:'18px', display:'flex', flexDirection:'column', gap:'10px' }}>
            {FREE_FEATURES.map(f => (
              <div key={f} style={{ display:'flex', gap:'8px', fontSize:'13px', color:'var(--text2)' }}>
                <span style={{ color:'var(--purple)', flexShrink:0 }}>✓</span> {f}
              </div>
            ))}
            {LOCKED_FREE.map(f => (
              <div key={f} style={{ display:'flex', gap:'8px', fontSize:'13px', color:'var(--text3)', textDecoration:'line-through' }}>
                <span style={{ flexShrink:0 }}>—</span> {f}
              </div>
            ))}
          </div>

          {user?.plan === 'free' && (
            <div style={{ marginTop:'24px', padding:'10px', background:'rgba(139,130,220,0.06)', borderRadius:'var(--radius-sm)', textAlign:'center' }}>
              <p style={{ fontSize:'12px', color:'var(--purple-lt)' }}>✓ Plano atual</p>
            </div>
          )}
        </div>

        {/* PREMIUM */}
        <div style={{ background:'var(--bg2)', border:'2px solid var(--purple)', borderRadius:'var(--radius)', padding:'28px', position:'relative' }}>
          <span style={{ position:'absolute', top:'-13px', left:'50%', transform:'translateX(-50%)', background:'var(--purple)', color:'white', fontSize:'11px', padding:'3px 16px', borderRadius:'20px', whiteSpace:'nowrap' }}>
            Mais popular
          </span>

          <p style={{ fontSize:'11px', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'8px' }}>Místico Premium</p>
          <div style={{ display:'flex', alignItems:'baseline', gap:'6px', marginBottom:'4px' }}>
            <p style={{ fontSize:'32px', fontWeight:500 }}>R$ 29,90</p>
          </div>
          <p style={{ fontSize:'13px', color:'var(--text3)', marginBottom:'24px' }}>por mês · cancele quando quiser</p>

          <div style={{ borderTop:'1px solid var(--border)', paddingTop:'18px', display:'flex', flexDirection:'column', gap:'10px' }}>
            {PREMIUM_FEATURES.map(f => (
              <div key={f} style={{ display:'flex', gap:'8px', fontSize:'13px', color:'var(--text2)' }}>
                <span style={{ color:'var(--gold)', flexShrink:0 }}>✦</span> {f}
              </div>
            ))}
          </div>

          <div style={{ marginTop:'24px' }}>
            {user?.plan === 'premium' ? (
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                <div style={{ padding:'10px', background:'rgba(201,168,76,0.08)', borderRadius:'var(--radius-sm)', textAlign:'center' }}>
                  <p style={{ fontSize:'12px', color:'var(--gold)' }}>✦ Plano atual</p>
                </div>
                <button onClick={handlePortal} disabled={portalLoading} style={{ width:'100%', padding:'11px', background:'transparent', color:'var(--text2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', fontSize:'13px' }}>
                  {portalLoading ? 'Abrindo...' : 'Gerenciar assinatura'}
                </button>
              </div>
            ) : (
              <button onClick={handleUpgrade} disabled={loading} style={{ width:'100%', padding:'13px', background:'var(--purple)', color:'white', fontWeight:500, fontSize:'14px', borderRadius:'var(--radius-sm)' }}>
                {loading ? 'Redirecionando...' : '✦ Assinar Premium'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ borderTop:'1px solid var(--border)', paddingTop:'28px' }}>
        <h3 style={{ fontSize:'22px', marginBottom:'18px', textAlign:'center' }}>Perguntas frequentes</h3>
        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          {[
            ['Posso cancelar quando quiser?', 'Sim. O cancelamento é imediato pelo portal de assinaturas. Você mantém acesso premium até o fim do período já pago.'],
            ['Como funciona o limite gratuito?', 'O plano gratuito permite 3 leituras por mês no calendário. O contador reinicia no primeiro dia de cada mês.'],
            ['Os dados do meu signo são precisos?', 'O signo solar é calculado pela data de nascimento. Signo lunar e ascendente são calculados com data + hora + cidade de nascimento (plano Premium).'],
          ].map(([q, a]) => (
            <div key={q} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'16px 18px' }}>
              <p style={{ fontWeight:500, fontSize:'14px', marginBottom:'6px' }}>{q}</p>
              <p style={{ color:'var(--text2)', fontSize:'13px', lineHeight:1.6 }}>{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
