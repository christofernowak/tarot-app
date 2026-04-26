// src/services/plan.js
import db from '../db/index.js'
import { AppError } from '../middleware/errorHandler.js'

const FREE_MONTHLY_LIMIT = 3

// Verifica se usuário gratuito ainda tem leituras disponíveis
export async function checkPlanLimit(userId, plan) {
  if (plan === 'premium') return // premium não tem limite

  const yearMonth = getCurrentYearMonth()

  const { rows } = await db.query(
    `SELECT reading_count FROM monthly_usage
     WHERE user_id = $1 AND year_month = $2`,
    [userId, yearMonth]
  )

  const count = rows[0]?.reading_count || 0

  if (count >= FREE_MONTHLY_LIMIT) {
    throw new AppError(
      `Você atingiu o limite de ${FREE_MONTHLY_LIMIT} leituras gratuitas este mês. Faça upgrade para o plano Premium para leituras ilimitadas.`,
      403
    )
  }
}

// Incrementa contador de uso (chamado dentro de transaction)
export async function incrementUsage(client, userId) {
  const yearMonth = getCurrentYearMonth()

  // UPSERT: cria ou incrementa registro de uso
  await client.query(
    `INSERT INTO monthly_usage (user_id, year_month, reading_count)
     VALUES ($1, $2, 1)
     ON CONFLICT (user_id, year_month)
     DO UPDATE SET reading_count = monthly_usage.reading_count + 1`,
    [userId, yearMonth]
  )
}

// Retorna uso atual e limite do usuário
export async function getUsageInfo(userId, plan) {
  if (plan === 'premium') {
    return { used: null, limit: null, isPremium: true }
  }

  const yearMonth = getCurrentYearMonth()
  const { rows } = await db.query(
    `SELECT reading_count FROM monthly_usage
     WHERE user_id = $1 AND year_month = $2`,
    [userId, yearMonth]
  )

  const used = rows[0]?.reading_count || 0
  return { used, limit: FREE_MONTHLY_LIMIT, remaining: FREE_MONTHLY_LIMIT - used, isPremium: false }
}

function getCurrentYearMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}
