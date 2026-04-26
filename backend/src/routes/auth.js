// src/routes/auth.js
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db/index.js'
import { authLimiter } from '../server.js'
import { validate, registerSchema, loginSchema } from '../validators/schemas.js'
import { AppError } from '../middleware/errorHandler.js'
import { calculateSunSign } from '../services/astrology.js'

export const authRouter = Router()

// ── POST /api/auth/register ───────────────────────────────────────────────────
authRouter.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  async (req, res, next) => {
    try {
      const { name, email, password, birth_date, birth_time, birth_city } = req.validatedBody

      // Verifica se email já existe (query parametrizada)
      const existing = await db.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      )
      if (existing.rows.length > 0) {
        // Segurança: mensagem genérica para não confirmar que o email existe
        throw new AppError('Não foi possível criar a conta com estes dados.', 409)
      }

      // Segurança: hash bcrypt com custo 12
      const password_hash = await bcrypt.hash(password, 12)

      // Calcula signo se tiver data de nascimento
      const sun_sign = birth_date ? calculateSunSign(birth_date) : null

      const { rows } = await db.query(
        `INSERT INTO users (name, email, password_hash, birth_date, birth_time, birth_city, sun_sign)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, name, email, plan, sun_sign`,
        [name, email, password_hash, birth_date || null, birth_time || null, birth_city || null, sun_sign]
      )

      const user = rows[0]
      const token = generateToken(user.id)

      res.status(201).json({ token, user: sanitizeUser(user) })
    } catch (err) {
      next(err)
    }
  }
)

// ── POST /api/auth/login ──────────────────────────────────────────────────────
authRouter.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  async (req, res, next) => {
    try {
      const { email, password } = req.validatedBody

      const { rows } = await db.query(
        'SELECT id, email, name, password_hash, role, plan, sun_sign FROM users WHERE email = $1',
        [email]
      )

      const user = rows[0]

      // Segurança: compara hash mesmo se usuário não existe (previne timing attacks)
      const passwordMatch = user
        ? await bcrypt.compare(password, user.password_hash)
        : await bcrypt.compare(password, '$2a$12$invalidhashjustfortimingatack')

      if (!user || !passwordMatch) {
        throw new AppError('Email ou senha incorretos.', 401)
      }

      const token = generateToken(user.id)

      res.json({ token, user: sanitizeUser(user) })
    } catch (err) {
      next(err)
    }
  }
)

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
import { authenticate } from '../middleware/authenticate.js'

authRouter.get('/me', authenticate, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT id, name, email, role, plan, birth_date, birth_time, birth_city,
              sun_sign, moon_sign, rising_sign, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Usuário não encontrado.' })
    res.json({ user: sanitizeUser(rows[0]) })
  } catch (err) {
    next(err)
  }
})

// ── Helpers ───────────────────────────────────────────────────────────────────
function generateToken(userId) {
  return jwt.sign(
    { sub: userId },            // sub = subject (ID do usuário)
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d', algorithm: 'HS256' }
  )
}

// Segurança: nunca retorna password_hash para o cliente
function sanitizeUser(user) {
  const { password_hash, ...safe } = user
  return safe
}
