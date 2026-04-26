// src/routes/plan.js
import { Router } from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { getUsageInfo } from '../services/plan.js'

export const planRouter = Router()

// GET /api/plan/usage — retorna uso atual do plano
planRouter.get('/usage', authenticate, async (req, res, next) => {
  try {
    const usage = await getUsageInfo(req.user.id, req.user.plan)
    res.json({ plan: req.user.plan, ...usage })
  } catch (err) {
    next(err)
  }
})
