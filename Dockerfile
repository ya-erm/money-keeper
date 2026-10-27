FROM node:24-bookworm

WORKDIR /app

COPY ./package.json ./pnpm-lock.yaml ./

RUN corepack enable && pnpm install --frozen-lockfile

COPY ./prisma/schema.prisma ./prisma/

RUN npx prisma generate

COPY . .

ARG ORIGIN
RUN BUILD_ADAPTER=node pnpm build

CMD ["node", "build"]
