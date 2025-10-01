# VPS Deployment Guide - Content Reach Hub

## Overview

This guide covers deploying Content Reach Hub to a VPS (Ubuntu server) using Docker Compose with source code deployment strategy.

**Deployment Strategy:** Pull source code from GitHub → Build on VPS → Run with Docker Compose

**Repository:** https://github.com/rodeloescueta/limitless-studio

---

## Prerequisites

### Server Requirements

- **OS:** Ubuntu 22.04 LTS or later
- **RAM:** Minimum 2GB (4GB recommended)
- **Storage:** Minimum 20GB SSD
- **CPU:** 2+ cores recommended
- **Network:** Public IP address with open port 3000 (or your preferred port)

### Required Software on VPS

- Docker Engine (v24.0+)
- Docker Compose (v2.0+)
- Git

---

## Initial Server Setup

### 1. Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (replace 'ubuntu' with your username)
sudo usermod -aG docker ubuntu

# Log out and back in for group changes to take effect
```

### 3. Install Docker Compose

```bash
# Docker Compose v2 is included with Docker Desktop
# Verify installation
docker compose version
```

### 4. Install Git

```bash
sudo apt install git -y
```

### 5. Configure Firewall

```bash
# Allow SSH (if using UFW)
sudo ufw allow 22/tcp

# Allow application port (default: 3000)
sudo ufw allow 3000/tcp

# Enable firewall
sudo ufw enable
```

---

## Application Deployment

### 1. Clone Repository

```bash
# Create application directory
sudo mkdir -p /opt/content-reach-hub
sudo chown $USER:$USER /opt/content-reach-hub

# Clone repository
cd /opt
git clone https://github.com/rodeloescueta/limitless-studio.git content-reach-hub
cd content-reach-hub
```

### 2. Configure Environment Variables

```bash
# Copy production environment template
cp .env.production.example .env.production

# Edit configuration
nano .env.production
```

**Important variables to update:**

- `POSTGRES_PASSWORD` - Strong database password
- `NEXTAUTH_URL` - Your server IP with port (e.g., http://YOUR_SERVER_IP:3000)
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `REDIS_PASSWORD` - Strong Redis password
- `PGADMIN_DEFAULT_EMAIL` - Your admin email
- `PGADMIN_DEFAULT_PASSWORD` - Strong pgAdmin password

### 3. Initial Deployment (IP Address Access)

```bash
# Build and start services
docker compose -f docker-compose.prod.yml up -d --build

# Check container status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

### 4. Run Database Migrations

```bash
# Access the web container
docker compose -f docker-compose.prod.yml exec web sh

# Inside container, run migrations (if you have migration scripts)
npm run db:migrate

# Exit container
exit
```

### 5. Verify Deployment

```bash
# Check if application is responding
curl http://localhost:3000

# Access from browser
# Open: http://YOUR_SERVER_IP:3000
```

---

## Updating the Application

### Using Deployment Script (Recommended)

```bash
cd /opt/content-reach-hub
./deploy.sh
```

**The deployment script automatically:**
1. Creates database backup
2. Pulls latest code from GitHub
3. Rebuilds Docker containers
4. Runs database migrations
5. Restarts services
6. Performs health checks
7. Rolls back on failure

### Manual Update Process

```bash
# Navigate to app directory
cd /opt/content-reach-hub

# Backup database first
./backup.sh backup

# Pull latest code
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build

# Check logs
docker compose -f docker-compose.prod.yml logs -f web
```

---

## Database Management

### Creating Backups

```bash
# Create backup
./backup.sh backup

# List all backups
./backup.sh list

# Manual backup to specific location
docker compose -f docker-compose.prod.yml exec -T db pg_dump \
  -U postgres -d content_reach_hub > backup.sql
```

### Restoring Backups

```bash
# Restore from backup file
./backup.sh restore /opt/content-reach-hub/backups/db_backup_20250101_120000.sql.gz

# Manual restore
docker compose -f docker-compose.prod.yml exec -T db psql \
  -U postgres -d content_reach_hub < backup.sql
```

### Accessing Database

```bash
# Using psql
docker compose -f docker-compose.prod.yml exec db psql -U postgres -d content_reach_hub

# Using pgAdmin (if enabled)
# Access at: http://your-server-ip:8080
# Login with credentials from .env.production
```

---

## Monitoring & Maintenance

### Viewing Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f web
docker compose -f docker-compose.prod.yml logs -f worker
docker compose -f docker-compose.prod.yml logs -f db

# Last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100 web
```

### Container Management

```bash
# Check container status
docker compose -f docker-compose.prod.yml ps

# Restart specific service
docker compose -f docker-compose.prod.yml restart web

# Stop all services
docker compose -f docker-compose.prod.yml down

# Start all services
docker compose -f docker-compose.prod.yml up -d
```

### Disk Space Management

```bash
# Check disk usage
df -h

# Clean up old Docker images
docker system prune -a

# Check Docker disk usage
docker system df
```

### SSL Certificate Renewal

```bash
# Renew Let's Encrypt certificates (before they expire)
sudo certbot renew

