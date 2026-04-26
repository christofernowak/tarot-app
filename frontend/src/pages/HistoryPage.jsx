// src/pages/HistoryPage.jsx
import { useEffect, useState } from 'react'
import { api } from '../lib/api.js'

const SPREAD_LABEL = {
  day: 'Carta do Dia', trio: 'Passado · Presente · Futuro',
  celtic: 'Cruz Celta', horseshoe: 'Ferradura', year: 'Carta do Ano',
}
const FOCUS_LABEL = {
  general:'Geral', love:'Amor', family:'Família',
  money:'Dinheiro', health:'Saúde', career:'Carreira',
}

export function HistoryPage() {
  const [readings, setReadings]   = useState([])
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading]     = useState(true)
  const [expanded, setExpanded]   = useState(null)

  async function load(p = 1) {
    setLoading(true)
    try {
      const data = await api.get(`/reading?page=${p}&limit=10`)
      setReadings(data.readings)
      setTotal(data.total)
      setTotalPages(data.totalPages)
      setPage(p)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function toggleFavorite(id) {
    const { is_favorite } = await api.patch(`/reading/${id}/favorite`)
    setReadings(rs => rs.map(r => r.id === id ? { ...r, is_favorite } : r))
  }

  async function loadDetail(id) {
    if (expanded === id) { setExpanded(null); return }
    const { reading } = await api.get(`/reading/${id}`)
    setReadings(rs => rs.map(r => r.id === id ? { ...r, _detail: reading } : r))
    setExpanded(id)
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'200px', color:'var(--text3)' }}>
      <span style={{ animation:'spin 1s linear infinite', display:'inline-block', marginRight:'10px', fontSize:'18px' }}>◎</span>
      Carregando histórico...
    </div>
  )

  return (
    <div style={{ maxWidth:'720px', margin:'0 auto' }} className="fade-up">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:'28px' }}>
        <div>
          <h1 style={{ fontSize:'34px', marginBottom:'4px' }}>Histórico</h1>
          <p style={{ color:'var(--text3)', fontSize:'13px' }}>{total} leitura{total !== 1 ? 's' : ''} no total</p>
        </div>
      </div>

      {readings.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 0', color:'var(--text3)' }}>
          <p style={{ fontSize:'40px', marginBottom:'12px' }}>✦</p>
          <p style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'20px' }}>Nenhuma leitura ainda</p>
          <p style={{ fontSize:'13px', marginTop:'8px' }}>Sua jornada começa na página de Leitura</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          {readings.map(r => (
            <div key={r.id} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--radius)', overflow:'hidden' }}>
              {/* Row */}
              <div
                onClick={() => loadDetail(r.id)}
                style={{ padding:'16px 18px', display:'flex', alignItems:'center', gap:'14px', cursor:'pointer', userSelect:'none' }}
              >
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontWeight:500, fontSize:'15px', marginBottom:'3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {r.title || 'Leitura de tarô'}
                  </p>
                  <p style={{ fontSize:'12px', color:'var(--text3)' }}>
                    {new Date(r.created_at).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' })}
                    {' · '}{SPREAD_LABEL[r.spread_type] || r.spread_type}
                    {' · '}{FOCUS_LABEL[r.focus_area] || r.focus_area}
                  </p>
                </div>

                {/* Keywords */}
                <div style={{ display:'flex', gap:'5px', flexWrap:'wrap', justifyContent:'flex-end', maxWidth:'200px' }}>
                  {(r.keywords || []).slice(0, 2).map(kw => (
                    <span key={kw} style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'20px', background:'rgba(139,130,220,0.1)', color:'var(--purple-lt)', border:'1px solid rgba(139,130,220,0.15)', whiteSpace:'nowrap' }}>
                      {kw}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <button
                  onClick={e => { e.stopPropagation(); toggleFavorite(r.id) }}
                  title={r.is_favorite ? 'Remover favorito' : 'Favoritar'}
                  style={{ background:'transparent', fontSize:'18px', color: r.is_favorite ? 'var(--gold)' : 'var(--text3)', padding:'4px', borderRadius:'4px', flexShrink:0 }}
                >
                  {r.is_favorite ? '★' : '☆'}
                </button>

                <span style={{ color:'var(--text3)', fontSize:'13px', transform: expanded === r.id ? 'rotate(180deg)' : 'none', transition:'transform .2s', display:'inline-block', flexShrink:0 }}>▾</span>
              </div>

              {/* Expanded detail */}
              {expanded === r.id && r._detail && (() => {
                let parsed = {}
                try { parsed = JSON.parse(r._detail.interpretation_text.match(/\{[\s\S]*\}/)?.[0] || '{}') } catch {}
                return (
                  <div style={{ borderTop:'1px solid var(--border)', padding:'20px 18px', background:'rgba(0,0,0,0.15)' }}>
                    {/* Cards */}
                    <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'16px' }}>
                      {(JSON.parse(r.cards_json || '[]')).map((c, i) => (
                        <div key={i} style={{ fontSize:'12px', padding:'4px 10px', borderRadius:'var(--radius-sm)', background:'rgba(139,130,220,0.1)', border:'1px solid var(--border)', color:'var(--text2)' }}>
                          {c.name}{c.inverted ? ' ↓' : ''}
                        </div>
                      ))}
                    </div>

                    {/* Synthesis */}
                    {parsed.sintese && (
                      <p style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'16px', lineHeight:1.8, color:'var(--text2)', marginBottom:'12px' }}>
                        {parsed.sintese}
                      </p>
                    )}

                    {/* Advice */}
                    {r._detail.advice && (
                      <div style={{ background:'rgba(201,168,76,0.06)', border:'1px solid rgba(201,168,76,0.18)', borderRadius:'var(--radius-sm)', padding:'12px 16px' }}>
                        <p style={{ fontSize:'11px', color:'var(--gold)', marginBottom:'4px', letterSpacing:'.06em' }}>CONSELHO</p>
                        <p style={{ fontFamily:'Cormorant Garamond, serif', fontStyle:'italic', fontSize:'15px', color:'var(--text)' }}>{r._detail.advice}</p>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display:'flex', justifyContent:'center', gap:'8px', marginTop:'28px' }}>
          <button onClick={() => load(page - 1)} disabled={page === 1} style={{ padding:'8px 16px', background:'var(--bg2)', color:'var(--text2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', fontSize:'13px' }}>
            ← Anterior
          </button>
          <span style={{ padding:'8px 16px', fontSize:'13px', color:'var(--text3)' }}>{page} / {totalPages}</span>
          <button onClick={() => load(page + 1)} disabled={page === totalPages} style={{ padding:'8px 16px', background:'var(--bg2)', color:'var(--text2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', fontSize:'13px' }}>
            Próxima →
          </button>
        </div>
      )}
    </div>
  )
}
