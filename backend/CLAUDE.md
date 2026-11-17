# Habitse API — convenções

API da vitrine de imóveis (habitse.com.br), construída sobre a base de contas/autenticação do projeto ArcoCRM. Leia antes de alterar código.

## Regra nº 1: procure antes de criar
Antes de criar use case, repositório, helper, enum, erro, validação ou rota, procure (`grep -r "Conceito" src/`) em `src/shared/`, `src/services/`, no módulo do domínio e em `docs/`. Se existir, reutilize ou estenda. Já existe:
- Paginação: `shared/infra/knex/paginate.ts`, `shared/infra/validate/pagination.ts`, `shared/types/Pagination.ts` (`mapPaginated`)
- Filtros Knex sem `undefined`: `shared/infra/knex/compactWhere.ts`
- Auth: `headerAuth()`, `ensureUserType()`, `ensurePermission()` em `shared/infra/http/middleware/Auth.ts`; sessões em `modules/accounts/services/SessionTokenService.ts`
- Auditoria do admin: `modules/audit/services/AuditService.ts`; papéis em `users/index/enums/AdminRole.ts`
- E-mail `EmailService`, WhatsApp (só códigos) `WhatsAppService`, upload `StorageService` + `uploadSingle(kind)`
- Transações: `UnitOfWork` (`KnexUnitOfWork`); Redis: `RedisCache` + `cacheKey(...)` (nunca chaves sem `cacheKey`)
- Testes: `shared/tests/` (`createAccountsTestContext`, `expectAppError`, `fakes/FakeRedis`)

## Domínio da vitrine (`src/modules/listings/`)
- Anúncio = `Listing` (categorias `used`, `off_plan`, `under_construction`; enum e rótulos em `enums/ListingCategory.ts`). Os slugs de URL das categorias ficam em `CATEGORY_INFO` e precisam bater com as rotas do frontend.
- Leitura pública: `useCases/ListingController.ts` + `ListingUseCases.ts`; filtros/ordenação no SQL em `infra/KnexListingRepository.ts` (nunca filtrar em memória); `InMemoryListingRepository` espelha as regras para os testes unitários.
- Só `status = 'published'` é exposto. Rascunho/vendido dá 404.
- Campos por categoria: andamento de obra só em construção; entrega só em planta/construção (aplicado em `Listing.create`).
- Dados de exemplo: `seeds/02_listings_seeder.ts` (fictícios; reconhecidos pelas fotos `/placeholders/`). Nunca apaga anúncio real.

## Estrutura de módulo
`entities/ enums/ dtos/ repositories/ (interfaces) infra/ (Knex + InMemory) mappers/ errors/ services/ policies/ useCases/<acao>/` — controllers finos (`static handle` + `static validate` com Joi), regra no use case, mapper para JSON (nunca devolver entidade crua).

## Checklist de nova funcionalidade
1. Atualize `docs/API.md` e `docs/openapi.yaml`.
2. Migration nova em `src/shared/infra/knex/database/migrations` (`npm run migrate:make nome`); nunca edite migration aplicada; teste up → rollback → up.
3. Entidade/repositório (interface + Knex + InMemory); registre em `src/shared/containers/<dominio>/index.ts`.
4. Use case + controller + rota em `src/shared/infra/http/routes/` (registre em `routes/index.ts`).
5. Teste unitário (`*.spec.ts`) e, se envolver HTTP/banco, caso em `src/tests/integration/*.e2e.spec.ts`.
6. `npx tsc --noEmit`, `npm run lint`, `npm run test:unit`, `npm run test:integration`.

## Padrões
- Erros: `throw new AppError([{ message, uniqueCode: 'DOMINIO:CODIGO' }], status)`. Mensagens em pt-BR.
- Dinheiro: `decimal` no banco, número na API. Colunas em camelCase com aspas; um schema Postgres por área (`users`, `audit`, `listings`).
- Logs com `logger` (pino), nunca `console.log`.
- Volume: listas sempre paginadas e filtradas no banco, sem N+1, filtros frequentes com índice próprio.
- Nunca rode migrations/testes contra bancos remotos. O `.env` aponta para Postgres/Redis locais; o banco de teste precisa ter `test` no nome.
- CORS: em produção `CORS_ORIGINS` lista só o site (habitse.com.br).
