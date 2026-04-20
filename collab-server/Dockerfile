FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
# PORT is supplied by the platform (Render, Fly, etc.) and defaults to 1234 locally.
ENV HOST=0.0.0.0
# DATA_DIR defaults to /data; platforms that don't provide a persistent volume
# should override this (e.g. /tmp/collab-data on Render Free).
ENV DATA_DIR=/data

COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY src ./src
# tsx is in node_modules, invoked via npx
RUN npx -y tsc --noEmit || true

EXPOSE 1234
CMD ["npx", "tsx", "src/index.ts"]
