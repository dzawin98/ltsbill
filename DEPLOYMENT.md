# 🚀 GASS (RTRW Management System) - Docker Deployment Guide

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Minimum 2GB RAM
- Minimum 10GB disk space

## 🛠️ Quick Start

### 1. Clone dan Setup
```bash
# Clone repository (jika belum ada)
git clone <repository-url> gass
cd gass

# Copy environment file
cp .env.example .env
```

### 2. Konfigurasi Environment
Edit file `.env` sesuai kebutuhan:
```bash
# Database Configuration
MYSQL_ROOT_PASSWORD=your-secure-root-password
MYSQL_DATABASE=rtrw_db
MYSQL_USER=gass_user
MYSQL_PASSWORD=your-secure-password

# Application Environment
NODE_ENV=production

# Security (WAJIB diganti untuk production)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
ENCRYPTION_KEY=your-32-character-encryption-key-here

# MikroTik Configuration
MIKROTIK_HOST=192.168.1.1
MIKROTIK_USERNAME=admin
MIKROTIK_PASSWORD=your-mikrotik-password
```

### 3. Build dan Run
```bash
# Build semua services
docker-compose build

# Start aplikasi
docker-compose up -d

# Cek status
docker-compose ps
```

### 4. Inisialisasi Database
```bash
# Jalankan migrasi database
docker-compose exec backend npm run migrate

# (Optional) Jalankan seeder jika ada
docker-compose exec backend npm run seed
```

## 🌐 Akses Aplikasi

- **Frontend**: http://localhost (port 80)
- **Backend API**: http://localhost:3001
- **Database**: localhost:3306
- **Redis**: localhost:6379

## 📊 Monitoring

### Health Checks
```bash
# Cek health status semua services
docker-compose ps

# Cek logs
docker-compose logs -f

# Cek logs service tertentu
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

### Resource Usage
```bash
# Monitor resource usage
docker stats

# Disk usage
docker system df
```

## 🔧 Management Commands

### Database Management
```bash
# Backup database
docker-compose exec mysql mysqldump -u root -p rtrw_db > backup.sql

# Restore database
docker-compose exec -T mysql mysql -u root -p rtrw_db < backup.sql

# Access MySQL shell
docker-compose exec mysql mysql -u root -p
```

### Application Management
```bash
# Restart services
docker-compose restart

# Stop services
docker-compose down

# Stop dan hapus volumes (HATI-HATI: akan menghapus data)
docker-compose down -v

# Update aplikasi
git pull
docker-compose build
docker-compose up -d
```

## 🔒 Security Considerations

### 1. Environment Variables
- **WAJIB** ganti semua password default
- Gunakan password yang kuat (minimum 16 karakter)
- Jangan commit file `.env` ke repository

### 2. Network Security
```bash
# Untuk production, batasi akses port
# Edit docker-compose.yml, hapus port mapping yang tidak perlu
# Contoh: hanya expose port 80 untuk frontend
```

### 3. SSL/TLS (Production)
```bash
# Gunakan reverse proxy seperti Nginx atau Traefik
# dengan SSL certificate dari Let's Encrypt
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Error
```bash
# Cek status MySQL
docker-compose logs mysql

# Restart MySQL
docker-compose restart mysql
```

#### 2. Frontend tidak bisa akses Backend
```bash
# Cek network connectivity
docker-compose exec frontend ping backend

# Cek nginx config
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf
```

#### 3. Migration Error
```bash
# Manual migration
docker-compose exec backend npx sequelize-cli db:migrate --env production

# Reset database (HATI-HATI)
docker-compose exec backend npx sequelize-cli db:migrate:undo:all --env production
docker-compose exec backend npx sequelize-cli db:migrate --env production
```

#### 4. Permission Issues
```bash
# Fix ownership
sudo chown -R $USER:$USER .

# Fix permissions
chmod +x backend/scripts/init-db.sh
```

### Performance Issues

#### 1. Slow Database
```bash
# Increase MySQL memory
# Edit docker-compose.yml, tambahkan:
# command: --innodb-buffer-pool-size=512M
```

#### 2. High Memory Usage
```bash
# Monitor memory
docker stats --no-stream

# Restart services
docker-compose restart
```

## 📈 Production Deployment

### 1. Server Requirements
- **CPU**: 2+ cores
- **RAM**: 4GB+ (recommended 8GB)
- **Storage**: 50GB+ SSD
- **Network**: Stable internet connection

### 2. Additional Services
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  # Nginx reverse proxy
  nginx-proxy:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx-proxy.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
  
  # Monitoring
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
  
  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
```

### 3. Backup Strategy
```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Database backup
docker-compose exec mysql mysqldump -u root -p$MYSQL_ROOT_PASSWORD $MYSQL_DATABASE > $BACKUP_DIR/db_$DATE.sql

# Application files backup
tar -czf $BACKUP_DIR/app_$DATE.tar.gz .

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

## 📞 Support

Jika mengalami masalah:
1. Cek logs: `docker-compose logs`
2. Cek dokumentasi troubleshooting di atas
3. Restart services: `docker-compose restart`
4. Hubungi tim development

---

**⚠️ PENTING**: Selalu backup data sebelum melakukan update atau maintenance!