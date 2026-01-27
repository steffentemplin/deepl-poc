FROM node:24-alpine AS builder

WORKDIR /app

# Copy workspace root files
COPY package.json package-lock.json ./
COPY proto/ ./proto/
COPY services/translation-svc/ ./services/translation-svc/

# Install dependencies
RUN npm ci --workspace=@deepl-poc/proto --workspace=@deepl-poc/translation-svc

# Build proto package first
RUN npm run build --workspace=@deepl-poc/proto

# Build translation service
RUN npm run build --workspace=@deepl-poc/translation-svc

# Production stage
FROM node:24-alpine

WORKDIR /app

# Copy package files for production install
COPY package.json package-lock.json ./
COPY proto/package.json ./proto/
COPY services/translation-svc/package.json ./services/translation-svc/

# Install production dependencies only
RUN npm ci --workspace=@deepl-poc/proto --workspace=@deepl-poc/translation-svc --omit=dev

# Copy built artifacts
COPY --from=builder /app/proto/generated ./proto/generated
COPY --from=builder /app/proto/loader.js ./proto/
COPY --from=builder /app/proto/loader.d.ts ./proto/
COPY --from=builder /app/proto/*.proto ./proto/
COPY --from=builder /app/services/translation-svc/dist ./services/translation-svc/dist

# Set working directory to service
WORKDIR /app/services/translation-svc

# Non-root user for security
USER node

EXPOSE 50051

CMD ["node", "dist/index.js"]
