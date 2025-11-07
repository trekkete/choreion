#!/bin/bash

# Choreion Stop Script
# This script stops all Choreion containers

set -e

echo "🎭 Choreion Stop Script"
echo "======================"

# Stop and remove containers
echo "🛑 Stopping containers..."
docker-compose down

echo "✅ All containers stopped and removed"
echo ""
echo "💡 Data is preserved in Docker volumes"
echo "   To remove volumes as well, run: docker-compose down -v"
