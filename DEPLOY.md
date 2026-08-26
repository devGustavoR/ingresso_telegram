# Deploy — 100% automático via GitHub Actions

A cada push na `main`, o workflow `.github/workflows/deploy.yml` faz tudo
sozinho, sem precisar entrar na VPS:

1. Copia o código pra `/opt/ingresso_telegram` via `rsync` (não usa `git`
   na VPS, então não precisa de chave de deploy separada lá).
2. Escreve o `.env` com os secrets do GitHub.
3. Builda a imagem e sobe **dois containers**: `bot` (bot do Telegram,
   long polling, sem porta exposta) e `api` (API Fastify, só em
   `127.0.0.1:3000`).
4. Na primeira vez, cria o vhost da API no Nginx e roda o certbot pra
   emitir o certificado HTTPS.

Pressupõe Docker, Nginx e certbot já instalados na VPS (mesmo padrão do
`niver_amor`).

Domínio da API: `cine.devgustavor.com.br`.

## O que falta configurar (tudo pela web, nada na VPS)

Repositório: [devGustavoR/ingresso_telegram](https://github.com/devGustavoR/ingresso_telegram)
— já criado e com o primeiro commit enviado.

### 1. Secrets do GitHub (Settings → Secrets and variables → Actions)

| Secret | Valor |
|---|---|
| `VPS_HOST` | IP ou host da sua VPS |
| `VPS_USER` | usuário SSH com acesso a Docker/Nginx/certbot |
| `VPS_SSH_KEY` | chave privada SSH (a pública precisa estar em `~/.ssh/authorized_keys` do usuário acima na VPS) |
| `BOT_TOKEN` | o mesmo do `.env` local (gerado pelo @BotFather) |
| `TMDB_API_KEY` | o mesmo do `.env` local |

Esses secrets são por repositório — mesmo que a VPS seja compartilhada
com outros projetos (como o `niver_amor`), precisam ser cadastrados de
novo aqui.

**Importante:** o `BOT_TOKEN` e a `TMDB_API_KEY` que estavam no `.env`
local já passaram por texto puro fora de controle de versão. Considere
gerar um novo `BOT_TOKEN` no @BotFather (`/revoke`) antes de publicar,
já que o valor atual pode ter sido exposto.

### 2. DNS

`cine.devgustavor.com.br` precisa de um registro **A** apontando pro IP da VPS
antes do certbot conseguir emitir o certificado. Se o DNS ainda não
estiver propagado no primeiro deploy, o passo de HTTPS falha
silenciosamente (não quebra o resto) e tenta de novo automaticamente no
próximo push depois que o DNS propagar.

## Depois disso

É só dar `git push` na `main` — o resto é automático. Pra acompanhar, vai
em **Actions** no GitHub.

## Rodando localmente (sem Docker)

```bash
npm install
npm run bot   # roda o bot (tsx watch bot.ts)
npm run dev   # roda a API Fastify (tsx watch server.ts)
```

## Rodando localmente com Docker

```bash
cp .env.example .env   # preencha BOT_TOKEN e TMDB_API_KEY
docker compose up --build
```
