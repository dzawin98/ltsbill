# 🚀 Panduan Deployment GASS di Proxmox dengan Docker

## 📋 Prasyarat

### 1. Container/VM Proxmox
- **OS**: Ubuntu 20.04/22.04 LTS atau Debian 11/12
- **RAM**: Minimum 2GB (Recommended 4GB)
- **Storage**: Minimum 10GB (Recommended 20GB)
- **CPU**: Minimum 2 cores
- **Network**: Bridge network dengan akses internet

### 2. Akses Console
- Akses ke Proxmox Web Interface
- Console access ke container/VM
- User dengan sudo privileges

## 🛠️ Langkah 1: Persiapan System

### Update System
```bash
# Update package list
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git nano htop
```

### Install Docker
```bash
# Remove old Docker versions
sudo apt remove docker docker-engine docker.io containerd runc

# Install Docker dependencies
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Add user to docker group
sudo usermod -aG docker $USER

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Verify Docker installation
docker --version
```

### Install Docker Compose
```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make executable
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
```

## 📥 Langkah 2: Clone Repository

```bash
# Clone repository GASS
git clone https://github.com/dzawin98/ltsbill.git

# Masuk ke direktori project
cd ltsbill

# Lihat struktur project
ls -la
```

## ⚙️ Langkah 3: Konfigurasi Environment

### Copy dan Edit Environment File
```bash
# Copy template environment
cp .env.example .env

# Edit file environment
nano .env
```

### Konfigurasi .env untuk Proxmox
```bash
# Database Configuration
DB_HOST=mysql
DB_PORT=3306
DB_NAME=gass_db
DB_USER=gass_user
DB_PASSWORD=your_secure_password_here
DB_ROOT_PASSWORD=your_root_password_here

# Application Environment
NODE_ENV=production
BACKEND_PORT=3001
FRONTEND_PORT=80

# MikroTik Configuration (Optional)
MIKROTIK_HOST=192.168.1.1
MIKROTIK_USERNAME=admin
MIKROTIK_PASSWORD=your_mikrotik_password
MIKROTIK_PORT=8728

# Security Keys (GENERATE NEW ONES!)
JWT_SECRET=your_jwt_secret_key_32_characters
ENCRYPTION_KEY=your_encryption_key_32_characters

# Timezone
TZ=Asia/Jakarta

# Logging
LOG_LEVEL=info

# Redis (Optional)
REDIS_URL=redis://redis:6379
```

### Generate Secure Keys
```bash
# Generate JWT Secret (32 characters)
openssl rand -base64 32

# Generate Encryption Key (32 characters)
openssl rand -base64 32
```

## 🐳 Langkah 4: Build dan Deploy

### Option A: Menggunakan Script Deployment (Recommended)
```bash
# Make script executable
chmod +x deploy.sh

# Run deployment script
./deploy.sh
```

### Option B: Manual Docker Compose
```bash
# Build dan start services
docker-compose up -d --build

# Check status services
docker-compose ps

# View logs
docker-compose logs -f
```

## 🔍 Langkah 5: Verifikasi Deployment

### Check Container Status
```bash
# List running containers
docker ps

# Check specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mysql
```

### Health Checks
```bash
# Check backend health
curl http://localhost:3001/api/health

# Check frontend
curl http://localhost

# Check database connection
docker-compose exec mysql mysql -u gass_user -p gass_db
```

### Database Migration
```bash
# Run database migrations
docker-compose exec backend npm run migrate

# (Optional) Run seeders
docker-compose exec backend npm run seed
```

## 🌐 Langkah 6: Network Configuration

### Proxmox Network Setup
```bash
# Check container IP
docker inspect ltsbill_frontend_1 | grep IPAddress

# Check port bindings
docker port ltsbill_frontend_1
docker port ltsbill_backend_1
```

### Firewall Configuration (jika diperlukan)
```bash
# Allow HTTP traffic
sudo ufw allow 80/tcp

# Allow backend API
sudo ufw allow 3001/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## 📊 Langkah 7: Monitoring dan Maintenance

### Monitoring Commands
```bash
# Monitor resource usage
docker stats

# View all logs
docker-compose logs -f --tail=100

# Check disk usage
df -h
docker system df
```

### Backup Database
```bash
# Create backup directory
mkdir -p ~/backups

# Backup database
docker-compose exec mysql mysqldump -u root -p gass_db > ~/backups/gass_backup_$(date +%Y%m%d_%H%M%S).sql
```

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Container Won't Start
```bash
# Check logs
docker-compose logs [service_name]

# Check Docker daemon
sudo systemctl status docker

# Restart Docker
sudo systemctl restart docker
```

#### 2. Database Connection Issues
```bash
# Check MySQL container
docker-compose exec mysql mysql -u root -p

# Reset database
docker-compose down -v
docker-compose up -d
```

#### 3. Port Already in Use
```bash
# Check what's using the port
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :3001

# Kill process using port
sudo kill -9 [PID]
```

#### 4. Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
sudo chmod -R 755 .
```

### Performance Optimization
```bash
# Clean up unused Docker resources
docker system prune -a

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune
```

## 🔒 Security Considerations

### 1. Change Default Passwords
- Database passwords
- JWT secrets
- MikroTik credentials

### 2. Network Security
```bash
# Use specific network for containers
docker network create gass-network

# Limit external access
# Only expose necessary ports
```

### 3. Regular Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose pull
docker-compose up -d
```

## 📱 Akses Aplikasi

### Local Access
- **Frontend**: http://[PROXMOX_IP]
- **Backend API**: http://[PROXMOX_IP]:3001
- **Health Check**: http://[PROXMOX_IP]:3001/api/health

### External Access (jika diperlukan)
1. Configure port forwarding di Proxmox
2. Setup reverse proxy (Nginx/Apache)
3. Configure SSL certificate

## 📋 Checklist Deployment

- [ ] ✅ Proxmox container/VM ready
- [ ] ✅ Docker dan Docker Compose installed
- [ ] ✅ Repository cloned
- [ ] ✅ Environment variables configured
- [ ] ✅ Secure passwords generated
- [ ] ✅ Application deployed
- [ ] ✅ Database migrated
- [ ] ✅ Health checks passed
- [ ] ✅ Network access verified
- [ ] ✅ Backup strategy implemented
- [ ] ✅ Monitoring setup

## 🆘 Support Commands

### Quick Commands Reference
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f

# Update application
git pull && docker-compose up -d --build

# Backup database
docker-compose exec mysql mysqldump -u root -p gass_db > backup.sql

# Clean up
docker system prune -a
```

---

**🎉 Selamat! Aplikasi GASS sekarang berjalan di Proxmox dengan Docker!**

Untuk bantuan lebih lanjut, silakan cek:
- `DEPLOYMENT.md` - Panduan deployment detail
- `PRODUCTION_CHECKLIST.md` - Checklist production
- `README.md` - Dokumentasi lengkap aplikasi