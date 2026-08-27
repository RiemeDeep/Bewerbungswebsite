FROM node:22.17.1-bookworm-slim AS build

ARG NEXT_PUBLIC_ENABLE_MATCH_PREVIEW_TEST=0
ENV NEXT_PUBLIC_ENABLE_MATCH_PREVIEW_TEST=${NEXT_PUBLIC_ENABLE_MATCH_PREVIEW_TEST}

WORKDIR /app

RUN npm install --global pnpm@11.16.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/web/package.json apps/web/tsconfig.json apps/web/next.config.ts apps/web/next-env.d.ts ./apps/web/
COPY packages/contracts/package.json packages/contracts/tsconfig.json packages/contracts/tsconfig.build.json ./packages/contracts/

RUN pnpm install --frozen-lockfile --filter @bewerbungswebsite/web...

COPY apps/web/src ./apps/web/src
COPY packages/contracts/src ./packages/contracts/src

RUN pnpm --filter @bewerbungswebsite/contracts build \
  && pnpm --filter @bewerbungswebsite/web build

FROM node:22.17.1-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
WORKDIR /app

COPY --from=build --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /app/apps/web/.next/static ./apps/web/.next/static

USER node

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
