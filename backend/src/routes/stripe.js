// src/routes/stripe.js
import { Router } from 'express'
import Stripe from 'stripe'
import { authenticate } from '../middleware/authenticate.js'
import db from '../db/index.js'
import { AppError } from '../middleware/errorHandler.js'

export const stripeRouter = Router()

// Segurança: Stripe inicializado com chave secreta do backend
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
})

// ── POST /api/stripe/checkout — cria sessão de checkout ──────────────────────
stripeRouter.post('/checkout', authenticate, async (req, res, next) => {
  try {
    if (req.user.plan === 'premium') {
      throw new AppError('Você já possui o plano Premium.', 400)
    }

    // Cria ou recupera customer no Stripe
    let customerId = req.user.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: req.user.name,
        metadata: { userId: req.user.id },
      })
      customerId = customer.id
      await db.query(
        'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
        [customerId, req.user.id]
      )
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: process.env.STRIPE_PREMIUM_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/planos?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/planos?canceled=true`,
      metadata: { userId: req.user.id },
    })

    res.json({ url: session.url })
  } catch (err) {
    next(err)
  }
})

// ── POST /api/stripe/portal — portal de gerenciamento ───────────────────────
stripeRouter.post('/portal', authenticate, async (req, res, next) => {
  try {
    if (!req.user.stripe_customer_id) {
      throw new AppError('Nenhuma assinatura encontrada.', 404)
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: req.user.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/conta`,
    })

    res.json({ url: session.url })
  } catch (err) {
    next(err)
  }
})

// ── POST /api/stripe/webhook — eventos do Stripe ────────────────────────────
// Nota: este endpoint recebe o body RAW (configurado no server.js)
stripeRouter.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature']

  let event
  try {
    // Segurança: verifica assinatura do webhook para garantir que veio do Stripe
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).json({ error: 'Assinatura inválida.' })
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object
        const customerId = sub.customer

        const { rows } = await db.query(
          'SELECT id FROM users WHERE stripe_customer_id = $1',
          [customerId]
        )
        if (!rows[0]) break

        const userId = rows[0].id
        const isActive = ['active', 'trialing'].includes(sub.status)

        await db.transaction(async (client) => {
          await client.query(
            `UPDATE users SET plan = $1 WHERE id = $2`,
            [isActive ? 'premium' : 'free', userId]
          )
          await client.query(
            `INSERT INTO subscriptions
              (user_id, stripe_subscription_id, stripe_price_id, status,
               current_period_start, current_period_end, cancel_at_period_end)
             VALUES ($1,$2,$3,$4,$5,$6,$7)
             ON CONFLICT (stripe_subscription_id)
             DO UPDATE SET
               status = EXCLUDED.status,
               current_period_start = EXCLUDED.current_period_start,
               current_period_end = EXCLUDED.current_period_end,
               cancel_at_period_end = EXCLUDED.cancel_at_period_end`,
            [
              userId, sub.id, sub.items.data[0]?.price?.id, sub.status,
              new Date(sub.current_period_start * 1000),
              new Date(sub.current_period_end * 1000),
              sub.cancel_at_period_end,
            ]
          )
        })
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object
        const { rows } = await db.query(
          'SELECT id FROM users WHERE stripe_customer_id = $1',
          [sub.customer]
        )
        if (rows[0]) {
          await db.query(
            `UPDATE users SET plan = 'free' WHERE id = $1`,
            [rows[0].id]
          )
        }
        break
      }
    }

    res.json({ received: true })
  } catch (err) {
    console.error('Erro ao processar webhook:', err.message)
    // Retorna 200 para o Stripe não retentar (erro foi interno, não do payload)
    res.json({ received: true })
  }
})
