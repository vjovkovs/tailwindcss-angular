#!/bin/bash

# Generate self-signed SSL certificates for local development
# This script creates certificates that work with Angular CLI

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CERT_DIR="$PROJECT_ROOT/.certs"

echo "🔐 Generating SSL certificates for local development..."

# Create .certs directory if it doesn't exist
mkdir -p "$CERT_DIR"

# Generate private key
openssl genrsa -out "$CERT_DIR/localhost.key" 2048

# Generate certificate signing request
openssl req -new -key "$CERT_DIR/localhost.key" -out "$CERT_DIR/localhost.csr" -subj "/C=US/ST=State/L=City/O=Organization/OU=Dev/CN=localhost"

# Generate self-signed certificate
openssl x509 -req -days 365 -in "$CERT_DIR/localhost.csr" -signkey "$CERT_DIR/localhost.key" -out "$CERT_DIR/localhost.crt" \
  -extfile <(printf "subjectAltName=DNS:localhost,DNS:127.0.0.1,IP:127.0.0.1")

# Convert to PEM format
cp "$CERT_DIR/localhost.crt" "$CERT_DIR/localhost.pem"

# Clean up CSR
rm "$CERT_DIR/localhost.csr"

echo "✅ SSL certificates generated successfully!"
echo ""
echo "📁 Certificate location: $CERT_DIR"
echo "   - Certificate: localhost.pem"
echo "   - Private Key: localhost.key"
echo ""
echo "⚠️  Note: Your browser will show a security warning for self-signed certificates."
echo "   You can safely proceed by clicking 'Advanced' and 'Proceed to localhost'."
echo ""
echo "🚀 Run 'npm run start:https' to start the development server with HTTPS"
