# Publicando o Habitse (habitse.com.br)

## Arquitetura escolhida

| Peça | Onde | Por quê |
|---|---|---|
| **Site** (`habitse.com.br`, `www`) | **Cloudflare Pages** (grátis) | CDN no Brasil, HTTPS automático, carrega rápido no celular, sem servidor para cuidar. Publica sozinho a cada `git push`. |
| **API** (`api.habitse.com.br`) | **1 VPS pequena** (Vultr/DigitalOcean, ~US$ 6/mês, Ubuntu 22.04+) com Node 20 + PM2 + Caddy | Já é o tipo de servidor usado no CRM; sem Docker; HTTPS automático pelo Caddy. |
| **Banco** | Postgres 16 e Redis na mesma VPS | Suficiente para a vitrine; backup diário por `pg_dump` (abaixo). |
| **DNS** | Cloudflare (nameservers trocados no Registro.br) | O domínio raiz (`habitse.com.br`, sem `www`) só funciona com CNAME na raiz na Cloudflare. |

> Imagens: hoje os anúncios usam ilustrações de exemplo. Para fotos reais, configure `DIGITAL_OCEAN_*` (Spaces/S3) no `.env` da API e use `StorageService`; o painel de cadastro ainda não existe (próxima etapa).

## 1. DNS (uma vez)

1. Crie conta grátis na Cloudflare → **Add a site** → `habitse.com.br` → plano Free.
2. A Cloudflare mostra 2 nameservers. No **Registro.br** → seu domínio → **Alterar servidores DNS** → coloque esses 2 → salvar (propaga em minutos/horas).
3. Na Cloudflare → DNS → crie: `A  api  →  IP da VPS` (nuvem **cinza/DNS only**, para o Caddy emitir o certificado).

## 2. API na VPS

```bash
# Pacotes (Ubuntu)
sudo apt update && sudo apt install -y postgresql redis-server git curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs
sudo npm i -g pm2
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy

# Banco
sudo -u postgres psql -c "CREATE USER habitse WITH PASSWORD 'TROQUE-ESTA-SENHA';"
sudo -u postgres psql -c "CREATE DATABASE habitse OWNER habitse;"

# Código
sudo mkdir -p /srv/habitse && sudo chown $USER /srv/habitse
git clone <repositório do projeto> /srv/habitse && cd /srv/habitse/backend
cp .env.example .env && nano .env
npm ci && npm run build && npm run migrate:latest
pm2 start ../deploy/ecosystem.config.cjs && pm2 save && pm2 startup   # siga a instrução que o comando imprime
```

Valores essenciais do `.env` de produção:

```
NODE_ENV=production
PORT=3900
APP_URL=https://api.habitse.com.br
SITE_URL=https://habitse.com.br
CORS_ORIGINS=https://habitse.com.br,https://www.habitse.com.br
DATABASE_URL=postgresql://habitse:TROQUE-ESTA-SENHA@localhost:5432/habitse
REDIS_CACHE_URI=redis://localhost:6379
REDIS_KEY_PREFIX=habitse
HASH_AUTH_SECRET=<string longa e aleatória: openssl rand -hex 48>
```

HTTPS: copie `deploy/Caddyfile` para `/etc/caddy/Caddyfile` → `sudo systemctl reload caddy`. Teste: `https://api.habitse.com.br/health` e `https://api.habitse.com.br/listings`.

Para ver o site com anúncios de exemplo antes do cadastro real: `npm run seed:run` (cria também o admin de desenvolvimento `admin@app.dev` / `12345678` — **troque a senha ou apague esse usuário em produção**).

Backup diário (crontab): `0 3 * * * pg_dump -U habitse habitse | gzip > /srv/backups/habitse-$(date +\%F).sql.gz`

## 3. Site na Cloudflare Pages

1. Suba o projeto para um repositório no GitHub.
2. Cloudflare → **Workers & Pages** → **Create** → **Pages** → conecte o repositório.
3. Configuração: pasta raiz `frontend`, build `npm run build`, saída `dist`.
4. Variáveis de ambiente (Production):
   - `VITE_API_URL=https://api.habitse.com.br`
   - `VITE_SITE_URL=https://habitse.com.br`
   - `VITE_WHATSAPP=5562998322361` e `VITE_CRECI=49.743/GO` (já são o padrão do código; só defina para trocar)
5. **Custom domains** → `habitse.com.br` e `www.habitse.com.br` (a Cloudflare cria o DNS sozinha).

Os arquivos `public/_redirects` (rotas do site abrindo direto) e `public/_headers` (cache) já estão prontos.

## 4. Depois de publicar

- Search Console (Google): adicione `habitse.com.br` e envie `https://api.habitse.com.br/sitemap.xml`.
- Compartilhamento no WhatsApp: o site é uma SPA; a prévia (foto/título) ao colar o link de um imóvel mostra os dados genéricos do site. Para prévia por imóvel é preciso renderização no servidor — próxima etapa recomendada.
- Atualizações: `git push` publica o site sozinho; na API, `git pull && npm ci && npm run build && npm run migrate:latest && pm2 reload habitse-api`.

## Empreendimentos da Bambuí sem depender da API (catálogo estático)

O site pode publicar os empreendimentos da Bambuí **sem a VPS**: a importação gera `frontend/public/data/empreendimentos.json` e
`frontend/public/sitemap.xml`, e o Cloudflare Pages publica a cada `git push`. Se esse arquivo existe e tem anúncios, o site usa
**só ele** (a API não é consultada); sem o arquivo, volta a usar a API. `VITE_LISTINGS_SOURCE=api` força a API.

- **Atualização automática:** a rotina `.github/workflows/atualizar-bambui.yml` roda todo dia às 6h (Brasília), sempre que
  `data/bambui-ajustes.json` muda e sob demanda (GitHub → *Actions* → *Atualizar empreendimentos da Bambuí* → *Run workflow*).
  Só faz commit se algo mudou. Se o site da Bambuí estiver fora do ar ou o arquivo de ajustes tiver erro, a rotina falha e o site
  continua com a versão anterior.
- **Preço, registro de incorporação, previsão de entrega, destaque, publicar os já prontos:** edite `data/bambui-ajustes.json`
  (guia em `data/LEIA-ME.md`) direto no GitHub. A importação nunca sobrescreve esse arquivo.
- **Rodar à mão:** `cd backend && npm run export:bambui` (`--dry-run` só mostra; `--from-dir=<pasta>` lê páginas já salvas).
- **Requisitos no GitHub:** *Settings → Actions → General → Workflow permissions* = *Read and write*; e a branch `main` sem
  proteção que impeça o push do `habitse-bot`.
- **Limites:** só os empreendimentos da Bambuí (não há cadastro de outros anúncios nesse modo); as fotos continuam apontando para
  o site da Bambuí.

