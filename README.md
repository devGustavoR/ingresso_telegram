# ingresso_telegram

Bot do Telegram (grammY) para buscar sessões de cinema do Ingresso.com por
estado, cidade, filme, data e cinema — com busca automática por
preferências (idioma, 3D, VIP, namoradeira) e mapa de assentos. Inclui
também uma API REST (Fastify) que expõe os mesmos dados.

## Rodando localmente

```bash
npm install
cp .env.example .env   # preencha BOT_TOKEN e TMDB_API_KEY
npm run bot            # bot do Telegram
npm run dev            # API Fastify
```

## Deploy

Deploy 100% automático via GitHub Actions numa VPS com Docker + Nginx +
certbot. Veja [DEPLOY.md](DEPLOY.md) para o passo a passo e os secrets
necessários.
