# syntax=docker/dockerfile:1

FROM node:22-alpine AS base

# ---- deps (todas, para buildar) ----
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- deps de produção (sem devDependencies) ----
FROM base AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- builder ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- runner ----
# Mesma imagem serve o bot (long polling) e a API Fastify — o comando é
# escolhido no docker-compose.yml (dist/bot.js ou dist/server.js).
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 appuser

COPY --from=prod-deps --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/package.json ./package.json

# diretório onde a sessão de cada usuário do bot é persistida (montado como
# volume no docker-compose para sobreviver a rebuilds/restarts)
RUN mkdir -p sessions && chown appuser:nodejs sessions

USER appuser
EXPOSE 3000

CMD ["node", "dist/server.js"]
