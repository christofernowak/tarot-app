// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy: todas as chamadas /api vão para o backend
    // Segurança: o frontend NUNCA faz chamadas diretas à Anthropic ou Stripe
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  // Segurança: variáveis sem VITE_ não são expostas ao bundle
  // NUNCA coloque ANTHROPIC_API_KEY ou STRIPE_SECRET_KEY aqui
})
