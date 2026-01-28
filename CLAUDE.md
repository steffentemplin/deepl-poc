# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A microservice-based web translator application demonstrating cloud-native patterns on Kubernetes. Users translate text via a web UI; translations are persisted asynchronously via Kafka Connect.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture documentation.
See [TODO.md](TODO.md) for implementation progress.

## Technology Stack

- **Runtime:** Node.js 24 + TypeScript
- **Frontend:** Vanilla HTML + CSS + TypeScript (no framework)
- **Service Communication:** gRPC with protobuf
- **Event Streaming:** Kafka + Kafka Connect (JDBC Sink)
- **Authentication:** Keycloak (OpenID Connect)
- **Database:** PostgreSQL
- **Translation API:** DeepL
- **Orchestration:** Kubernetes (local Kind cluster)

## Project Structure

```
services/           # Microservices (frontend, api-gateway, translation-svc, history-svc)
proto/              # Shared protobuf definitions
deploy/k8s/         # Kubernetes manifests
deploy/kind/        # Kind cluster configuration
scripts/            # Setup and deployment scripts
```

## Build and Development Commands

*Commands will be documented as services are implemented.*

## Container Runtime

Use **Podman** (not Docker) for all container operations.

## Container Images

Use official **Apache** images (e.g., `docker.io/apache/kafka`) — not Bitnami. Bitnami images are deprecated/unavailable.

## Architecture Notes

- API Gateway is the only externally exposed service
- Translation Service calls DeepL and publishes to Kafka
- Kafka Connect (JDBC Sink) persists events to PostgreSQL automatically
- History Service reads from PostgreSQL only (no Kafka consumer)
- All backend services communicate via gRPC
