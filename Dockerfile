FROM node:16

WORKDIR /app

COPY ./package.json ./package-lock.json ./

RUN npm ci

COPY ./prisma/schema.prisma ./prisma/

RUN npx prisma generate

COPY . .

RUN sed -i 's/adapter-auto/adapter-node/g' ./svelte.config.js

RUN npm run build

ENTRYPOINT node build
