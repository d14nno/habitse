# Habitse — site de imóveis

Vitrine de imóveis em três categorias — **usados**, **na planta** e **em construção** — pensada primeiro para o celular. Domínio: **habitse.com.br**.

```
backend/    API (Node/TS, Express, Postgres, Redis) — base de contas do ArcoCRM + módulo `listings`
frontend/   Site (Vue 3 + Vite + TypeScript), mobile first
deploy/     PM2 e Caddy da produção
DEPLOY.md   Passo a passo para colocar no ar
```

## Rodar tudo local

```bash
# 1) API (Postgres e Redis rodando — veja backend/README.md)
cd backend && cp .env.example .env && npm ci && npm run migrate:latest && npm run seed:run && npm run dev

# 2) Site (outro terminal). O Vite repassa /api para a API em http://localhost:3900 (ajuste em vite.config.ts se a porta for outra)
cd frontend && npm install && npm run dev      # http://localhost:5180
```

## O que o site tem

- **Início**: busca, as 3 categorias, destaques em carrossel que "gruda" no dedo.
- **Categorias** (`/usados`, `/na-planta`, `/em-construcao`): busca por texto, ordenação, filtros em gaveta (tipo, cidade, bairro, valor, quartos, vagas), filtros na URL (compartilháveis), rolagem infinita, esqueletos de carregamento.
- **Imóvel**: galeria com deslizar e tela cheia, características, andamento da obra e previsão de entrega, barra fixa "Falar no WhatsApp", compartilhar, imóveis parecidos.
- **Favoritos** salvos no aparelho (sem cadastro), barra de navegação inferior, botão flutuante de WhatsApp, SEO (título, descrição, JSON-LD, sitemap) e instalável (manifest).
- Primeiro carregamento ≈ 45 KB de JavaScript comprimido.

## Pendências conhecidas

- Os 18 anúncios são **exemplos fictícios** (ilustrações em vez de fotos). Falta o **painel para cadastrar imóveis e enviar fotos** (a base de contas/admin já está pronta na API).
- Prévia de link por imóvel no WhatsApp/Instagram exige renderização no servidor (próxima etapa).
