# 🏢 GASS (RTRW Management System)

**Sistem Manajemen RTRW Terintegrasi dengan MikroTik**

Sistem manajemen pelanggan RTRW yang terintegrasi dengan router MikroTik untuk otomatisasi billing, suspend/unsuspend otomatis, dan manajemen infrastruktur jaringan.

## 🚀 Fitur Utama

### 📊 Dashboard & Monitoring
- Dashboard real-time dengan statistik pelanggan
- Monitoring status jaringan dan router
- Laporan keuangan dan billing
- Mode gelap/terang dengan preferensi sistem

### 👥 Manajemen Pelanggan
- CRUD pelanggan dengan validasi lengkap
- Integrasi PPP Secret MikroTik
- Status billing dan layanan real-time
- Riwayat transaksi dan pembayaran

### 🌐 Integrasi MikroTik
- Auto suspend/unsuspend berdasarkan status billing
- Manajemen PPP Secret otomatis
- Monitoring koneksi aktif
- Sinkronisasi status dengan router

### 💰 Sistem Billing
- Billing otomatis bulanan
- Cron job auto suspend tanggal 6 setiap bulan
- Multiple metode pembayaran
- Laporan keuangan detail

### 🗺️ Manajemen Infrastruktur
- Manajemen Area/Wilayah
- Manajemen Router dan ODP
- Paket layanan dengan konfigurasi MikroTik
- Mapping pelanggan ke infrastruktur

## 🛠️ Teknologi

### Frontend
- **React 18** dengan TypeScript
- **Vite** untuk build tool
- **Tailwind CSS** untuk styling
- **Shadcn/ui** untuk komponen UI
- **React Query** untuk state management
- **React Router** untuk routing
- **Next Themes** untuk mode gelap/terang

### Backend
- **Node.js** dengan Express.js
- **TypeScript** untuk type safety
- **Sequelize ORM** dengan MySQL
- **Node-RouterOS** untuk integrasi MikroTik
- **Node-Cron** untuk scheduled tasks
- **Moment.js** untuk timezone handling

### Database
- **MySQL 8.0** dengan migrasi Sequelize
- **Redis** untuk caching (opsional)

### DevOps
- **Docker** & **Docker Compose**
- **Nginx** reverse proxy
- Health checks dan monitoring
- Automated deployment scripts

## 📋 Prerequisites

- **Docker** 20.10+
- **Docker Compose** 2.0+
- **Node.js** 18+ (untuk development)
- **MySQL** 8.0+ (jika tidak menggunakan Docker)
- **MikroTik Router** dengan RouterOS API enabled

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone <repository-url> gass
cd gass
```

### 2. Setup Environment
```bash
# Copy environment template
cp .env.example .env

# Edit konfigurasi sesuai kebutuhan
nano .env
```

### 3. Deploy dengan Docker

#### Windows (PowerShell)
```powershell
# Jalankan script deployment
.\deploy.ps1
```

#### Linux/macOS
```bash
# Beri permission execute
chmod +x deploy.sh

# Jalankan script deployment
./deploy.sh
```

#### Manual Docker Compose
```bash
# Build dan start services
docker-compose build
docker-compose up -d

# Jalankan migrasi database
docker-compose exec backend npm run migrate
```

### 4. Akses Aplikasi
- **Frontend**: http://localhost
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

## 🔧 Development

### Setup Development Environment
```bash
# Install dependencies
npm install
cd backend && npm install

# Setup database
mysql -u root -p
CREATE DATABASE rtrw_db;

# Run migrations
cd backend
npm run migrate

# Start development servers
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
npm run dev
```

### Database Management
```bash
# Create migration
npx sequelize-cli migration:generate --name migration-name

# Run migrations
npm run migrate

# Undo last migration
npm run migrate:undo

