#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
K8S_DIR="$PROJECT_ROOT/deploy/k8s"

echo "=== Infrastructure Deployment ==="
echo ""

# Check kubectl
if ! command -v kubectl &> /dev/null; then
    echo "Error: kubectl is not installed"
    exit 1
fi

# Check cluster connection
if ! kubectl cluster-info &> /dev/null; then
    echo "Error: Cannot connect to Kubernetes cluster"
    echo "Make sure your cluster is running and kubectl is configured"
    exit 1
fi

echo "Connected to cluster: $(kubectl config current-context)"
echo ""

# Create namespace
echo "=== Creating namespace ==="
kubectl apply -f "$K8S_DIR/namespace.yaml"

# Deploy PostgreSQL
echo ""
echo "=== Deploying PostgreSQL ==="
kubectl apply -f "$K8S_DIR/postgres/"

# Deploy Kafka
echo ""
echo "=== Deploying Kafka ==="
kubectl apply -f "$K8S_DIR/kafka/"

# Deploy Keycloak
echo ""
echo "=== Deploying Keycloak ==="
kubectl apply -f "$K8S_DIR/keycloak/"

# Wait for core services to be ready
echo ""
echo "=== Waiting for services to be ready ==="

echo "Waiting for PostgreSQL..."
kubectl wait --for=condition=available deployment/postgres -n translator --timeout=120s

echo "Waiting for Kafka..."
kubectl wait --for=condition=available deployment/kafka -n translator --timeout=180s

echo "Waiting for Keycloak..."
kubectl wait --for=condition=available deployment/keycloak -n translator --timeout=180s

# Deploy Kafka Connect (depends on Kafka being ready)
echo ""
echo "=== Deploying Kafka Connect ==="
kubectl apply -f "$K8S_DIR/kafka-connect/configmap.yaml"
kubectl apply -f "$K8S_DIR/kafka-connect/deployment.yaml"
kubectl apply -f "$K8S_DIR/kafka-connect/service.yaml"

echo "Waiting for Kafka Connect..."
kubectl wait --for=condition=available deployment/kafka-connect -n translator --timeout=300s

# Deploy the JDBC connector
echo ""
echo "=== Setting up JDBC Connector ==="
kubectl delete job setup-jdbc-connector -n translator 2>/dev/null || true
kubectl apply -f "$K8S_DIR/kafka-connect/connector-job.yaml"

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Services status:"
kubectl get pods -n translator

echo ""
echo "=== Access Information ==="
echo ""
echo "PostgreSQL: postgres.translator.svc.cluster.local:5432"
echo "  Database: translator"
echo "  User: translator"
echo ""
echo "Kafka: kafka.translator.svc.cluster.local:9092"
echo ""
echo "Kafka Connect REST API: kafka-connect.translator.svc.cluster.local:8083"
echo ""
echo "Keycloak: http://localhost:8180 (via NodePort)"
echo "  Admin: admin / admin"
echo ""
echo "Run './scripts/setup-keycloak.sh' to configure the translator-app realm"
