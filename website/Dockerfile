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
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen

# Build
RUN pnpm --filter=@javr-domain/website run build


# Deploy
RUN pnpm deploy --filter=@javr-domain/website --prod --legacy /prod/website

# Stage 2: Production image
FROM base AS runner

WORKDIR /app

# Copy built node_modules and app files
COPY --from=builder /prod/website .
COPY --from=builder /prod/website/.next .next

# Expose the server port
EXPOSE 3002

# Start the application
CMD ["node", "server.cjs"]