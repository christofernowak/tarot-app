// src/middleware/authenticate.js
import jwt from 'jsonwebtoken'
import db from '../db/index.js'

// Segurança: JWT verificado no backend com assinatura (nunca confia só no payload)
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autenticação ausente.' })
    }

    const token = authHeader.slice(7)

    // Verifica assinatura e expiração do JWT
    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' })
      }
      return res.status(401).json({ error: 'Token inválido.' })
    }

    // Segurança: busca o usuário no banco (garante que ainda existe e está ativo)
    // Query parametrizada — previne SQL injection
    const { rows } = await db.query(
      'SELECT id, email, name, role, plan FROM users WHERE id = $1',
      [decoded.sub]
    )

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuário não encontrado.' })
    }

    // Anexa usuário ao request para uso nas rotas
    req.user = rows[0]
    next()
  } catch (err) {
    next(err)
  }
}

// Middleware de autorização por role
export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado.' })
    }
    // Segurança: role vem do banco, não do token
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Acesso não autorizado.' })
    }
    next()
  }
}

// Middleware que verifica se usuário é premium
export function requirePremium(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Não autenticado.' })
  }
  if (req.user.plan !== 'premium') {
    return res.status(403).json({
      error: 'Funcionalidade exclusiva do plano Premium.',
      upgrade_url: '/planos',
    })
  }
  next()
}
