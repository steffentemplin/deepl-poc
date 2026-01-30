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
- [X] Test locally with grpcurl
- [X] Add GetSupportedLanguages RPC to expose DeepL's supported target languages (avoids bare "EN" issue; frontend can populate language dropdown dynamically)
- [X] Add integration tests for gRPC interface (Translate + GetSupportedLanguages RPCs)

## Phase 5: Webapp + Frontend

- [X] Initialize Node.js project with TypeScript + Express
- [X] Implement gRPC client for Translation Service
- [X] Implement Keycloak JWT validation middleware
- [X] Implement REST endpoints:
  - [X] POST /api/translate
  - [X] GET /api/languages
- [X] Create frontend HTML structure (index.html)
- [X] Style with CSS (responsive, accessible)
- [X] Implement frontend TypeScript application:
  - [X] Keycloak JS adapter integration (login/logout)
  - [X] Fetch and populate target language dropdown
  - [X] Translation form handling
  - [X] API client
- [X] Set up frontend build process (esbuild or tsc)
- [X] Serve built frontend as static files from Express
- [X] Write Dockerfile
- [X] Write Kubernetes manifests (Deployment, Service, Ingress)
- [X] Test with curl and browser

## Phase 6: Integration & Deployment

- [ ] Create deploy-all.sh script for full stack deployment
- [ ] Configure Kubernetes secrets (DeepL API key, DB credentials)
- [ ] Set up Ingress controller in Kind
- [ ] Configure Ingress routes
- [ ] End-to-end testing of full flow
- [ ] Document local development workflow in CLAUDE.md

## Phase 7: History Service & UI

- [ ] Initialize history-svc Node.js project with TypeScript
- [ ] Implement gRPC server (GetHistory, GetPreferences/SetPreferences)
- [ ] Implement PostgreSQL client (connection pool)
- [ ] Write Dockerfile and Kubernetes manifests
- [ ] Configure Kafka Connect JDBC Sink connector
- [ ] Add gRPC client for History Service to Webapp
- [ ] Add REST endpoints: GET /api/history, GET/PUT /api/preferences
- [ ] Add history view to frontend (authenticated users)
- [ ] End-to-end test: translate → Kafka → PostgreSQL → history UI

## Phase 8: Polish & Documentation

- [ ] Add health check endpoints to all services
- [ ] Add readiness/liveness probes to Kubernetes manifests
- [ ] Update CLAUDE.md with build/run commands
- [ ] Write README.md with project overview and quick start
- [ ] Clean up and remove any debug code

---

## Quick Reference

### Infrastructure URLs (Local Kind)
- Webapp: http://localhost:8080
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
