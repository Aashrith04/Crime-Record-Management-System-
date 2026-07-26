# CRMS Enterprise Production Deployment Guide

## 1. Prerequisites
- Linux Enterprise Server (Ubuntu 22.04 LTS / RHEL 9 / Debian 12)
- Docker Engine 24.0+ & Docker Compose v2.20+
- Minimum Server Hardware: 4 vCPU, 8 GB RAM, 100 GB NVMe Storage

## 2. Containerized Stack Architecture
The system consists of 4 core services orchestrated via `docker-compose.yml`:
1. `crms-postgres`: PostgreSQL 15 Database (Port 5432)
2. `crms-redis`: Redis 7 Cache & Token Revocation Store (Port 6379)
3. `crms-backend`: FastAPI REST Engine (Port 8000)
4. `crms-frontend`: Next.js 14 Web Portal (Port 3000)

## 3. Production Deployment Commands
```bash
# Clone repository
git clone https://github.com/police-dept/crms.git
cd crms

# Copy production environment template
cp backend/.env.example backend/.env

# Spin up production services in detached mode
docker-compose up -d --build
```
