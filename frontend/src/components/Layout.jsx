// src/components/Layout.jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../lib/store.js'

export function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const navStyle = (active) => ({
    fontSize: '13px',
    color: active ? 'var(--gold-lt)' : 'var(--text2)',
    padding: '6px 12px',
    borderRadius: 'var(--radius-sm)',
    background: active ? 'rgba(201,168,76,0.1)' : 'transparent',
    border: active ? '1px solid rgba(201,168,76,0.2)' : '1px solid transparent',
    transition: 'all .15s',
    fontWeight: active ? 500 : 400,
  })

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      {/* Navbar */}
      <nav style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'12px 24px',
        borderBottom:'1px solid var(--border)',
        background:'var(--bg2)',
        position:'sticky', top:0, zIndex:100,
      }}>
        <NavLink to="/" style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'22px', color:'var(--gold-lt)', fontWeight:500 }}>
          ✦ Mística
        </NavLink>

        <div style={{ display:'flex', gap:'4px', alignItems:'center' }}>
          <NavLink to="/"           style={({isActive})=>navStyle(isActive)}>Início</NavLink>
          <NavLink to="/leitura"    style={({isActive})=>navStyle(isActive)}>Leitura</NavLink>
          <NavLink to="/historico"  style={({isActive})=>navStyle(isActive)}>Histórico</NavLink>
          <NavLink to="/planos"     style={({isActive})=>navStyle(isActive)}>Planos</NavLink>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          {user?.plan === 'premium' && (
            <span style={{ fontSize:'11px', padding:'3px 10px', borderRadius:'20px', background:'rgba(201,168,76,0.15)', color:'var(--gold)', border:'1px solid rgba(201,168,76,0.3)' }}>
              ✦ Premium
            </span>
          )}
          <NavLink to="/perfil" style={({isActive})=>navStyle(isActive)}>{user?.name?.split(' ')[0] || 'Perfil'}</NavLink>
          <button onClick={handleLogout} style={{ background:'transparent', color:'var(--text3)', fontSize:'13px', padding:'6px 10px', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)' }}>
            Sair
          </button>
        </div>
      </nav>

      <main style={{ flex:1, padding:'32px 24px', maxWidth:'1100px', margin:'0 auto', width:'100%' }}>
        <Outlet />
      </main>
    </div>
  )
}
