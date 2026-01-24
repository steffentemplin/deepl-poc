# Architecture

A microservice-based web translator application demonstrating modern cloud-native patterns on Kubernetes.

## Overview

Users visit a web application to translate text. They enter text, select a target language, and receive a translation. The source language is auto-detected by DeepL. Authenticated users can view their translation history.

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                  Frontend                                    │
│                            (HTML + CSS + TS)                                │
│                              Port: 3000                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ REST/HTTP
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                               API Gateway                                    │
│                    (Node.js + TypeScript + Express)                         │
│                              Port: 8080                                      │
│                                                                              │
│                      - JWT validation (Keycloak)                            │
│                      - Request routing                                       │
│                      - Rate limiting                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                          │                    │
                     gRPC │                    │ gRPC
                          ▼                    ▼
┌────────────────────────────────┐  ┌────────────────────────────────┐
│      Translation Service       │  │       History Service          │
│      (Node.js + TypeScript)    │  │    (Node.js + TypeScript)      │
│           Port: 50051          │  │         Port: 50052            │
│                                │  │                                │
│  - DeepL API integration       │  │  - Query translation history   │
│  - Language auto-detection     │  │  - User preferences            │
│  - Publish events to Kafka     │  │  - Read from Postgres          │
└────────────────────────────────┘  └────────────────────────────────┘
              │                                    ▲
              │ publish                            │ read
              ▼                                    │
┌────────────────────────────────┐                 │
│            Kafka               │                 │
│     Topic: translations        │                 │
└────────────────────────────────┘                 │
              │                                    │
              │ consume                            │
              ▼                                    │
┌────────────────────────────────┐                 │
│        Kafka Connect           │                 │
│        (JDBC Sink)             │                 │
└────────────────────────────────┘                 │
              │                                    │
              │ write                              │
              ▼                                    │
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PostgreSQL                                      │
│                                                                              │
│                      - translation_history table                            │
│                      - user_preferences table                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              Keycloak                                        │
│                           Port: 8180                                         │
│                                                                              │
│                    - User registration & authentication                     │
│                    - JWT token issuance                                      │
│                    - Realm: translator-app                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Services

### Frontend
- **Technology:** Vanilla HTML + CSS + TypeScript (no framework)
- **Purpose:** Simple, accessible UI for text translation
- **Features:**
  - Text input area
  - Target language dropdown
  - Translation result display
  - Login/logout via Keycloak
  - Translation history view (authenticated users)

### API Gateway
- **Technology:** Node.js 24 + TypeScript + Express
- **Purpose:** Single entry point for frontend, handles cross-cutting concerns
- **Responsibilities:**
  - JWT token validation via Keycloak public keys
  - Route requests to appropriate backend services via gRPC
  - Rate limiting to prevent abuse
  - Request/response transformation (REST ↔ gRPC)

### Translation Service
- **Technology:** Node.js 24 + TypeScript + gRPC
- **Purpose:** Core translation logic
- **Responsibilities:**
  - Receive translation requests via gRPC
  - Call DeepL API (auto-detect source language)
  - Publish translation events to Kafka topic `translations`
  - Return translation result to caller

### History Service
- **Technology:** Node.js 24 + TypeScript + gRPC
- **Purpose:** Manage translation history
- **Responsibilities:**
  - Query PostgreSQL for user's translation history
  - Manage user preferences (default target language, etc.)
  - Does NOT consume from Kafka (Kafka Connect handles persistence)

### Kafka Connect (JDBC Sink)
- **Technology:** Confluent Kafka Connect with JDBC Sink Connector
- **Purpose:** Automatic persistence of translation events
- **Responsibilities:**
  - Consume from `translations` topic
  - Write events to PostgreSQL `translation_history` table
  - Handle retries and exactly-once delivery

## Data Flow

### Translation Request
1. User enters text and selects target language in Frontend
2. Frontend sends POST to API Gateway `/api/translate`
3. API Gateway validates JWT (if present, for history tracking)
4. API Gateway calls Translation Service via gRPC `Translate()`
5. Translation Service calls DeepL API
6. Translation Service publishes event to Kafka `translations` topic
7. Translation Service returns result via gRPC
8. API Gateway returns JSON response to Frontend
9. Frontend displays translation

