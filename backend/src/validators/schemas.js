// src/validators/schemas.js
import { z } from 'zod'

// ── Autenticação ──────────────────────────────────────────────────────────────
export const registerSchema = z.object({
  name: z.string().min(2, 'Nome muito curto').max(100).trim(),
  email: z.string().email('Email inválido').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Senha deve ter ao menos 8 caracteres')
    .max(128, 'Senha muito longa')
    .regex(/[A-Z]/, 'Deve ter ao menos uma letra maiúscula')
    .regex(/[0-9]/, 'Deve ter ao menos um número'),
  birth_date: z.string().date('Data inválida (use YYYY-MM-DD)').optional(),
  birth_time: z.string().regex(/^\d{2}:\d{2}$/, 'Hora inválida (use HH:MM)').optional(),
  birth_city: z.string().max(200).trim().optional(),
})

export const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
})

// ── Leituras ─────────────────────────────────────────────────────────────────
const cardSchema = z.object({
  name: z.string().min(1).max(100),
  number: z.string().max(10),
  symbol: z.string().max(10),
  keyword: z.string().max(100),
  inverted: z.boolean(),
  position: z.string().max(50),
})

export const readingSchema = z.object({
  cards: z.array(cardSchema).min(1).max(10),
  spreadType: z.enum(['day', 'trio', 'celtic', 'horseshoe', 'year']),
  focusArea: z.enum(['general', 'love', 'family', 'money', 'health', 'career']).optional(),
})

// ── Atualização de perfil ────────────────────────────────────────────────────
export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  birth_date: z.string().date().optional(),
  birth_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  birth_city: z.string().max(200).trim().optional(),
}).strict() // .strict() rejeita campos extras não declarados

// Middleware helper para validar com Zod
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return res.status(400).json({
        error: 'Dados inválidos.',
        details: result.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      })
    }
    req.validatedBody = result.data
    next()
  }
}
