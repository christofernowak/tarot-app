// src/db/index.js
import pg from 'pg'

const { Pool } = pg

// Pool de conexões — nunca criar uma nova conexão por request
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },  // ← sempre false, sem condição
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

pool.on('error', (err) => {
  console.error('Erro inesperado no pool de banco de dados:', err.message)
})

// Helper para queries parametrizadas — previne SQL injection
export const db = {
  query: (text, params) => pool.query(text, params),
  
  // Helper para transações
  async transaction(fn) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const result = await fn(client)
      await client.query('COMMIT')
      return result
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  },
}

export default db
