// Adicionar ao src/routes/auth.js — rota PATCH /auth/me
// (inclua este bloco ao final do arquivo auth.js existente)

import { updateProfileSchema } from '../validators/schemas.js'

authRouter.patch('/me', authenticate, validate(updateProfileSchema), async (req, res, next) => {
  try {
    const updates = req.validatedBody
    const fields  = Object.keys(updates)
    if (fields.length === 0) return res.json({ user: req.user })

    // Reconstrói query dinamicamente de forma segura (sem concatenação)
    const setClauses = fields.map((f, i) => `${f} = $${i + 1}`)
    const values     = fields.map(f => updates[f])
    values.push(req.user.id)

    // Recalcula signo solar se mudou a data de nascimento
    if (updates.birth_date) {
      const { calculateSunSign } = await import('../services/astrology.js')
      const sun_sign = calculateSunSign(updates.birth_date)
      setClauses.push(`sun_sign = $${values.length}`)
      values.splice(values.length - 1, 0, sun_sign) // insere antes do id
    }

    const { rows } = await db.query(
      `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${values.length}
       RETURNING id, name, email, role, plan, birth_date, birth_time, birth_city, sun_sign, moon_sign, rising_sign`,
      values
    )

    res.json({ user: rows[0] })
  } catch (err) {
    next(err)
  }
})
