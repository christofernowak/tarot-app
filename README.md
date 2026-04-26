# ✦ Mística — App de Tarô com IA

Aplicação web full-stack de leitura de tarô com interpretação por IA (Claude),
dados astrológicos e modelo freemium com Stripe.

## Stack

- **Frontend**: React + Vite + React Router + Zustand
- **Backend**: Node.js + Express + PostgreSQL
- **IA**: Anthropic Claude API (proxy no backend)
- **Pagamentos**: Stripe (subscriptions + webhook)
- **Infra**: Docker Compose (Postgres + Redis + Nginx)

---

## Instalação local

### 1. Clone e configure variáveis de ambiente

```bash
git clone <repo>
cd tarot-app

# Backend
cp .env.example .env
# Edite .env com suas chaves reais
```

### 2. Instale dependências

```bash
cd backend  && npm install
cd ../frontend && npm install
```

### 3. Suba o banco com Docker

```bash
docker compose up postgres -d
```

### 4. Execute as migrations

```bash
cd backend
node src/db/migrate.js
# ou execute manualmente:
# psql $DATABASE_URL -f src/db/migrations/001_initial_schema.sql
```

### 5. Inicie os servidores

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Acesse: http://localhost:5173

---

## Variáveis obrigatórias

| Variável | Onde obter |
|---|---|
| `JWT_SECRET` | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `DATABASE_URL` | PostgreSQL local ou Supabase |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com |
| `STRIPE_SECRET_KEY` | https://dashboard.stripe.com |
| `STRIPE_WEBHOOK_SECRET` | `stripe listen --forward-to localhost:3001/api/stripe/webhook` |
| `STRIPE_PREMIUM_PRICE_ID` | Dashboard Stripe → Produtos |
| `FRONTEND_URL` | `http://localhost:5173` em dev |

---

## Webhook do Stripe (desenvolvimento)

```bash
npm install -g stripe
stripe login
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

---

## Deploy com Docker

```bash
# Configure .env com valores de produção
docker compose up --build -d
```

---

## Estrutura do projeto

```
tarot-app/
├── .env.example          # Template de variáveis (seguro para commitar)
├── .gitignore            # .env nunca vai para o git
├── docker-compose.yml    # Sem senhas hardcoded
├── backend/
│   ├── src/
│   │   ├── server.js     # Express + Helmet + CORS + Rate limit
│   │   ├── config/       # Validação de env vars
│   │   ├── db/           # Pool PostgreSQL + migrations
│   │   ├── middleware/   # Auth JWT + error handler
│   │   ├── routes/       # auth, reading, sign, plan, stripe
│   │   ├── services/     # promptBuilder, plan, astrology
│   │   └── validators/   # Schemas Zod
│   └── Dockerfile
└── frontend/
    ├── src/
    │   ├── lib/          # api.js (proxy), store.js (Zustand), deck.js
    │   ├── components/   # Layout, navbar
    │   └── pages/        # Login, Register, Home, Reading, History, Plans, Profile
    ├── vite.config.js    # Proxy /api → backend
    └── Dockerfile
```

---

## Checklist de segurança implementado

- ✅ Nenhuma chave privada com prefixo `VITE_` exposta no frontend
- ✅ `.env` no `.gitignore`; `.env.example` sem valores reais
- ✅ JWT verificado no backend com assinatura
- ✅ Bcrypt custo 12 para senhas; timing-safe na comparação
- ✅ Todas as API routes verificam autenticação
- ✅ Autorização por ownership em todas as queries de leitura
- ✅ Queries parametrizadas — zero concatenação de SQL
- ✅ IDs públicos são UUIDs (sem enumeration attacks)
- ✅ CORS configurado com origem específica (não `*`)
- ✅ Rate limiting: global + auth + reading
- ✅ Helmet com CSP ativo
- ✅ Erros não expõem stack trace em produção
- ✅ Webhook Stripe validado por assinatura
- ✅ Zod em todos os inputs de API
- ✅ Chamadas à Anthropic passam pelo backend (API key nunca no frontend)
- ✅ Docker sem senhas hardcoded; Nginx com headers de segurança
- ✅ Container backend roda como usuário não-root