### History Persistence (Async)
1. Kafka Connect consumes event from `translations` topic
2. JDBC Sink Connector writes to PostgreSQL `translation_history` table
3. No application code involved - fully managed by Kafka Connect

### View History
1. User clicks "History" in Frontend
2. Frontend sends GET to API Gateway `/api/history`
3. API Gateway validates JWT (required)
4. API Gateway calls History Service via gRPC `GetHistory()`
5. History Service queries PostgreSQL
6. Results returned through the chain to Frontend

## Technology Choices

| Technology | Purpose | Justification |
|------------|---------|---------------|
| TypeScript + Node.js 24 | All services | Type safety, modern JS features, unified language |
| gRPC | Service-to-service | Typed contracts via protobuf, efficient binary protocol |
| Kafka | Event streaming | Decouples translation from persistence, enables future consumers |
| Kafka Connect | Data integration | No custom consumer code, reliable exactly-once delivery |
| Keycloak | Authentication | Full-featured IdP, OpenID Connect, no custom auth code |
| PostgreSQL | Persistence | Reliable, supports JSON columns for flexible event storage |
| DeepL | Translation | High-quality translations, auto-detect, simple API |
| Kubernetes | Orchestration | Industry standard, declarative deployments |
| Kind | Local K8s | Lightweight, runs in Docker, CI-friendly |

## Project Structure

```
deepl-poc/
├── services/
│   ├── frontend/              # Static HTML+CSS+TS, served by simple HTTP server
│   │   ├── src/
│   │   │   ├── index.html
│   │   │   ├── styles.css
│   │   │   └── app.ts
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── api-gateway/           # Express server, gRPC clients
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── routes/
│   │   │   ├── middleware/
│   │   │   └── grpc-clients/
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── translation-svc/       # gRPC server, DeepL client, Kafka producer
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── deepl-client.ts
│   │   │   ├── kafka-producer.ts
│   │   │   └── handlers/
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   └── history-svc/           # gRPC server, Postgres client
│       ├── src/
│       │   ├── index.ts
│       │   ├── db.ts
│       │   └── handlers/
│       ├── package.json
│       └── Dockerfile
│
├── proto/                     # Shared protobuf definitions
│   ├── translation.proto
│   └── history.proto
│
├── deploy/
│   └── k8s/
│       ├── namespace.yaml
│       ├── frontend/
│       ├── api-gateway/
│       ├── translation-svc/
│       ├── history-svc/
│       ├── kafka/
│       ├── kafka-connect/
│       ├── postgres/
│       └── keycloak/
│
├── scripts/
│   ├── setup-kind.sh
│   ├── setup-keycloak.sh
│   └── deploy-all.sh
│
├── docs/
│   └── ARCHITECTURE.md
│
├── TODO.md
└── CLAUDE.md
```

## Database Schema

### translation_history
```sql
CREATE TABLE translation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255),              -- NULL for anonymous translations
    source_text TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    source_language VARCHAR(10),       -- Auto-detected, e.g., "EN"
    target_language VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_history_user_id ON translation_history(user_id);
CREATE INDEX idx_history_created_at ON translation_history(created_at DESC);
```

### user_preferences
```sql
CREATE TABLE user_preferences (
    user_id VARCHAR(255) PRIMARY KEY,
    default_target_language VARCHAR(10) DEFAULT 'EN',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Kafka Topics

### translations
- **Purpose:** Translation events for persistence and future consumers
- **Key:** user_id (or "anonymous")
- **Value Schema:**
```json
{
  "user_id": "string | null",
  "source_text": "string",
  "translated_text": "string",
  "source_language": "string",
  "target_language": "string",
  "timestamp": "ISO8601 string"
}
```

## Security Considerations

- All service-to-service communication is internal to the Kubernetes cluster
- Only API Gateway is exposed externally
- JWT tokens are validated against Keycloak's public keys (no shared secrets)
- DeepL API key stored as Kubernetes Secret
- PostgreSQL credentials stored as Kubernetes Secret
- Frontend uses secure cookies for session management
