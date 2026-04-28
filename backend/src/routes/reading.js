// src/routes/reading.js
import { Router } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import db from '../db/index.js'
import { authenticate } from '../middleware/authenticate.js'
import { readingLimiter } from '../middleware/limiters.js'
import { validate, readingSchema } from '../validators/schemas.js'
import { AppError } from '../middleware/errorHandler.js'
import { checkPlanLimit, incrementUsage } from '../services/plan.js'
import { buildSystemPrompt, buildUserPrompt } from '../services/promptBuilder.js'

export const readingRouter = Router()

// Segurança: cliente Anthropic instanciado no BACKEND — API key nunca vai ao frontend
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── POST /api/reading — gera nova leitura com streaming ──────────────────────
readingRouter.post(
  '/',
  authenticate,
  readingLimiter,
  validate(readingSchema),
  async (req, res, next) => {
    try {
      const { cards, spreadType, focusArea } = req.validatedBody
      const userId = req.user.id

      // Verifica limite do plano (free = 3/mês)
      await checkPlanLimit(userId, req.user.plan)

      // Busca dados astrológicos do usuário
      const { rows } = await db.query(
        'SELECT sun_sign, moon_sign, rising_sign, plan FROM users WHERE id = $1',
        [userId]
      )
      const user = rows[0]

      // Monta prompts
      const systemPrompt = buildSystemPrompt()
      const userPrompt = buildUserPrompt({ user, cards, spreadType, focusArea })

      // Configura SSE (Server-Sent Events) para streaming
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      res.flushHeaders()

      let fullText = ''

      // Segurança: chamada à IA passa pelo backend (proxy) — nunca expõe a API key
      const stream = anthropic.messages.stream({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      })

      stream.on('text', (text) => {
        fullText += text
        res.write(`data: ${JSON.stringify({ delta: text })}\n\n`)
      })

      stream.on('error', (err) => {
        console.error('Erro no stream Anthropic:', err.message)
        res.write(`data: ${JSON.stringify({ error: 'Erro ao gerar leitura.' })}\n\n`)
        res.end()
      })

      stream.on('finalMessage', async () => {
        try {
          // Extrai JSON da resposta
          const parsed = parseReadingJson(fullText)

          // Salva no banco e incrementa uso
          const readingId = await db.transaction(async (client) => {
            const { rows: inserted } = await client.query(
              `INSERT INTO readings
                (user_id, spread_type, focus_area, cards_json, interpretation_text, title, keywords, advice)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
               RETURNING id`,
              [
                userId, spreadType, focusArea || 'general',
                JSON.stringify(cards), fullText,
                parsed.titulo || null,
                parsed.palavras_chave || [],
                parsed.conselho || null,
              ]
            )
            await incrementUsage(client, userId)
            return inserted[0].id
          })

          res.write(`data: ${JSON.stringify({ done: true, readingId, parsed })}\n\n`)
        } catch (err) {
          console.error('Erro ao salvar leitura:', err.message)
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
        }
        res.end()
      })

    } catch (err) {
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`)
        res.end()
      } else {
        next(err)
      }
    }
  }
)

// ── GET /api/reading — histórico do usuário ──────────────────────────────────
readingRouter.get('/', authenticate, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(20, parseInt(req.query.limit) || 10)
    const offset = (page - 1) * limit

    // Segurança: query parametrizada, sem concatenação
    const { rows } = await db.query(
      `SELECT id, spread_type, focus_area, cards_json, title, keywords, advice,
              is_favorite, created_at
       FROM readings
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    )

    const { rows: countRows } = await db.query(
      'SELECT COUNT(*) FROM readings WHERE user_id = $1',
      [req.user.id]
    )

    res.json({
      readings: rows,
      total: parseInt(countRows[0].count),
      page,
      totalPages: Math.ceil(countRows[0].count / limit),
    })
  } catch (err) {
    next(err)
  }
})

// ── GET /api/reading/:id ──────────────────────────────────────────────────────
readingRouter.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM readings WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id] // Segurança: verifica ownership
    )
    if (!rows[0]) return res.status(404).json({ error: 'Leitura não encontrada.' })
    res.json({ reading: rows[0] })
  } catch (err) {
    next(err)
  }
})

// ── PATCH /api/reading/:id/favorite ──────────────────────────────────────────
readingRouter.patch('/:id/favorite', authenticate, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `UPDATE readings SET is_favorite = NOT is_favorite
       WHERE id = $1 AND user_id = $2
       RETURNING id, is_favorite`,
      [req.params.id, req.user.id]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Leitura não encontrada.' })
    res.json(rows[0])
  } catch (err) {
    next(err)
  }
})

// ── Helper: parse seguro do JSON da IA ───────────────────────────────────────
function parseReadingJson(raw) {
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (!match) return {}
    return JSON.parse(match[0])
  } catch {
    return {}
  }
}
