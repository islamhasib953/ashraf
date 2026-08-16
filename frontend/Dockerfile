FROM node:20-bookworm-slim AS base

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
ARG BACKEND_URL
ENV BACKEND_URL=$BACKEND_URL
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/public ./public

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
