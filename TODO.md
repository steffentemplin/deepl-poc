# TODO

Implementation steps for the translator microservice POC.

## Phase 1: Project Setup

- [ ] Initialize monorepo structure with workspaces
- [ ] Create shared TypeScript configuration
- [ ] Set up proto/ directory with initial protobuf definitions
- [ ] Configure ESLint and Prettier for the monorepo

## Phase 2: Local Development Infrastructure

- [ ] Create Kind cluster configuration
- [ ] Write setup script for Kind cluster
- [ ] Deploy PostgreSQL to Kind (Helm or manifests)
- [ ] Deploy Kafka to Kind (Strimzi operator or Helm)
- [ ] Deploy Kafka Connect with JDBC Sink connector
- [ ] Deploy Keycloak to Kind
- [ ] Configure Keycloak realm "translator-app" with test users
- [ ] Verify all infrastructure components are running

## Phase 3: Protobuf Definitions

- [ ] Define translation.proto (Translate RPC)
- [ ] Define history.proto (GetHistory, GetPreferences RPCs)
- [ ] Set up protobuf code generation for TypeScript
- [ ] Generate TypeScript types and gRPC stubs

## Phase 4: Translation Service

- [ ] Initialize Node.js project with TypeScript
- [ ] Implement gRPC server skeleton
- [ ] Implement DeepL API client
- [ ] Implement Kafka producer
- [ ] Implement Translate handler (DeepL call + Kafka publish)
- [ ] Write Dockerfile
- [ ] Write Kubernetes manifests (Deployment, Service)
- [ ] Test locally with grpcurl

## Phase 5: History Service

- [ ] Initialize Node.js project with TypeScript
- [ ] Implement gRPC server skeleton
- [ ] Implement PostgreSQL client (connection pool)
- [ ] Implement GetHistory handler
- [ ] Implement GetPreferences / SetPreferences handlers
- [ ] Write Dockerfile
- [ ] Write Kubernetes manifests
- [ ] Test locally with grpcurl

## Phase 6: Kafka Connect Configuration

- [ ] Create JDBC Sink connector configuration
- [ ] Map Kafka message schema to PostgreSQL table
- [ ] Deploy connector to Kafka Connect
- [ ] Test end-to-end: produce message → verify in PostgreSQL

## Phase 7: API Gateway

- [ ] Initialize Node.js project with TypeScript + Express
- [ ] Implement gRPC clients for Translation and History services
- [ ] Implement Keycloak JWT validation middleware
- [ ] Implement REST endpoints:
  - [ ] POST /api/translate
  - [ ] GET /api/history
  - [ ] GET /api/preferences
  - [ ] PUT /api/preferences
- [ ] Implement rate limiting middleware
- [ ] Write Dockerfile
- [ ] Write Kubernetes manifests (Deployment, Service, Ingress)
- [ ] Test with curl

## Phase 8: Frontend

- [ ] Create HTML structure (index.html)
- [ ] Style with CSS (responsive, accessible)
- [ ] Implement TypeScript application:
  - [ ] Translation form handling
  - [ ] API client for gateway
  - [ ] Keycloak JS adapter integration
  - [ ] History view (authenticated users)
- [ ] Set up simple build process (esbuild or tsc)
- [ ] Write Dockerfile (nginx or simple Node server)
- [ ] Write Kubernetes manifests

## Phase 9: Integration & Deployment

- [ ] Create deploy-all.sh script for full stack deployment
- [ ] Configure Kubernetes secrets (DeepL API key, DB credentials)
- [ ] Set up Ingress controller in Kind
- [ ] Configure Ingress routes for Frontend and API Gateway
- [ ] End-to-end testing of full flow
- [ ] Document local development workflow in CLAUDE.md

## Phase 10: Polish & Documentation

- [ ] Add health check endpoints to all services
- [ ] Add readiness/liveness probes to Kubernetes manifests
- [ ] Update CLAUDE.md with build/run commands
- [ ] Write README.md with project overview and quick start
- [ ] Clean up and remove any debug code

---

## Quick Reference

### Infrastructure URLs (Local Kind)
- Frontend: http://localhost:3000
- API Gateway: http://localhost:8080
- Keycloak: http://localhost:8180
- PostgreSQL: localhost:5432
- Kafka: localhost:9092

### Key Commands (to be filled in as we implement)
```bash
# Start Kind cluster
./scripts/setup-kind.sh

# Deploy all infrastructure
./scripts/deploy-all.sh

# Build all services
npm run build --workspaces

# Run tests
npm run test --workspaces
```
