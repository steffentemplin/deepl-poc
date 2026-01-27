# TODO

Implementation steps for the translator microservice POC.

## Phase 1: Project Setup

- [X] Initialize monorepo structure with workspaces
- [X] Create shared TypeScript configuration
- [X] Set up proto/ directory with initial protobuf definitions
- [X] Configure ESLint and Prettier for the monorepo

## Phase 2: Local Development Infrastructure

- [X] Deploy PostgreSQL to Kind (Helm or manifests)
- [X] Deploy Kafka to Kind (Strimzi operator or Helm)
- [X] Deploy Kafka Connect with JDBC Sink connector
- [X] Deploy Keycloak to Kind
- [X] Configure Keycloak realm "translator-app" with test users
- [X] Verify all infrastructure components are running

## Phase 3: Protobuf Definitions

- [X] Define translation.proto (Translate RPC)
- [X] Define history.proto (GetHistory, GetPreferences RPCs)
- [X] Set up protobuf code generation for TypeScript
- [X] Generate TypeScript types and gRPC stubs

## Phase 4: Translation Service

- [X] Initialize Node.js project with TypeScript
- [X] Implement gRPC server skeleton
- [X] Implement DeepL API client
- [X] Implement Kafka producer
- [X] Implement Translate handler (DeepL call + Kafka publish)
- [X] Write Dockerfile
- [X] Write Kubernetes manifests (Deployment, Service)
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
# Deploy infrastructure (PostgreSQL, Kafka, Keycloak, Kafka Connect)
./scripts/deploy-infra.sh

# Configure Keycloak realm and test users
./scripts/setup-keycloak.sh

# Build all services
npm run build --workspaces

# Run tests
npm run test --workspaces
```
