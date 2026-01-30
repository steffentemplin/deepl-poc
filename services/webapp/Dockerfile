FROM node:24-alpine AS builder

WORKDIR /app

# Copy workspace root files
COPY package.json package-lock.json ./
COPY proto/ ./proto/
COPY services/webapp/ ./services/webapp/

# Install dependencies
RUN npm ci --workspace=@deepl-poc/proto --workspace=@deepl-poc/webapp

# Build proto package first
RUN npm run build --workspace=@deepl-poc/proto

# Build webapp (backend + frontend)
RUN npm run build --workspace=@deepl-poc/webapp

# Production stage
FROM node:24-alpine

WORKDIR /app

# Copy package files for production install
COPY package.json package-lock.json ./
COPY proto/package.json ./proto/
COPY services/webapp/package.json ./services/webapp/

# Install production dependencies only
RUN npm ci --workspace=@deepl-poc/proto --workspace=@deepl-poc/webapp --omit=dev

# Copy built artifacts
COPY --from=builder /app/proto/generated ./proto/generated
COPY --from=builder /app/proto/loader.js ./proto/
COPY --from=builder /app/proto/loader.d.ts ./proto/
COPY --from=builder /app/proto/*.proto ./proto/
COPY --from=builder /app/services/webapp/dist ./services/webapp/dist

# Set working directory to service
WORKDIR /app/services/webapp

USER node

EXPOSE 8080

CMD ["node", "dist/index.js"]
