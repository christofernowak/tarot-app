// src/middleware/errorHandler.js
// Segurança: erros em produção NUNCA expõem detalhes internos (stack trace, queries, etc.)

export function errorHandler(err, req, res, next) {
  // Log completo internamente (para o dev)
  const isDev = process.env.NODE_ENV === 'development'

  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} — ${err.message}`)
  if (isDev) console.error(err.stack)

  // CORS error
  if (err.message?.startsWith('CORS bloqueado')) {
    return res.status(403).json({ error: 'Origem não permitida.' })
  }

  // Erros de validação Zod
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Dados inválidos.',
      details: isDev ? err.errors : err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    })
  }

  // Erro de JWT (captura adicional)
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Token inválido.' })
  }

  // Segurança: erro genérico para produção — não vaza detalhes internos
  const statusCode = err.statusCode || err.status || 500
  res.status(statusCode).json({
    error: isDev ? err.message : 'Erro interno do servidor.',
    ...(isDev && { stack: err.stack }),
  })
}

// Helper para criar erros HTTP com statusCode
export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message)
    this.statusCode = statusCode
  }
}
