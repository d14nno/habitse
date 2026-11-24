FROM node:20-slim

WORKDIR /home/node/app

COPY --chown=node:node package.json package-lock.json* ./
RUN npm ci || npm install

COPY --chown=node:node . .
RUN npm run build

USER node

EXPOSE 3900

# As migrations rodam sozinhas a cada subida (tabelas, permutas iniciais e administrador do painel)
CMD ["/bin/sh", "-c", "npm run migrate:latest && npm run server"]
