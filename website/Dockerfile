# Base environment
FROM node:24-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Stage 1: Install dependencies
FROM base AS deps
WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY shared/package.json shared/
COPY website/package.json website/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Stage 2: Build
FROM deps AS builder
ENV CI=1

COPY shared/ shared/
COPY website/ website/

RUN pnpm --filter=@javr-domain/website run build

# Stage 3: Production dependencies
FROM base AS prod-deps
WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY shared/package.json shared/
COPY website/package.json website/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --prod

# Stage 4: Production image
FROM base AS runner
RUN apt-get update && apt-get install -y --no-install-recommends udev && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/website ./website

WORKDIR /app/website

EXPOSE 3002

CMD ["node", "server.cjs"]