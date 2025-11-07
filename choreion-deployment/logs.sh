#!/bin/bash

# Choreion Logs Script
# This script shows logs from all services

set -e

SERVICE=${1:-}

if [ -z "$SERVICE" ]; then
    echo "🎭 Choreion Logs - All Services"
    echo "==============================="
    docker-compose logs -f
else
    echo "🎭 Choreion Logs - $SERVICE"
    echo "==============================="
    docker-compose logs -f "$SERVICE"
fi
