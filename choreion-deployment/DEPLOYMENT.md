# Choreion Deployment Guide

This guide explains how to deploy the Choreion application using Docker containers.

## 📋 Table of Contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Managing Services](#managing-services)
- [Troubleshooting](#troubleshooting)
- [Production Considerations](#production-considerations)

## 🏗️ Architecture

The Choreion application consists of three Docker containers:

1. **Frontend Container** (Nginx)
   - Serves static HTML/CSS/JS files
   - Proxies API requests to the backend
   - Runs on port 80 (configurable)

2. **Backend Container** (Spring Boot)
   - RESTful API server
   - Handles business logic and authentication
   - Runs on port 8080 (configurable)

3. **Database Container** (PostgreSQL)
   - Stores application data
   - Persistent volume for data
   - Runs on port 5432 (configurable)

## ✅ Prerequisites

- Docker (version 20.10+)
- Docker Compose (version 2.0+)
- At least 2GB of available RAM
- At least 5GB of available disk space

### Install Docker

**macOS:**
```bash
brew install docker docker-compose
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
```

**Windows:**
Download and install Docker Desktop from https://www.docker.com/products/docker-desktop

## 🚀 Quick Start

1. **Clone the repository** (if not already done):
   ```bash
   cd /path/to/choreion
   ```

2. **Navigate to deployment directory**:
   ```bash
   cd choreion-deployment
   ```

3. **Copy environment template**:
   ```bash
   cp .env.example .env
   ```

4. **Edit environment variables**:
   ```bash
   nano .env
   # or use your preferred editor
   ```

5. **Generate JWT secret** (recommended):
   ```bash
   openssl rand -hex 32
   ```
   Copy the output and paste it as `JWT_SECRET` in your `.env` file.

6. **Deploy the application**:
   ```bash
   ./deploy.sh
   ```

7. **Access the application**:
   - Frontend: http://localhost
   - Backend API: http://localhost:8080
   - Health Check: http://localhost:8080/actuator/health

## ⚙️ Configuration

### Environment Variables

Edit the `.env` file to configure your deployment:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `POSTGRES_DB` | Database name | `choreion` | No |
| `POSTGRES_USER` | Database username | `postgres` | No |
| `POSTGRES_PASSWORD` | Database password | - | **Yes** |
| `POSTGRES_PORT` | Database port | `5432` | No |
| `BACKEND_PORT` | Backend API port | `8080` | No |
| `FRONTEND_PORT` | Frontend web port | `80` | No |
| `JWT_SECRET` | JWT signing key | - | **Yes** |
| `JWT_EXPIRATION` | JWT expiration (ms) | `86400000` (24h) | No |

### Important Security Notes

- **Never commit the `.env` file** to version control
- Use a **strong, random JWT secret** (at least 256 bits)
- Use a **strong database password**
- In production, consider using Docker secrets or a secrets manager

## 🚢 Deployment

### First-Time Deployment

```bash
cd choreion-deployment
cp .env.example .env
# Edit .env with your values
./deploy.sh
```

The deployment script will:
1. Check prerequisites
2. Build Docker images
3. Start all containers
4. Verify service health
5. Display status and URLs

### Updating the Application

After making code changes:

```bash
cd choreion-deployment
./deploy.sh
```

This will rebuild and restart all services with your changes.

## 🔧 Managing Services

### View Logs

All services:
```bash
./logs.sh
```

Specific service:
```bash
./logs.sh backend
./logs.sh frontend
./logs.sh postgres
```

Or use docker-compose directly:
```bash
docker-compose logs -f [service-name]
```

### Stop Services

```bash
./stop.sh
```

Or:
```bash
docker-compose down
```

### Restart Services

```bash
docker-compose restart
```

Restart specific service:
```bash
docker-compose restart backend
```

### View Service Status

```bash
docker-compose ps
```

### Execute Commands in Containers

Backend container:
```bash
docker-compose exec backend bash
```

Database container:
```bash
docker-compose exec postgres psql -U postgres -d choreion
```

## 🔍 Troubleshooting

### Services Won't Start

1. Check Docker is running:
   ```bash
   docker info
   ```

2. Check for port conflicts:
   ```bash
   lsof -i :80    # Frontend
   lsof -i :8080  # Backend
   lsof -i :5432  # Database
   ```

3. View detailed logs:
   ```bash
   docker-compose logs
   ```

### Database Connection Issues

1. Verify PostgreSQL is healthy:
   ```bash
   docker-compose ps postgres
   ```

2. Check database logs:
   ```bash
   docker-compose logs postgres
   ```

3. Verify connection from backend:
   ```bash
   docker-compose exec backend ping postgres
   ```

### Backend Health Check Failing

1. Check backend logs:
   ```bash
   docker-compose logs backend
   ```

2. Manually test health endpoint:
   ```bash
   curl http://localhost:8080/actuator/health
   ```

3. Verify database connection in application logs

### Frontend Cannot Reach Backend

1. Verify backend is running:
   ```bash
   curl http://localhost:8080/actuator/health
   ```

2. Check nginx configuration:
   ```bash
   docker-compose exec frontend cat /etc/nginx/conf.d/default.conf
   ```

3. Check nginx logs:
   ```bash
   docker-compose logs frontend
   ```

### Reset Everything

To completely reset (⚠️ **WARNING: This deletes all data**):

```bash
docker-compose down -v
docker system prune -a
./deploy.sh
```

## 🏭 Production Considerations

### Security

1. **Use HTTPS**: Deploy behind a reverse proxy with SSL/TLS
   - Consider using Let's Encrypt for free certificates
   - Tools: nginx, Traefik, Caddy

2. **Firewall Configuration**:
   - Only expose ports 80/443 to the internet
   - Keep database port (5432) internal only

3. **Secrets Management**:
   - Use Docker secrets or external secrets manager
   - Rotate JWT secrets regularly
   - Use strong, unique passwords

4. **Security Updates**:
   - Regularly update base Docker images
   - Monitor for security vulnerabilities
   - Keep dependencies up to date

### Monitoring

1. **Health Checks**: Already configured in docker-compose.yml

2. **Logging**:
   - Configure centralized logging (ELK, Splunk, etc.)
   - Set up log rotation:
     ```bash
     docker-compose logs --follow --tail=100 > /var/log/choreion.log
     ```

3. **Monitoring Tools**:
   - Prometheus + Grafana for metrics
   - Spring Boot Actuator endpoints
   - Database monitoring tools

### Backups

1. **Database Backups**:
   ```bash
   # Create backup
   docker-compose exec postgres pg_dump -U postgres choreion > backup.sql

   # Restore backup
   docker-compose exec -T postgres psql -U postgres choreion < backup.sql
   ```

2. **Automated Backups**:
   ```bash
   # Add to crontab
   0 2 * * * cd /path/to/choreion/choreion-deployment && docker-compose exec -T postgres pg_dump -U postgres choreion > /backups/choreion-$(date +\%Y\%m\%d).sql
   ```

### Scaling

For production load, consider:

1. **Horizontal Scaling**: Run multiple backend instances
   ```yaml
   backend:
     deploy:
       replicas: 3
   ```

2. **Load Balancer**: Use nginx or HAProxy for load balancing

3. **Database**: Consider managed database service (AWS RDS, Azure Database, etc.)

4. **CDN**: Use CDN for static frontend assets

### Performance

1. **Database Connection Pool**: Already configured in `application-prod.yml`

2. **JVM Settings**: Optimize for your environment
   ```yaml
   environment:
     JAVA_OPTS: "-Xms512m -Xmx1024m"
   ```

3. **Nginx Caching**: Static assets are already cached (1 year)

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)

## 🐛 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review application logs
3. Open an issue on the project repository

---

**Last Updated**: November 2024
