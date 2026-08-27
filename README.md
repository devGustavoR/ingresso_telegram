<p align="center">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white" />
  <img src="https://img.shields.io/badge/Fastify-000000?style=for-the-badge&logo=fastify&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
</p>

<h1 align="center">🎬 ingresso_telegram</h1>

<p align="center">
  Bot do Telegram para buscar sessões de cinema — escolha filme, data, cinema e assento direto na conversa.
</p>

<p align="center">
  <img src="https://img.shields.io/github/license/devGustavoR/ingresso_telegram?style=flat-square" />
  <img src="https://img.shields.io/github/last-commit/devGustavoR/ingresso_telegram?style=flat-square" />
  <img src="https://img.shields.io/github/languages/top/devGustavoR/ingresso_telegram?style=flat-square" />
</p>

---

## 📋 Índice

- [Sobre](#-sobre)
- [Funcionalidades](#-funcionalidades)
- [Demonstração](#-demonstração)
- [Tecnologias](#-tecnologias)
- [Como rodar](#-como-rodar)
- [Deploy](#-deploy)
- [Estrutura do projeto](#-estrutura-do-projeto)
- [Autor](#-autor)

---

## 💡 Sobre

Em vez de abrir o site, navegar por menus e filtrar manualmente — você faz tudo isso numa conversa no Telegram, com botões e respostas rápidas.

O projeto é composto por dois processos independentes:
- **Bot** (`grammY`) — fluxo guiado por botões inline com sessão persistida por usuário
- **API REST** (`Fastify`) — endpoints auxiliares que expõem os dados de filmes, sessões e salas

---

## ✨ Funcionalidades

- 🗺️ Seleção de **Estado → Cidade → Filme → Data → Cinema → Sessão**
- 🔍 Busca de filme por **texto livre**
- ⚙️ **Modo automático** — filtra sessões por idioma, 3D, VIP e namoradeira
- 🪑 **Mapa de assentos** visual na conversa
- 🎥 **Pôster do filme** via integração com TMDB
- 💾 **Sessão persistida** — cada usuário tem seu estado de navegação salvo
- 🚀 Deploy automático via **GitHub Actions + Docker + Nginx**

---

## 🎥 Demonstração

> _Em breve: gif do bot em funcionamento_

---

## 🛠️ Tecnologias

| Tecnologia | Uso |
|---|---|
| Node.js + TypeScript (ESM) | Base do projeto |
| [grammY](https://grammy.dev/) | Framework do bot Telegram |
| Fastify | API REST auxiliar |
| @grammyjs/storage-file | Persistência de sessão por usuário |
| TMDB API | Pôsteres dos filmes |
| Docker + Docker Compose | Containerização |
| GitHub Actions | CI/CD automático |
| Nginx + Certbot | Proxy reverso + SSL |

---

## 🚀 Como rodar

### Pré-requisitos

- Node.js 20+
- Docker e Docker Compose
- Token do bot Telegram (`@BotFather`)
- Chave da API do TMDB

### Instalação

```bash
# Clone o repositório
git clone https://github.com/devGustavoR/ingresso_telegram.git
cd ingresso_telegram

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com seu BOT_TOKEN e TMDB_API_KEY
```

### Rodando localmente

```bash
# Rodar o bot
npm run bot

# Rodar a API Fastify
npm run dev
```

### Rodando com Docker

```bash
docker compose up -d
```

---

## 📦 Deploy

Deploy 100% automático via GitHub Actions numa VPS com Docker + Nginx + Certbot.

Consulte o [DEPLOY.md](./DEPLOY.md) para o passo a passo completo e os secrets necessários.

---

## 📁 Estrutura do projeto

```
ingresso_telegram/
├── bot/              # Handlers e mapa de assentos
├── routes/           # Endpoints da API Fastify
├── services/         # Integrações (Ingresso + TMDB)
├── sessions/         # Sessões persistidas por usuário (.json)
├── types/            # Tipagens TypeScript
├── bot.ts            # Ponto de entrada do bot
├── server.ts         # Ponto de entrada da API
├── Dockerfile
├── docker-compose.yml
└── DEPLOY.md
```

---

## 👨‍💻 Autor

Feito por **Gustavo Ribeiro**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/devgustavor)
[![Portfolio](https://img.shields.io/badge/Portfolio-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://devgustavor.com.br)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/devGustavoR)
