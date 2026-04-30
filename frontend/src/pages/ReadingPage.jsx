// src/pages/ReadingPage.jsx
import { useState, useRef } from 'react'
import { useAuthStore } from '../lib/store.js'
import { api } from '../lib/api.js'
import { SPREAD_CONFIG, FOCUS_AREAS, drawCards } from '../lib/deck.js'

export function ReadingPage() {
  const user = useAuthStore(s => s.user)
  const [step, setStep]           = useState('config')   // config | cards | result
  const [spreadType, setSpreadType] = useState('trio')
  const [focusArea, setFocusArea]  = useState('general')
  const [cards, setCards]          = useState([])
  const [streaming, setStreaming]  = useState(false)
  const [streamText, setStreamText] = useState('')
  const [result, setResult]        = useState(null)
  const [error, setError]          = useState('')
  const streamRef = useRef('')

  const spread = SPREAD_CONFIG[spreadType]
  const isPremiumSpread = !spread.free && user?.plan !== 'premium'

  function handleDraw() {
    const drawn = drawCards(spread.slots.length)
    setCards(drawn)
    setStep('cards')
  }

  async function handleReveal() {
  setError('')
  setStreaming(true)
  setStreamText('')
  setResult(null)
  streamRef.current = ''

  const payload = {
    cards: cards.map((c, i) => ({
      ...c,
      position: spread.slots[i] || `Posição ${i+1}`,
    })),
    spreadType,
    focusArea,
  }

  try {
    await api.stream(
      '/reading',
      payload,
      (delta) => {
        streamRef.current += delta
        setStreamText(streamRef.current)
      },
      (data) => {
        // Tenta usar o parsed que veio do servidor
        // Se não vier, faz o parse local do texto acumulado
        let parsed = data?.parsed || {}
        if (!parsed.titulo) {
          try {
            const match = streamRef.current.match(/\{[\s\S]*\}/)
            if (match) parsed = JSON.parse(match[0])
          } catch {}
        }
        setResult(parsed)
        setStreaming(false)
        setStep('result')
      }
    )
  } catch (err) {
    // Se stream fechou sem chamar onDone, tenta mostrar o que acumulou
    if (streamRef.current.length > 100) {
      try {
        const match = streamRef.current.match(/\{[\s\S]*\}/)
        if (match) {
          setResult(JSON.parse(match[0]))
          setStep('result')
        } else {
          setError(err.message || 'Erro ao gerar leitura.')
        }
      } catch {
        setError(err.message || 'Erro ao gerar leitura.')
      }
    } else {
      setError(err.message || 'Erro ao gerar leitura.')
    }
    setStreaming(false)
  }
}

  function handleReset() {
    setStep('config')
    setCards([])
    setStreamText('')
    setResult(null)
    setError('')
    streamRef.current = ''
  }

  // ── STEP: config ────────────────────────────────────────────────────────────
  if (step === 'config') return (
    <div style={{ maxWidth:'640px', margin:'0 auto' }} className="fade-up">
      <h1 style={{ fontSize:'36px', marginBottom:'8px' }}>Nova leitura</h1>
      <p style={{ color:'var(--text2)', marginBottom:'32px', fontFamily:'Cormorant Garamond, serif', fontSize:'17px', fontStyle:'italic' }}>
        Escolha o tipo de tiragem e o foco antes de consultar as cartas
      </p>

      {/* Spread type */}
      <div style={{ marginBottom:'28px' }}>
        <p style={{ fontSize:'12px', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'12px' }}>Tipo de tiragem</p>
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {Object.entries(SPREAD_CONFIG).map(([key, cfg]) => {
            const locked = !cfg.free && user?.plan !== 'premium'
            const active = spreadType === key
            return (
              <button key={key} onClick={() => !locked && setSpreadType(key)}
                style={{
                  padding:'14px 18px',
                  background: active ? 'rgba(139,130,220,0.12)' : 'var(--bg2)',
                  border:`1px solid ${active ? 'var(--purple)' : 'var(--border)'}`,
                  borderRadius:'var(--radius-sm)',
                  color: locked ? 'var(--text3)' : 'var(--text)',
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  cursor: locked ? 'not-allowed' : 'pointer',
                  opacity: locked ? .55 : 1,
                  textAlign:'left',
                }}>
                <div>
                  <span style={{ fontWeight:500, fontSize:'14px' }}>{cfg.label}</span>
                  <span style={{ fontSize:'12px', color:'var(--text3)', marginLeft:'10px' }}>
                    {cfg.slots.length} carta{cfg.slots.length > 1 ? 's' : ''}
                  </span>
                </div>
                {locked && <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'20px', background:'rgba(201,168,76,0.1)', color:'var(--gold)', border:'1px solid rgba(201,168,76,0.2)' }}>Premium</span>}
                {active && !locked && <span style={{ color:'var(--purple)', fontSize:'16px' }}>✓</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Focus area */}
      <div style={{ marginBottom:'32px' }}>
        <p style={{ fontSize:'12px', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'12px' }}>Área de foco</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'8px' }}>
          {FOCUS_AREAS.map(f => {
            const locked = f.id !== 'general' && user?.plan !== 'premium'
            const active = focusArea === f.id
            return (
              <button key={f.id} onClick={() => !locked && setFocusArea(f.id)}
                style={{
                  padding:'12px 8px',
                  background: active ? 'rgba(139,130,220,0.12)' : 'var(--bg2)',
                  border:`1px solid ${active ? 'var(--purple)' : 'var(--border)'}`,
                  borderRadius:'var(--radius-sm)',
                  color: locked ? 'var(--text3)' : 'var(--text)',
                  display:'flex', flexDirection:'column', alignItems:'center', gap:'4px',
                  opacity: locked ? .55 : 1,
                  cursor: locked ? 'not-allowed' : 'pointer',
                  fontSize:'13px',
                }}>
                <span style={{ fontSize:'18px' }}>{f.icon}</span>
                <span style={{ fontWeight: active ? 500 : 400 }}>{f.label}</span>
                {locked && <span style={{ fontSize:'10px', color:'var(--gold)' }}>Premium</span>}
              </button>
            )
          })}
        </div>
      </div>

      <button onClick={handleDraw} style={{ width:'100%', padding:'14px', background:'var(--purple)', color:'white', fontWeight:500, fontSize:'15px', borderRadius:'var(--radius-sm)' }}>
        Embaralhar e revelar cartas
      </button>
    </div>
  )

  // ── STEP: cards ─────────────────────────────────────────────────────────────
  if (step === 'cards') return (
    <div style={{ maxWidth:'700px', margin:'0 auto' }} className="fade-up">
      <h2 style={{ fontSize:'28px', marginBottom:'6px' }}>Suas cartas</h2>
      <p style={{ color:'var(--text2)', fontFamily:'Cormorant Garamond, serif', fontStyle:'italic', fontSize:'17px', marginBottom:'28px' }}>
        {spread.label} · concentre-se em sua intenção
      </p>

      <div style={{ display:'flex', flexWrap:'wrap', gap:'14px', justifyContent:'center', marginBottom:'32px' }}>
        {cards.map((card, i) => (
          <div key={i} className="fade-up" style={{ animationDelay:`${i*0.08}s`, textAlign:'center', width:'110px' }}>
            <div style={{
              width:'110px', height:'176px',
              borderRadius:'10px',
              background: card.inverted ? 'rgba(226,75,74,0.08)' : 'rgba(139,130,220,0.08)',
              border:`1.5px solid ${card.inverted ? 'rgba(226,75,74,0.4)' : 'var(--border2)'}`,
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              padding:'10px',
              transform: card.inverted ? 'rotate(180deg)' : 'none',
              marginBottom:'8px',
            }}>
              <p style={{ fontSize:'10px', color:'var(--text3)', marginBottom:'6px' }}>{card.number}</p>
              <p style={{ fontSize:'32px', margin:'4px 0 8px' }}>{card.symbol}</p>
              <p style={{ fontSize:'11px', fontWeight:500, color:'var(--text)', textAlign:'center', lineHeight:1.3 }}>{card.name}</p>
              <p style={{ fontSize:'9px', color:'var(--purple-lt)', marginTop:'4px', textAlign:'center' }}>{card.keyword.split(',')[0]}</p>
            </div>
            <p style={{ fontSize:'11px', color:'var(--text3)' }}>{spread.slots[i]}</p>
            {card.inverted && <p style={{ fontSize:'10px', color:'rgba(226,75,74,0.8)', marginTop:'2px' }}>invertida</p>}
          </div>
        ))}
      </div>

      {error && (
        <div style={{ background:'rgba(226,75,74,0.1)', border:'1px solid rgba(226,75,74,0.3)', borderRadius:'var(--radius-sm)', padding:'10px 14px', marginBottom:'16px', color:'#f09595', fontSize:'13px' }}>
          {error}
        </div>
      )}

      <div style={{ display:'flex', gap:'12px' }}>
        <button onClick={handleReset} style={{ flex:1, padding:'13px', background:'transparent', color:'var(--text2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)' }}>
          ← Recomeçar
        </button>
        <button onClick={handleReveal} disabled={streaming} style={{ flex:2, padding:'13px', background:'var(--gold)', color:'#1a1200', fontWeight:500, fontSize:'15px', borderRadius:'var(--radius-sm)' }}>
          {streaming ? 'Consultando o oráculo...' : '✦ Revelar leitura'}
        </button>
      </div>

      {streaming && (
        <div style={{ marginTop:'24px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'20px' }}>
          <p style={{ color:'var(--text2)', fontFamily:'Cormorant Garamond, serif', fontStyle:'italic', whiteSpace:'pre-wrap', fontSize:'15px', lineHeight:1.8 }}>
            {streamText}<span style={{ animation:'shimmer 1s infinite', display:'inline-block', width:'2px', height:'14px', background:'var(--purple)', verticalAlign:'middle', marginLeft:'2px' }} />
          </p>
        </div>
      )}
    </div>
  )

  // ── STEP: result ─────────────────────────────────────────────────────────────
  if (step === 'result' && result) return (
    <div style={{ maxWidth:'680px', margin:'0 auto' }} className="fade-up">
      <div style={{ textAlign:'center', marginBottom:'32px' }}>
        <p style={{ fontSize:'32px', marginBottom:'8px' }}>✦</p>
        <h1 style={{ fontSize:'32px', fontFamily:'Cormorant Garamond, serif', color:'var(--gold-lt)', marginBottom:'6px' }}>{result.titulo}</h1>
        {result.palavras_chave?.length > 0 && (
          <div style={{ display:'flex', gap:'6px', justifyContent:'center', flexWrap:'wrap', marginTop:'12px' }}>
            {result.palavras_chave.map(kw => (
              <span key={kw} style={{ fontSize:'12px', padding:'3px 12px', borderRadius:'20px', background:'rgba(139,130,220,0.12)', color:'var(--purple-lt)', border:'1px solid rgba(139,130,220,0.2)' }}>{kw}</span>
            ))}
          </div>
        )}
      </div>

      {/* Cartas */}
      <div style={{ display:'flex', flexDirection:'column', gap:'16px', marginBottom:'24px' }}>
        {result.cartas?.map((c, i) => (
          <div key={i} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'20px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:'10px' }}>
              <h3 style={{ fontSize:'18px', color:'var(--gold-lt)' }}>{c.posicao}</h3>
              <span style={{ fontSize:'13px', color:'var(--text3)' }}>{c.carta}{c.invertida ? ' · invertida' : ''}</span>
            </div>
            <p style={{ color:'var(--text2)', lineHeight:1.8, fontFamily:'Cormorant Garamond, serif', fontSize:'17px' }}>{c.interpretacao}</p>
          </div>
        ))}
      </div>

      {/* Síntese */}
      {result.sintese && (
        <div style={{ background:'rgba(139,130,220,0.07)', border:'1px solid var(--border2)', borderRadius:'var(--radius)', padding:'24px', marginBottom:'16px' }}>
          <h3 style={{ fontSize:'20px', marginBottom:'12px', color:'var(--purple-lt)' }}>✦ Síntese</h3>
          <p style={{ color:'var(--text)', lineHeight:1.9, fontFamily:'Cormorant Garamond, serif', fontSize:'17px' }}>{result.sintese}</p>
        </div>
      )}

      {/* Conselho */}
      {result.conselho && (
        <div style={{ background:'rgba(201,168,76,0.06)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:'var(--radius)', padding:'20px', marginBottom:'24px', textAlign:'center' }}>
          <p style={{ fontSize:'12px', color:'var(--gold)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:'8px' }}>Conselho das cartas</p>
          <p style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'20px', fontStyle:'italic', color:'var(--text)' }}>{result.conselho}</p>
        </div>
      )}

      <button onClick={handleReset} style={{ width:'100%', padding:'13px', background:'var(--purple)', color:'white', fontWeight:500, fontSize:'14px', borderRadius:'var(--radius-sm)' }}>
        ✦ Fazer nova leitura
      </button>
    </div>
  )

  return null
}
