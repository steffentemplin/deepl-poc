#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

NAMESPACE="translator"
LOCAL_PORT=8180
KEYCLOAK_URL="http://localhost:$LOCAL_PORT"
ADMIN_USER="admin"
ADMIN_PASSWORD="admin"

echo "=== Keycloak Realm Setup ==="

# Start port-forward in background
echo "Starting port-forward to Keycloak..."
kubectl port-forward -n "$NAMESPACE" svc/keycloak "$LOCAL_PORT:8080" &
PF_PID=$!

# Cleanup on exit
cleanup() {
    echo "Stopping port-forward..."
    kill $PF_PID 2>/dev/null || true
}
trap cleanup EXIT

# Wait for port-forward to be ready
sleep 3

# Wait for Keycloak to be ready
echo "Waiting for Keycloak to be ready..."
until curl -sf "$KEYCLOAK_URL/health/ready" > /dev/null 2>&1; do
    echo "  Keycloak not ready, waiting..."
    sleep 5
done
echo "Keycloak is ready!"

# Get admin token
echo "Getting admin token..."
TOKEN=$(curl -sf -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "username=$ADMIN_USER" \
    -d "password=$ADMIN_PASSWORD" \
    -d "grant_type=password" \
    -d "client_id=admin-cli" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "Error: Failed to get admin token"
    exit 1
fi
echo "Got admin token"

# Extract realm JSON from ConfigMap
REALM_JSON=$(kubectl get configmap keycloak-realm -n "$NAMESPACE" -o jsonpath='{.data.translator-realm\.json}')

# Check if realm already exists (don't use -f, we want the status code even on 404)
REALM_EXISTS=$(curl -s -o /dev/null -w "%{http_code}" \
    "$KEYCLOAK_URL/admin/realms/translator-app" \
    -H "Authorization: Bearer $TOKEN")

if [ "$REALM_EXISTS" = "200" ]; then
    echo "Realm 'translator-app' already exists. Skipping creation."
else
    echo "Creating realm 'translator-app'..."
    curl -sf -X POST "$KEYCLOAK_URL/admin/realms" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "$REALM_JSON"
    echo "Realm created successfully!"
fi

echo ""
echo "=== Keycloak Setup Complete ==="
echo ""
echo "Realm: translator-app"
echo ""
echo "Test Users:"
echo "  - testuser@example.com / testpass"
echo "  - demo@example.com / demo"
echo ""
echo "Frontend Client ID: translator-frontend"
echo ""
echo "To access Keycloak Admin Console, run:"
echo "  kubectl port-forward -n translator svc/keycloak 8180:8080"
echo "  Then open: http://localhost:8180/admin"
