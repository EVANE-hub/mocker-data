FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

FROM node:20-alpine

RUN apk add --no-cache dumb-init

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules

COPY --chown=nodejs:nodejs . .

USER nodejs

EXPOSE 3002

ENV NODE_ENV=production \
    PORT=3002 \
    HOST=0.0.0.0

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "index.js"]
