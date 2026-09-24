# Build from the monorepo root:
#   docker build -f apps/api/Dockerfile -t courte-api .
FROM node:20-bookworm-slim AS base
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/owner/package.json apps/owner/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/prisma apps/api/prisma
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build"
ENV DIRECT_URL="postgresql://build:build@127.0.0.1:5432/build"
RUN corepack prepare pnpm@10.34.5 --activate \
  && pnpm install --frozen-lockfile --filter @courte/api...

COPY packages/shared packages/shared
COPY apps/api apps/api

RUN pnpm --filter @courte/shared build \
  && pnpm --filter @courte/api prisma:generate \
  && pnpm --filter @courte/api build

FROM base AS runner
ENV NODE_ENV=production
ENV PATH="/app/apps/api/node_modules/.bin:/app/node_modules/.bin:$PATH"
WORKDIR /app
RUN groupadd --system nestjs \
  && useradd --system --gid nestjs --create-home nestjs

COPY --from=build --chown=nestjs:nestjs /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=build --chown=nestjs:nestjs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nestjs /app/packages/shared ./packages/shared
COPY --from=build --chown=nestjs:nestjs /app/apps/api/package.json ./apps/api/package.json
COPY --from=build --chown=nestjs:nestjs /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=nestjs:nestjs /app/apps/api/prisma ./apps/api/prisma
COPY --from=build --chown=nestjs:nestjs /app/apps/api/node_modules ./apps/api/node_modules

USER nestjs
WORKDIR /app/apps/api
EXPOSE 3001
ENV PORT=3001
CMD ["sh", "-c", "if [ \"${RUN_MIGRATIONS:-true}\" = \"true\" ]; then prisma migrate deploy; fi; exec node dist/main.js"]
