# Habitse API — contrato com o site

Contrato completo (parâmetros, respostas, contas, sessões e painel) em [`openapi.yaml`](./openapi.yaml). Com a API rodando: Swagger UI em `/docs`.

Erros: `{ errors: [{ message, uniqueCode }] }` (mensagens em pt-BR). Validação de entrada: `400` com `code` `validateRequest.<segmento>`.

## Vitrine pública (sem login)

Só anúncios `published` aparecem. Limite: 240 requisições/min por IP.

| Método | Rota | Parâmetros | Resposta |
|---|---|---|---|
| GET | `/listings` | `category` (`used`\|`off_plan`\|`under_construction`), `type`, `city`, `neighborhood`, `minPrice`, `maxPrice`, `bedrooms` (mínimo), `parking` (mínimo), `featured`, `q` (busca sem acento em título/bairro/cidade/construtora), `sort` (`recent`\|`price_asc`\|`price_desc`\|`area_desc`), `page`, `perPage` (máx. 100) | `{ data: ListingCard[], pagination }` |
| GET | `/listings/facets` | `category?` | `{ categories, cities, neighborhoods, types, price: { min, max } }` — opções dos filtros |
| GET | `/listings/:slug` | — | `ListingDetail` (fotos, descrição, diferenciais, `related` com até 4 parecidos) · 404 `LISTING:NOT_FOUND` |
| GET | `/listings/permutas/catalog` | — | `{ catalog: { version, items: ListingDetail[] }, places: { [slug]: { lat, lng, approx } } }` — permutas/usados editados no painel (o site troca as do arquivo por estas quando houver alguma; cache de 60 s) |
| GET | `/sitemap.xml` | — | XML com início, categorias e cada imóvel publicado (usa `SITE_URL`) |

### Anúncio (`ListingCard`)

`id, slug, title, category, categoryLabel, categorySlug (usados|na-planta|em-construcao), type, price (null = sob consulta), city, state, neighborhood, bedrooms, suites, bathrooms, parking, area (m²), cover, photoCount, developer, deliveryDate (YYYY-MM), constructionProgress (0–100, só em construção), featured`.

`ListingDetail` acrescenta `address, description, features[], photos[], updatedAt, related[]`.

Regras: `constructionProgress` só existe em `under_construction`; `deliveryDate` só em planta/construção. Ordem padrão: destaques primeiro, depois mais recentes; preço/área nulos vão para o fim.

## Contas, sessões e painel administrativo

Herdados da base (cadastro, login com 2FA, refresh token, verificação de e-mail/telefone, recuperação de senha, administradores, auditoria). Ainda sem uso no site público; servem ao futuro painel de cadastro de imóveis. Detalhes no `openapi.yaml`.

### Permutas e usados (painel `/admin` do site)

Exigem login de administrador com a permissão `listings:manage` (papel `super_admin`). Toda alteração vai para a auditoria (`permuta.create|update|delete`). As migrations já criam a tabela com as permutas iniciais e o administrador, que sai de `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `ADMIN_NAME` do `.env` (defina antes de `migrate:latest`; sem elas nenhum administrador é criado).

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| GET | `/admin/permutas` | — | `AdminPermuta[]` |
| PUT | `/admin/permutas/:id` | `tipo, cidade, bairro, condominio?, quartos, suites?, vagas?, area, areaTerreno?, destaques[]?, valor, valorCondominio?, status? (published\|draft\|sold), fotos[]?, place? { lat, lng, approx } \| null` | `AdminPermuta` (cria se não existe) · `422 PERMUTA:INVALID` |
| DELETE | `/admin/permutas/:id` | — | `204` · `404 PERMUTA:NOT_FOUND` |

`:id` usa letras minúsculas, números e hífens; o anúncio fica em `/imovel/permuta-<id>`. Posições de `place` são do mapa; com `approx: true` o site mostra só um círculo da região.
