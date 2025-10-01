# Quick Deployment Guide

## For VPS Ubuntu Server (IP-based Access)

### Prerequisites
- Ubuntu 22.04+ VPS with public IP
- Docker & Docker Compose installed
- Port 3000 open in firewall

### Quick Start

1. **Clone Repository**
```bash
cd /opt
git clone https://github.com/rodeloescueta/limitless-studio.git content-reach-hub
cd content-reach-hub
```

2. **Configure Environment**
```bash
cp .env.production.example .env.production
nano .env.production
```

Update these values:
- `NEXTAUTH_URL=http://YOUR_SERVER_IP:3000`
- `POSTGRES_PASSWORD=your_strong_password`
- `NEXTAUTH_SECRET=$(openssl rand -base64 32)`
- `REDIS_PASSWORD=your_redis_password`

3. **Deploy**
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

4. **Access Application**
```
http://YOUR_SERVER_IP:3000
```

### Update Application
```bash
./deploy.sh
```

### Backup Database
```bash
./backup.sh backup
```

### View Logs
```bash
docker compose -f docker-compose.prod.yml logs -f web
```

---

**Full Documentation:** See `.claude/tasks/vps-deployment.md`

**Repository:** https://github.com/rodeloescueta/limitless-studio
