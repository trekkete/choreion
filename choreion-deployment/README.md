# Choreion Deployment

This directory contains Docker-based deployment configuration for the Choreion application.

## 🚀 Quick Start

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Edit .env with your configuration
nano .env

# 3. Deploy
./deploy.sh
```

## 📁 Files

- `Dockerfile.backend` - Backend container configuration
- `Dockerfile.frontend` - Frontend container configuration with Nginx
- `docker-compose.yml` - Multi-container orchestration
- `nginx.conf` - Nginx web server configuration
- `.env.example` - Environment variables template
- `deploy.sh` - Deployment script
- `stop.sh` - Stop all containers
- `logs.sh` - View container logs
- `DEPLOYMENT.md` - Comprehensive deployment guide

## 📚 Documentation

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions, configuration options, troubleshooting, and production considerations.

## 🏗️ Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Nginx     │─────▶│ Spring Boot │─────▶│ PostgreSQL  │
│  (Frontend) │      │  (Backend)  │      │ (Database)  │
│   Port 80   │      │  Port 8080  │      │  Port 5432  │
└─────────────┘      └─────────────┘      └─────────────┘
```

## 🔗 URLs

After deployment:
- Frontend: http://localhost
- Backend API: http://localhost:8080
- Health Check: http://localhost:8080/actuator/health

## 💡 Common Commands

```bash
# View logs
./logs.sh

# Stop services
./stop.sh

# Restart services
docker-compose restart

# View status
docker-compose ps
```
