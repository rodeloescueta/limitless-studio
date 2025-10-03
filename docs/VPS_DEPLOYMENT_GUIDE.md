# Limitless Studio - VPS Deployment Guide

**Version**: 1.0
**Last Updated**: October 3, 2025
**Target Environment**: Ubuntu 22.04+ VPS (DigitalOcean, Contabo, AWS EC2, etc.)

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Preparation](#server-preparation)
3. [Initial Setup](#initial-setup)
4. [Application Deployment](#application-deployment)
5. [Nginx Configuration (Optional)](#nginx-configuration-optional)
6. [SSL/TLS Setup (Optional)](#ssltls-setup-optional)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)
9. [Backup & Recovery](#backup--recovery)

---

## Prerequisites

### Server Requirements

**Minimum Specifications**:
- **OS**: Ubuntu 22.04 LTS or 24.04 LTS
- **CPU**: 2 cores (4 cores recommended for production)
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 40GB SSD (100GB+ recommended for long-term)
- **Network**: Public IPv4 address
- **Ports**: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3000 (App - temporary)

**Recommended VPS Providers**:
- DigitalOcean (Droplet $24/month - 4GB RAM, 2 vCPUs)
- Contabo (VPS M - €6.99/month - 8GB RAM, 4 vCPUs)
- Hetzner Cloud (CPX21 - €8.59/month - 4GB RAM, 3 vCPUs)
- AWS EC2 (t3.medium - ~$30/month - 4GB RAM, 2 vCPUs)

### Local Requirements

- SSH client (Terminal on macOS/Linux, PuTTY on Windows)
- Git installed locally
- Basic knowledge of Linux command line

---

## Server Preparation

### Step 1: Initial Server Access

**Connect to your VPS via SSH:**
```bash
ssh root@YOUR_SERVER_IP
```

**For first-time connection**, you'll be prompted to verify the server's fingerprint. Type `yes` to continue.

### Step 2: Create Non-Root User (Security Best Practice)

```bash
# Create new user
adduser deployer

# Add user to sudo group
usermod -aG sudo deployer

# Switch to new user
su - deployer
```

**Set up SSH key authentication (recommended)**:
```bash
# On your local machine
ssh-keygen -t ed25519 -C "your_email@example.com"

# Copy public key to server
ssh-copy-id deployer@YOUR_SERVER_IP

# Test connection
ssh deployer@YOUR_SERVER_IP
```

### Step 3: Update System Packages

```bash
# Update package lists
sudo apt update

# Upgrade installed packages
sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl git wget nano ufw
```

### Step 4: Configure Firewall (UFW)

```bash
# Allow SSH (important - do this first!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow application port (temporary - for testing)
sudo ufw allow 3000/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

**Expected Output**:
```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                     ALLOW       Anywhere
3000/tcp                   ALLOW       Anywhere
```

---

## Initial Setup

### Step 5: Install Docker

```bash
# Remove old Docker versions (if any)
sudo apt remove -y docker docker-engine docker.io containerd runc

# Install dependencies
sudo apt install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

**Expected Output**:
```
Docker version 24.0.x, build xxxxxxx
Docker Compose version v2.23.x
```

### Step 6: Configure Docker Permissions

```bash
# Add current user to docker group
sudo usermod -aG docker $USER

# Apply group changes (or logout/login)
newgrp docker

# Test Docker without sudo
docker ps
```

### Step 7: Increase System Limits (for production)

```bash
# Edit limits configuration
sudo nano /etc/security/limits.conf
```

**Add these lines at the end**:
```
* soft nofile 65536
* hard nofile 65536
* soft nproc 65536
* hard nproc 65536
```

**Apply immediately**:
```bash
sudo sysctl -w fs.file-max=100000
echo "fs.file-max=100000" | sudo tee -a /etc/sysctl.conf
```

---

## Application Deployment

### Step 8: Clone Repository

```bash
# Create application directory
sudo mkdir -p /opt/limitless-studio
sudo chown $USER:$USER /opt/limitless-studio

# Clone repository
cd /opt
git clone https://github.com/rodeloescueta/limitless-studio.git
# OR if repository is private:
# git clone https://YOUR_TOKEN@github.com/rodeloescueta/limitless-studio.git

cd limitless-studio
```

### Step 9: Create Production Environment File

```bash
# Create production environment file
nano .env.production
```

**Copy and modify the following configuration**:

```bash
# ============================================
# Limitless Studio - Production Environment
# ============================================

# === Database Configuration ===
POSTGRES_DB=limitless_studio
POSTGRES_USER=postgres
POSTGRES_PASSWORD=CHANGE_ME_STRONG_PASSWORD_HERE
# Generate strong password: openssl rand -base64 32

# === Application Configuration ===
NODE_ENV=production
NEXTAUTH_URL=http://YOUR_SERVER_IP:3000
# After Nginx setup, change to: https://yourdomain.com

# Generate secret: openssl rand -base64 32
NEXTAUTH_SECRET=CHANGE_ME_RANDOM_SECRET_HERE

# === Database Connection (for Next.js) ===
DATABASE_URL=postgresql://postgres:CHANGE_ME_STRONG_PASSWORD_HERE@db:5432/limitless_studio

# === Redis Configuration ===
REDIS_PASSWORD=CHANGE_ME_REDIS_PASSWORD
REDIS_URL=redis://:CHANGE_ME_REDIS_PASSWORD@redis:6379
REDIS_HOST=redis
REDIS_PORT=6379
# Generate Redis password: openssl rand -base64 32

# === Queue Configuration ===
QUEUE_NAME_NOTIFICATIONS=notifications
QUEUE_NAME_SCHEDULED=scheduled-tasks
QUEUE_CONCURRENCY=5

# === Slack Integration (Optional) ===
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
SLACK_NOTIFICATIONS_ENABLED=false
SLACK_CHANNEL_GENERAL=#content-team
SLACK_CHANNEL_ALERTS=#content-alerts
# Set to true when you have webhook URL

# === Worker Configuration ===
WORKER_ENABLED=true
WORKER_CONCURRENCY=3

# === pgAdmin Configuration (Optional) ===
PGADMIN_DEFAULT_EMAIL=admin@yourdomain.com
PGADMIN_DEFAULT_PASSWORD=CHANGE_ME_PGADMIN_PASSWORD

# === Security & Performance ===
# Rate limiting (requests per second)
RATE_LIMIT_API=30
RATE_LIMIT_GENERAL=10

# Session settings
SESSION_MAX_AGE=86400

# CORS origins (comma-separated)
ALLOWED_ORIGINS=http://YOUR_SERVER_IP:3000

# === Security ===
# Uncomment for production security enhancements
# FORCE_HTTPS=true
# SECURE_COOKIES=true
# RATE_LIMIT_ENABLED=true
```

**Generate secure passwords**:
```bash
# Generate PostgreSQL password
openssl rand -base64 32

# Generate NextAuth secret
openssl rand -base64 32

# Generate Redis password
openssl rand -base64 32
```

**Replace placeholders in `.env.production`**:
- `CHANGE_ME_STRONG_PASSWORD_HERE` → Your generated PostgreSQL password
- `CHANGE_ME_RANDOM_SECRET_HERE` → Your generated NextAuth secret
- `CHANGE_ME_REDIS_PASSWORD` → Your generated Redis password
- `YOUR_SERVER_IP` → Your VPS public IP address
- `admin@yourdomain.com` → Your admin email

### Step 10: Build and Start Application

```bash
# Build and start all services
docker compose -f docker-compose.prod.yml up -d --build
```

**This will**:
- Build Next.js frontend (takes 5-10 minutes first time)
- Pull PostgreSQL, Redis, pgAdmin, Worker images
- Create Docker network
- Start all services

**Monitor build progress**:
```bash
docker compose -f docker-compose.prod.yml logs -f
```

Press `Ctrl+C` to stop following logs.

### Step 11: Verify Services Running

```bash
# Check all containers are running
docker compose -f docker-compose.prod.yml ps
```

**Expected Output**:
```
NAME                       STATUS              PORTS
limitless-studio-web-1     Up 2 minutes        0.0.0.0:3000->3000/tcp
limitless-studio-db-1      Up 2 minutes        127.0.0.1:5432->5432/tcp
limitless-studio-redis-1   Up 2 minutes        127.0.0.1:6379->6379/tcp
limitless-studio-worker-1  Up 2 minutes
limitless-studio-pgadmin-1 Up 2 minutes        127.0.0.1:8080->80/tcp
```

**All services should show "Up"**. If any service shows "Restarting" or "Exited", check logs:

```bash
docker compose -f docker-compose.prod.yml logs SERVICE_NAME
```

### Step 12: Run Database Migrations

```bash
# Enter web container
docker compose -f docker-compose.prod.yml exec web sh

# Run database migrations
npx drizzle-kit push:pg

# Exit container
exit
```

### Step 13: Seed Test Data (Optional)

```bash
# Seed database with test users and clients
docker compose -f docker-compose.prod.yml exec web npx tsx src/lib/seeds/seed.ts
```

**This creates**:
- 6 test users (admin, strategist, scriptwriter, editor, coordinator, member)
- 5 test clients
- Default REACH stages
- Checklist templates

### Step 14: Test Application

**Open browser and navigate to**:
```
http://YOUR_SERVER_IP:3000
```

**You should see**:
- Login page for Limitless Studio
- Ability to sign in with test accounts

**Test login**:
- Email: `admin@test.local`
- Password: `admin123`

**Expected result**: Dashboard with Kanban board loads successfully.

---

## Nginx Configuration (Optional)

**Nginx provides**:
- Reverse proxy (hide port 3000, use port 80/443)
- SSL/TLS termination (HTTPS)
- Better performance and caching
- Domain name support

### Step 15: Install Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Check status
sudo systemctl status nginx
```

### Step 16: Configure Nginx Virtual Host

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/limitless-studio
```

**Basic HTTP configuration** (no SSL yet):

```nginx
# Limitless Studio - Nginx Configuration
# HTTP only (for testing)

upstream limitless_studio {
    server localhost:3000;
    keepalive 64;
}

server {
    listen 80;
    listen [::]:80;

    # Replace with your domain or use server IP
    server_name YOUR_DOMAIN.com www.YOUR_DOMAIN.com;
    # Or for IP-based access: server_name YOUR_SERVER_IP;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/limitless-studio-access.log;
    error_log /var/log/nginx/limitless-studio-error.log;

    # Client body size (for file uploads - 10MB)
    client_max_body_size 10M;

    location / {
        proxy_pass http://limitless_studio;
        proxy_http_version 1.1;

        # Proxy headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Disable cache for Next.js
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Uploads directory (static file serving)
    location /uploads/ {
        alias /opt/limitless-studio/frontend/uploads/;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # Next.js static files
    location /_next/static/ {
        proxy_pass http://limitless_studio;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

**Replace `YOUR_DOMAIN.com` with**:
- Your actual domain name (if you have one), OR
- Your server IP address for IP-based access

### Step 17: Enable Nginx Configuration

```bash
# Create symbolic link to enable site
sudo ln -s /etc/nginx/sites-available/limitless-studio /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t
```

**Expected output**:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Step 18: Restart Nginx

```bash
# Restart Nginx to apply changes
sudo systemctl restart nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

### Step 19: Update Firewall (Block Direct Port 3000 Access)

```bash
# Remove direct access to port 3000 (force Nginx)
sudo ufw delete allow 3000/tcp

# Reload firewall
sudo ufw reload

# Verify
sudo ufw status
```

### Step 20: Test Nginx Proxy

**Open browser and navigate to**:
```
http://YOUR_DOMAIN.com
# OR
http://YOUR_SERVER_IP
```

**You should see**:
- Limitless Studio login page (same as before)
- Now accessible on port 80 (standard HTTP)

**Update `.env.production`**:
```bash
nano /opt/limitless-studio/.env.production
```

**Change**:
```bash
# Before
NEXTAUTH_URL=http://YOUR_SERVER_IP:3000

# After (for domain)
NEXTAUTH_URL=http://YOUR_DOMAIN.com
# OR (for IP)
NEXTAUTH_URL=http://YOUR_SERVER_IP
```

**Restart application**:
```bash
cd /opt/limitless-studio
docker compose -f docker-compose.prod.yml restart web
```

---

## SSL/TLS Setup (Optional)

**Use Let's Encrypt for free SSL certificates**.

### Step 21: Install Certbot

```bash
# Install Certbot and Nginx plugin
sudo apt install -y certbot python3-certbot-nginx
```

### Step 22: Obtain SSL Certificate

**Requirements**:
- Domain name pointing to your server IP (A record)
- DNS propagation completed (check with `nslookup YOUR_DOMAIN.com`)

```bash
# Obtain certificate (interactive)
sudo certbot --nginx -d YOUR_DOMAIN.com -d www.YOUR_DOMAIN.com

# Follow prompts:
# 1. Enter email address (for renewal reminders)
# 2. Agree to Terms of Service
# 3. Choose whether to redirect HTTP to HTTPS (recommended: yes)
```

**Certbot will automatically**:
- Verify domain ownership
- Obtain SSL certificate
- Modify Nginx configuration to use HTTPS
- Set up automatic HTTP → HTTPS redirect

### Step 23: Verify HTTPS Working

**Open browser and navigate to**:
```
https://YOUR_DOMAIN.com
```

**You should see**:
- 🔒 Padlock icon in browser
- Valid SSL certificate
- Limitless Studio login page loads securely

### Step 24: Update Application for HTTPS

```bash
nano /opt/limitless-studio/.env.production
```

**Change**:
```bash
# Before
NEXTAUTH_URL=http://YOUR_DOMAIN.com

# After
NEXTAUTH_URL=https://YOUR_DOMAIN.com

# Enable HTTPS features
FORCE_HTTPS=true
SECURE_COOKIES=true
```

**Restart application**:
```bash
cd /opt/limitless-studio
docker compose -f docker-compose.prod.yml restart web
```

### Step 25: Test SSL Certificate Auto-Renewal

```bash
# Test renewal (dry run)
sudo certbot renew --dry-run
```

**Expected output**:
```
Congratulations, all simulated renewals succeeded
```

**Certbot automatically sets up a cron job** to renew certificates before expiry (every 90 days).

---

## Monitoring & Maintenance

### Service Management Commands

```bash
# Start all services
docker compose -f docker-compose.prod.yml up -d

# Stop all services
docker compose -f docker-compose.prod.yml down

# Restart specific service
docker compose -f docker-compose.prod.yml restart web

# View logs (all services)
docker compose -f docker-compose.prod.yml logs -f

# View logs (specific service)
docker compose -f docker-compose.prod.yml logs -f web
docker compose -f docker-compose.prod.yml logs -f worker
docker compose -f docker-compose.prod.yml logs -f db

# Check service status
docker compose -f docker-compose.prod.yml ps

# View resource usage
docker stats
```

### Application Updates

**Automated update script** (already included):

```bash
cd /opt/limitless-studio
./deploy.sh
```

**What `deploy.sh` does**:
1. Pull latest code from Git
2. Rebuild Docker images
3. Restart services
4. Run database migrations
5. Show service status

**Manual update process**:
```bash
cd /opt/limitless-studio

# Pull latest code
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build

# Run migrations if needed
docker compose -f docker-compose.prod.yml exec web npx drizzle-kit push:pg
```

### Database Backup

**Automated backup script** (already included):

```bash
cd /opt/limitless-studio

# Create backup
./backup.sh backup

# List backups
./backup.sh list

# Restore backup
./backup.sh restore BACKUP_FILENAME
```

**Manual backup**:
```bash
# Create backup directory
mkdir -p /opt/limitless-studio/backups

# Backup database
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U postgres -d limitless_studio > backups/backup-$(date +%Y%m%d-%H%M%S).sql

# Backup with compression
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U postgres -d limitless_studio | gzip > backups/backup-$(date +%Y%m%d-%H%M%S).sql.gz
```

**Restore backup**:
```bash
# Restore from backup
docker compose -f docker-compose.prod.yml exec -T db psql -U postgres -d limitless_studio < backups/backup-FILENAME.sql

# Restore from compressed backup
gunzip -c backups/backup-FILENAME.sql.gz | docker compose -f docker-compose.prod.yml exec -T db psql -U postgres -d limitless_studio
```

### Health Monitoring

**Check application health**:
```bash
# Via curl
curl http://localhost:3000/health

# Expected response: "healthy"
```

**Check database connection**:
```bash
docker compose -f docker-compose.prod.yml exec db psql -U postgres -d limitless_studio -c "SELECT 1;"
```

**Check Redis connection**:
```bash
docker compose -f docker-compose.prod.yml exec redis redis-cli -a YOUR_REDIS_PASSWORD ping
# Expected response: PONG
```

**Monitor disk space**:
```bash
df -h
```

**Monitor Docker disk usage**:
```bash
docker system df
```

**Clean up unused Docker resources**:
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Full cleanup (careful!)
docker system prune -a --volumes
```

### Log Management

**View Nginx logs**:
```bash
# Access log
sudo tail -f /var/log/nginx/limitless-studio-access.log

# Error log
sudo tail -f /var/log/nginx/limitless-studio-error.log
```

**Rotate logs to prevent disk fill**:
```bash
# Nginx log rotation (already configured)
cat /etc/logrotate.d/nginx

# Docker log rotation
sudo nano /etc/docker/daemon.json
```

**Add this configuration**:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

**Restart Docker**:
```bash
sudo systemctl restart docker
cd /opt/limitless-studio
docker compose -f docker-compose.prod.yml up -d
```

---

## Troubleshooting

### Issue 1: Services Won't Start

**Symptoms**: `docker compose ps` shows "Exited" or "Restarting"

**Solutions**:

1. **Check logs**:
   ```bash
   docker compose -f docker-compose.prod.yml logs SERVICE_NAME
   ```

2. **Common causes**:
   - Missing environment variables in `.env.production`
   - Database connection failed (wrong password)
   - Port conflict (another service using port 3000)

3. **Check port conflicts**:
   ```bash
   sudo lsof -i :3000
   sudo lsof -i :5432
   ```

4. **Restart services**:
   ```bash
   docker compose -f docker-compose.prod.yml down
   docker compose -f docker-compose.prod.yml up -d
   ```

### Issue 2: Application Not Accessible

**Symptoms**: Cannot access `http://YOUR_SERVER_IP:3000`

**Solutions**:

1. **Check firewall**:
   ```bash
   sudo ufw status
   # Ensure port 3000 or 80/443 is allowed
   ```

2. **Check if service is listening**:
   ```bash
   sudo netstat -tlnp | grep 3000
   ```

3. **Check Docker networking**:
   ```bash
   docker network ls
   docker network inspect limitless-studio_app-network
   ```

4. **Test from server itself**:
   ```bash
   curl http://localhost:3000
   ```

### Issue 3: Database Connection Errors

**Symptoms**: Application shows "Database connection failed"

**Solutions**:

1. **Check PostgreSQL is running**:
   ```bash
   docker compose -f docker-compose.prod.yml ps db
   ```

2. **Test database connection**:
   ```bash
   docker compose -f docker-compose.prod.yml exec db psql -U postgres -d limitless_studio -c "SELECT 1;"
   ```

3. **Verify DATABASE_URL**:
   ```bash
   grep DATABASE_URL .env.production
   # Should match POSTGRES_PASSWORD
   ```

4. **Check database logs**:
   ```bash
   docker compose -f docker-compose.prod.yml logs db
   ```

### Issue 4: Nginx 502 Bad Gateway

**Symptoms**: Nginx shows "502 Bad Gateway" error

**Solutions**:

1. **Check application is running**:
   ```bash
   docker compose -f docker-compose.prod.yml ps web
   ```

2. **Check Nginx can reach app**:
   ```bash
   curl http://localhost:3000
   ```

3. **Check Nginx error logs**:
   ```bash
   sudo tail -f /var/log/nginx/limitless-studio-error.log
   ```

4. **Restart services**:
   ```bash
   sudo systemctl restart nginx
   docker compose -f docker-compose.prod.yml restart web
   ```

### Issue 5: Out of Disk Space

**Symptoms**: Services crash, errors mention "no space left on device"

**Solutions**:

1. **Check disk usage**:
   ```bash
   df -h
   docker system df
   ```

2. **Clean up Docker**:
   ```bash
   docker system prune -a --volumes
   ```

3. **Remove old backups**:
   ```bash
   ls -lh backups/
   rm backups/old-backup-*.sql.gz
   ```

4. **Clean up logs**:
   ```bash
   sudo journalctl --vacuum-time=7d
   ```

### Issue 6: SSL Certificate Issues

**Symptoms**: "Your connection is not private" or certificate errors

**Solutions**:

1. **Check certificate status**:
   ```bash
   sudo certbot certificates
   ```

2. **Renew certificate**:
   ```bash
   sudo certbot renew
   ```

3. **Check Nginx configuration**:
   ```bash
   sudo nginx -t
   ```

4. **Restart Nginx**:
   ```bash
   sudo systemctl restart nginx
   ```

---

## Backup & Recovery

### Automated Backups (Cron Job)

**Set up daily backups**:

```bash
# Edit crontab
crontab -e

# Add this line (daily backup at 2 AM)
0 2 * * * cd /opt/limitless-studio && ./backup.sh backup > /tmp/backup.log 2>&1
```

### Full System Backup

**Backup everything**:

```bash
# Create backup directory
mkdir -p ~/system-backups

# Backup application directory (excluding node_modules and .next)
tar -czvf ~/system-backups/app-$(date +%Y%m%d).tar.gz \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='postgres_data' \
  --exclude='redis_data' \
  /opt/limitless-studio

# Backup database
docker compose -f docker-compose.prod.yml exec -T db pg_dump -U postgres -d limitless_studio | gzip > ~/system-backups/db-$(date +%Y%m%d).sql.gz

# Backup environment files
cp /opt/limitless-studio/.env.production ~/system-backups/env-$(date +%Y%m%d).bak
```

### Disaster Recovery

**Complete restoration from scratch**:

1. **Provision new VPS** (same specs)
2. **Follow Steps 1-7** (Server Preparation & Initial Setup)
3. **Clone repository** (Step 8)
4. **Restore environment file**:
   ```bash
   cp ~/system-backups/env-LATEST.bak /opt/limitless-studio/.env.production
   ```
5. **Start services**:
   ```bash
   cd /opt/limitless-studio
   docker compose -f docker-compose.prod.yml up -d
   ```
6. **Restore database**:
   ```bash
   gunzip -c ~/system-backups/db-LATEST.sql.gz | docker compose -f docker-compose.prod.yml exec -T db psql -U postgres -d limitless_studio
   ```
7. **Verify application**:
   ```bash
   curl http://localhost:3000
   ```

---

## Production Checklist

**Before going live**:

- [ ] ✅ All services running (`docker compose ps` shows all "Up")
- [ ] ✅ Database migrations applied
- [ ] ✅ Test accounts working (can login as admin)
- [ ] ✅ Environment variables configured (`.env.production` complete)
- [ ] ✅ Firewall configured (UFW enabled, correct ports)
- [ ] ✅ Nginx reverse proxy working (if applicable)
- [ ] ✅ SSL certificate installed (if using domain)
- [ ] ✅ Automated backups configured (cron job set)
- [ ] ✅ Monitoring setup (health checks, logs)
- [ ] ✅ Strong passwords set (PostgreSQL, Redis, pgAdmin)
- [ ] ✅ SSH key authentication enabled (password login disabled)
- [ ] ✅ Documentation accessible to team
- [ ] ✅ Backup restoration tested (dry run)

**Security hardening**:

- [ ] ✅ Non-root user for SSH access
- [ ] ✅ SSH password authentication disabled
- [ ] ✅ Fail2ban installed (optional but recommended)
- [ ] ✅ Automatic security updates enabled
- [ ] ✅ Database not exposed to internet (127.0.0.1 only)
- [ ] ✅ Redis password protected
- [ ] ✅ pgAdmin only accessible via SSH tunnel or disabled

---

## Performance Tuning

### PostgreSQL Optimization

**Edit PostgreSQL configuration** (for larger deployments):

```bash
docker compose -f docker-compose.prod.yml exec db psql -U postgres -d limitless_studio

# Inside PostgreSQL shell:
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '1GB';
ALTER SYSTEM SET effective_cache_size = '3GB';
ALTER SYSTEM SET maintenance_work_mem = '256MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;
ALTER SYSTEM SET work_mem = '5242kB';
ALTER SYSTEM SET min_wal_size = '1GB';
ALTER SYSTEM SET max_wal_size = '4GB';

# Exit and restart
\q
```

```bash
docker compose -f docker-compose.prod.yml restart db
```

### Next.js Optimization

**Already configured in production**:
- ✅ Static optimization
- ✅ Image optimization
- ✅ Minification and compression
- ✅ Caching headers

---

## Support & Resources

**Documentation**:
- User Guide: `/docs/USER_GUIDE.md`
- Implementation Roadmap: `/.claude/tasks/IMPLEMENTATION_ROADMAP.md`
- Requirements: `/docs/LIMITLESS_STUDIO_REQUIREMENTS.md`

**Useful Commands Reference**:
- Docker Compose: `docker compose -f docker-compose.prod.yml [command]`
- Nginx: `sudo systemctl [start|stop|restart|status] nginx`
- Logs: `docker compose -f docker-compose.prod.yml logs -f [service]`
- Firewall: `sudo ufw [allow|deny|delete|status]`

**Common Ports**:
- 3000: Next.js application
- 5432: PostgreSQL (localhost only)
- 6379: Redis (localhost only)
- 8080: pgAdmin (localhost only)
- 80: HTTP (Nginx)
- 443: HTTPS (Nginx)

---

**Document Version**: 1.0
**Last Updated**: October 3, 2025
**Maintained By**: Development Team
