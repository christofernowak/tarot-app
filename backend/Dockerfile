# backend/Dockerfile
FROM node:22-alpine AS base
WORKDIR /app

# Instala dependências primeiro (layer cache)
COPY package*.json ./
RUN npm ci --only=production

# Copia código-fonte
COPY src/ ./src/

# Segurança: não roda como root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3001
CMD ["node", "src/server.js"]
