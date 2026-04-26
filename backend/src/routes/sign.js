// src/routes/sign.js
import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { SIGNS_DATA } from '../services/astrology.js'
import db from '../db/index.js'

export const signRouter = Router()

// GET /api/sign/me — dados astrológicos do usuário autenticado
signRouter.get('/me', authenticate, async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT sun_sign, moon_sign, rising_sign FROM users WHERE id = $1',
      [req.user.id]
    )
    const user = rows[0]
    const sunData = user.sun_sign ? SIGNS_DATA[user.sun_sign] : null

    res.json({
      sun_sign:    user.sun_sign,
      moon_sign:   user.moon_sign,
      rising_sign: user.rising_sign,
      sun_data:    sunData,
      // Dados lunares/ascendente só para premium
      moon_data:   req.user.plan === 'premium' && user.moon_sign
        ? SIGNS_DATA[user.moon_sign] : null,
      rising_data: req.user.plan === 'premium' && user.rising_sign
        ? SIGNS_DATA[user.rising_sign] : null,
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/sign/:name — dados de um signo específico (público)
signRouter.get('/:name', (req, res) => {
  const name = req.params.name
  const data = SIGNS_DATA[name]
  if (!data) return res.status(404).json({ error: 'Signo não encontrado.' })
  res.json({ sign: name, ...data })
})
