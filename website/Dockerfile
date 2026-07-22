# Base environment
FROM node:24-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Stage 1: Build dependencies
FROM base AS builder
ENV CI=1
WORKDIR /app

# Move files
COPY . .

# Install dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Build
RUN pnpm --filter=@javr-domain/website run build

# Prune dev dependencies for production
RUN pnpm install --prod --frozen-lockfile

# Stage 2: Production image
FROM base AS runner

WORKDIR /app

# Copy the entire production workspace (pnpm preserves symlinks)
COPY --from=builder /app .

WORKDIR /app/website

# Expose the server port
EXPOSE 3002

# Start the application
CMD ["node", "server.cjs"]