# Reset database
npm run db:reset
```

## 📁 Struktur Proyek

```
gass/
├── src/                    # Frontend React app
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom hooks
│   ├── utils/             # Utility functions
│   └── types/             # TypeScript types
├── backend/               # Backend Node.js app
│   ├── src/               # TypeScript source
│   ├── models/            # Sequelize models
│   ├── migrations/        # Database migrations
│   ├── routes/            # API routes
│   └── utils/             # Backend utilities
├── docker-compose.yml     # Docker services
├── Dockerfile             # Frontend container
├── backend/Dockerfile     # Backend container
└── nginx.conf            # Nginx configuration
```

## 🔐 Konfigurasi MikroTik

### 1. Enable API
```bash
# Di MikroTik terminal
/ip service enable api
/ip service set api port=8728
```

### 2. Create API User
```bash
# Buat user khusus untuk API
/user add name=api-user password=secure-password group=full
```

### 3. Configure PPP Profiles
```bash
# Buat profile untuk paket internet
/ppp profile add name="10Mbps" rate-limit="10M/10M"
/ppp profile add name="20Mbps" rate-limit="20M/20M"
```

## 📊 Fitur Auto Suspend

Sistem memiliki cron job yang berjalan setiap tanggal 6 pukul 00:01 WIB untuk:

1. **Cek pelanggan** dengan status `belum_lunas`
2. **Cek tagihan pending** antara tanggal 1-5 bulan berjalan
3. **Disable PPP Secret** di MikroTik
4. **Update status** pelanggan di database
5. **Log aktivitas** untuk audit

### Manual Testing
```bash
# Test auto suspend via API
curl -X POST http://localhost:3001/api/trigger-auto-suspend

# Test via UI
# Akses menu "Auto Suspend Testing" di dashboard
```

## 🔍 Monitoring & Logging

### Health Checks
```bash
# Check service status
docker-compose ps

# Check health endpoints
curl http://localhost:3001/api/health
```

### Logs
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

### Database Backup
```bash
# Backup database
docker-compose exec mysql mysqldump -u root -p rtrw_db > backup.sql

# Restore database
docker-compose exec -T mysql mysql -u root -p rtrw_db < backup.sql
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Error
```bash
# Check MySQL status
docker-compose logs mysql

# Restart MySQL
docker-compose restart mysql
```

#### 2. MikroTik API Error
- Pastikan API service enabled
- Cek kredensial user API
- Verifikasi network connectivity
- Cek firewall rules

#### 3. Frontend tidak load
```bash
# Check nginx config
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf

# Restart frontend
docker-compose restart frontend
```

#### 4. Migration Error
```bash
# Manual migration
docker-compose exec backend npm run migrate

# Reset and re-migrate
docker-compose exec backend npm run db:reset
```

## 📈 Production Deployment

### Security Checklist
- [ ] Ganti semua password default
- [ ] Setup SSL/TLS certificate
- [ ] Configure firewall rules
- [ ] Enable audit logging
- [ ] Setup backup strategy
- [ ] Configure monitoring alerts

### Performance Optimization
- [ ] Setup Redis caching
- [ ] Configure database indexing
- [ ] Enable gzip compression
- [ ] Setup CDN untuk static assets
- [ ] Configure load balancing

### Backup Strategy
```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Database backup
docker-compose exec mysql mysqldump -u root -p$MYSQL_ROOT_PASSWORD $MYSQL_DATABASE > $BACKUP_DIR/db_$DATE.sql

# Application backup
tar -czf $BACKUP_DIR/app_$DATE.tar.gz .

# Cleanup old backups (keep 7 days)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 📞 Support

Untuk bantuan teknis:
1. Cek dokumentasi troubleshooting
2. Review logs aplikasi
3. Hubungi tim development

---

**⚠️ PENTING**: Selalu backup data sebelum melakukan update atau maintenance!

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/1bc0f2aa-328a-45a5-831d-00be4b926630) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/1bc0f2aa-328a-45a5-831d-00be4b926630) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
