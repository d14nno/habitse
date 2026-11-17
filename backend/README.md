# Habitse — API

Node + TypeScript + Express + Knex/Postgres + Redis. Base de contas/autenticação herdada do ArcoCRM; domínio novo: vitrine de imóveis (`src/modules/listings`).

## Rodar local
```bash
cp .env.example .env            # ajuste DATABASE_URL / REDIS_CACHE_URI / HASH_AUTH_SECRET
npm ci
npm run migrate:latest
npm run seed:run                # admin@app.dev / 12345678 + 18 anúncios de exemplo
npm run dev                     # http://localhost:3900 (Swagger em /docs)
```
Postgres e Redis: `docker compose up -d` ou `npm run db:embedded` (sem Docker).

## Testes
```bash
npm run test:unit
npm run test:integration        # usa o banco *_test (recriado a cada execução)
```

## Produção
Veja [`../DEPLOY.md`](../DEPLOY.md). Resumo: `npm ci && npm run build && npm run migrate:latest`, depois `pm2 start ecosystem.config.cjs` atrás do Caddy (HTTPS automático).
