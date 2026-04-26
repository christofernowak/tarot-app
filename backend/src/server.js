// src/server.js
import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'

import { authRouter } from './routes/auth.js'
import { readingRouter } from './routes/reading.js'
import { signRouter } from './routes/sign.js'
import { planRouter } from './routes/plan.js'
import { stripeRouter } from './routes/stripe.js'
import { errorHandler } from './middleware/errorHandler.js'
import { validateEnv } from './config/validateEnv.js'

// Valida variáveis de ambiente obrigatórias antes de iniciar
validateEnv()

const app = express()
const PORT = process.env.PORT || 3001

// ── Segurança: headers HTTP seguros ──────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}))

// ── Segurança: CORS com origem específica (não '*') ───────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL,
  // adicione outros domínios confiáveis aqui
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    // Permite requests sem origin (ex: mobile apps, curl local em dev)
    if (!origin && process.env.NODE_ENV === 'development') return callback(null, true)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS bloqueado para origem: ${origin}`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ── Rate limiting global ──────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
})
app.use(globalLimiter)

// ── Rate limiting restrito para autenticação ──────────────────────────────────
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // máx 10 tentativas de login por 15 min por IP
  message: { error: 'Muitas tentativas de login. Aguarde 15 minutos.' },
  skipSuccessfulRequests: true,
})

// ── Rate limiting para geração de leituras (custo de IA) ─────────────────────
export const readingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20,
  keyGenerator: (req) => req.user?.id || req.ip, // por usuário se autenticado
  message: { error: 'Limite de leituras por hora atingido.' },
})

// ── Body parsing ─────────────────────────────────────────────────────────────
// Rota de webhook do Stripe precisa do body RAW (antes do json parser)
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }))
app.use(express.json({ limit: '10kb' })) // limite para evitar body bombs

// ── Rotas ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter)
app.use('/api/reading', readingRouter)
app.use('/api/sign', signRouter)
app.use('/api/plan', planRouter)
app.use('/api/stripe', stripeRouter)

// ── Health check público ─────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

// ── Segurança: erros não expõem stack trace em produção ───────────────────────
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`✨ Tarot API rodando na porta ${PORT} [${process.env.NODE_ENV}]`)
})

export default app
