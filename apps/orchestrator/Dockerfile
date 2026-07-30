FROM node:22.17.1-bookworm-slim AS build

WORKDIR /app

RUN npm install --global pnpm@11.16.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/orchestrator/package.json apps/orchestrator/tsconfig.json apps/orchestrator/tsconfig.build.json ./apps/orchestrator/
COPY packages/contracts/package.json packages/contracts/tsconfig.json packages/contracts/tsconfig.build.json ./packages/contracts/

RUN pnpm install --frozen-lockfile --filter @bewerbungswebsite/orchestrator...

COPY apps/orchestrator/src ./apps/orchestrator/src
COPY packages/contracts/src ./packages/contracts/src

RUN pnpm --filter @bewerbungswebsite/contracts build \
  && pnpm --filter @bewerbungswebsite/orchestrator build

FROM node:22.17.1-bookworm-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/orchestrator/node_modules ./apps/orchestrator/node_modules
COPY --from=build /app/apps/orchestrator/package.json ./apps/orchestrator/package.json
COPY --from=build /app/apps/orchestrator/dist ./apps/orchestrator/dist
COPY --from=build /app/packages/contracts/node_modules ./packages/contracts/node_modules
COPY --from=build /app/packages/contracts/package.json ./packages/contracts/package.json
COPY --from=build /app/packages/contracts/dist ./packages/contracts/dist

USER node
WORKDIR /app/apps/orchestrator

EXPOSE 4000

CMD ["node", "dist/server.js"]
