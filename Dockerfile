# Build stage
FROM node:lts-alpine AS base

RUN corepack enable && corepack prepare pnpm@10.30.3 --activate
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

# pnpm needs the whole repo
COPY . .

RUN --mount=type=cache,target=/pnpm/store pnpm install --frozen-lockfile

RUN pnpm --filter @coursehub/backend db:generate
RUN pnpm --filter @coursehub/backend build

# Scope backend deps
RUN pnpm --filter @coursehub/backend --prod deploy /temp-prod

RUN cp -r apps/backend/build /temp-prod/build

# Production
FROM node:lts-alpine AS prod

WORKDIR /app

COPY --from=base /temp-prod/build ./build
COPY --from=base /temp-prod/node_modules ./node_modules
COPY --from=base /temp-prod/package.json ./package.json

ENV NODE_ENV=production

CMD ["node", "build/main.js"]