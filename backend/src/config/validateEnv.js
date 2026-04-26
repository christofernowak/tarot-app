// src/config/validateEnv.js
// Falha imediatamente se variáveis obrigatórias estiverem ausentes.
// Evita o app subir com configuração incompleta e comportamento silencioso.

const REQUIRED = [
  'JWT_SECRET',
  'DATABASE_URL',
  'ANTHROPIC_API_KEY',
  'FRONTEND_URL',
]

export function validateEnv() {
  const missing = REQUIRED.filter((key) => !process.env[key])

  if (missing.length > 0) {
    console.error('❌ Variáveis de ambiente obrigatórias ausentes:')
    missing.forEach((key) => console.error(`   - ${key}`))
    console.error('\nCopie .env.example para .env e preencha os valores.')
    process.exit(1)
  }

  // Segurança: JWT_SECRET deve ter pelo menos 32 caracteres
  if (process.env.JWT_SECRET.length < 32) {
    console.error('❌ JWT_SECRET muito curto. Use pelo menos 32 caracteres.')
    console.error('   Gere um seguro: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"')
    process.exit(1)
  }

  console.log('✅ Variáveis de ambiente validadas.')
}
