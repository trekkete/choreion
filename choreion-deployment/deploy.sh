#!/bin/bash

# Choreion Deployment Script
# This script builds and starts the full Choreion application stack

set -e

echo "🎭 Choreion Deployment Script"
echo "=============================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found!"
    echo "📝 Please copy .env.example to .env and configure it:"
    echo "   cp .env.example .env"
    echo "   nano .env"
    exit 1
fi

# Load environment variables
source .env

echo "✅ Environment variables loaded"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running!"
    echo "Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"

# Check if containers are already running
RUNNING_CONTAINERS=$(docker-compose ps -q 2>/dev/null | wc -l)

if [ "$RUNNING_CONTAINERS" -gt 0 ]; then
    echo "🔄 Containers already running, refreshing frontend only..."
    docker-compose up -d --build --no-deps frontend

    # Wait for services to be healthy
    echo "⏳ Waiting for services to be healthy..."
    sleep 2
else
    # Stop existing containers if any
    echo "🛑 Stopping existing containers..."
    docker-compose down 2>/dev/null || true

    # Build and start services
    echo "🏗️  Building and starting services..."
    docker-compose up -d --build

    # Wait for services to be healthy
    echo "⏳ Waiting for services to be healthy..."
    sleep 10
fi

# Check service status
echo ""
echo "📊 Service Status:"
docker-compose ps

# Show logs
echo ""
echo "📝 Recent logs:"
docker-compose logs --tail=50

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://localhost:${FRONTEND_PORT:-80}"
echo "   Backend:  http://localhost:${BACKEND_PORT:-8080}"
echo "   Backend Health: http://localhost:${BACKEND_PORT:-8080}/actuator/health"
echo ""
echo "📋 Useful commands:"
echo "   View logs:     docker-compose logs -f"
echo "   Stop:          docker-compose down"
echo "   Restart:       docker-compose restart"
echo "   View status:   docker-compose ps"
