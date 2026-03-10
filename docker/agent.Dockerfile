FROM node:20-alpine AS base

RUN npm install -g pnpm@9

WORKDIR /app

# Copy workspace config
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY tsconfig.base.json ./

# Copy package manifests
COPY sdk/package.json sdk/
COPY agent/package.json agent/

# Install dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source code
COPY sdk/ sdk/
COPY agent/ agent/

# Build SDK first, then agent
RUN pnpm --filter @conduit/sdk build
RUN pnpm --filter @conduit/agent build

# Production stage
FROM node:20-alpine AS runner

RUN npm install -g pnpm@9

WORKDIR /app

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/sdk ./sdk
COPY --from=base /app/agent ./agent
COPY --from=base /app/package.json ./
COPY --from=base /app/pnpm-workspace.yaml ./

CMD ["node", "agent/dist/index.js"]