# Copy renewed certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/

# Restart nginx
docker compose -f docker-compose.prod.yml restart nginx
```

---

## Troubleshooting

### Service Won't Start

```bash
# Check container logs
docker compose -f docker-compose.prod.yml logs web

# Check container status
docker compose -f docker-compose.prod.yml ps

# Rebuild from scratch
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```

### Database Connection Issues

```bash
# Check if database is healthy
docker compose -f docker-compose.prod.yml exec db pg_isready -U postgres

# Check database logs
docker compose -f docker-compose.prod.yml logs db

# Verify DATABASE_URL in .env.production
cat .env.production | grep DATABASE_URL
```

### Port Already in Use

```bash
# Check what's using port 3000
sudo lsof -i :3000

# Stop conflicting process
kill -9 <PID>
```

### Out of Memory

```bash
# Check memory usage
free -h

# Check Docker container memory
docker stats

# Restart specific service to free memory
docker compose -f docker-compose.prod.yml restart web
```

---

## Rollback Procedure

### Quick Rollback (Last Deployment)

```bash
cd /opt/content-reach-hub

# Revert to previous commit
git reset --hard HEAD~1

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build
```

### Rollback to Specific Version

```bash
# View commit history
git log --oneline

# Rollback to specific commit
git reset --hard <commit-hash>

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build

# Restore database if needed
./backup.sh restore /opt/content-reach-hub/backups/db_backup_TIMESTAMP.sql.gz
```

---

## Security Best Practices

### 1. Regular Updates

```bash
# Update system packages weekly
sudo apt update && sudo apt upgrade -y

# Update Docker images monthly
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

### 2. Secure Environment Variables

```bash
# Ensure .env.production has restricted permissions
chmod 600 .env.production

# Never commit .env.production to git
echo ".env.production" >> .gitignore
```

### 3. Database Security

- Use strong passwords (20+ characters)
- Only expose database on localhost (already configured in docker-compose.prod.yml)
- Regular backups (automated via cron)

### 4. Firewall Configuration

```bash
# Only allow necessary ports
sudo ufw status

# Ensure only required ports are open (SSH and app port)
# Database, Redis, and pgAdmin should not be exposed externally
```

### 5. SSH Hardening

```bash
# Disable password authentication (use SSH keys only)
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no

# Restart SSH
sudo systemctl restart sshd
```

---

## Automated Backups (Cron)

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /opt/content-reach-hub && ./backup.sh backup >> /var/log/backup.log 2>&1

# Add weekly cleanup
0 3 * * 0 cd /opt/content-reach-hub && ./backup.sh cleanup >> /var/log/backup.log 2>&1
```

---

## Performance Optimization

### 1. Enable Docker Logging Limits

```bash
# Edit docker-compose.prod.yml and add to each service:
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

### 2. PostgreSQL Tuning

```bash
# Access PostgreSQL container
docker compose -f docker-compose.prod.yml exec db sh

# Edit postgresql.conf (adjust based on available RAM)
# shared_buffers = 256MB
# effective_cache_size = 1GB
# maintenance_work_mem = 64MB
```

### 3. Next.js Optimization

- Already configured with `output: 'standalone'` for minimal image size
- Production build optimization enabled

---

## Monitoring Setup (Future Enhancement)

### Recommended Tools

- **Uptime Monitoring:** UptimeRobot, Pingdom
- **Error Tracking:** Sentry (add SENTRY_DSN to .env.production)
- **Server Monitoring:** Netdata, Grafana + Prometheus
- **Log Aggregation:** ELK Stack, Loki

---

## Support & Maintenance

### Regular Tasks

- [ ] Daily: Check application logs
- [ ] Weekly: Review disk space
- [ ] Monthly: Update Docker images
- [ ] Monthly: Review and test backups
- [ ] Quarterly: Security audit

### Key File Locations

- Application: `/opt/content-reach-hub`
- Backups: `/opt/content-reach-hub/backups`
- Environment Config: `/opt/content-reach-hub/.env.production`
- Logs: `docker compose logs`

---

## Deployment Checklist

### Pre-Deployment

- [ ] VPS provisioned with Ubuntu 22.04+
- [ ] Docker and Docker Compose installed
- [ ] Public IP address noted
- [ ] .env.production configured
- [ ] Firewall configured (ports 3000, 22)

### Initial Deployment

- [ ] Repository cloned to /opt/content-reach-hub
- [ ] .env.production created and configured with server IP
- [ ] Docker containers built and started
- [ ] Database migrations run
- [ ] Application accessible via http://SERVER_IP:3000

### Post-Deployment

- [ ] Automated backups configured (cron)
- [ ] Monitoring tools setup
- [ ] Team access configured
- [ ] Documentation reviewed
- [ ] Rollback procedure tested

---

## Changelog

### 2025-10-01 - Initial Setup
- Created production Docker Compose configuration
- Created deployment and backup scripts
- Documented full deployment process
- Configured environment variables template
- Updated repository URL to https://github.com/rodeloescueta/limitless-studio
- Configured for IP address access (no domain/SSL required)
