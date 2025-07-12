# GASS Deployment Script for Windows PowerShell
# Usage: .\deploy.ps1 [environment]
# Environment: dev, staging, production (default: dev)

param(
    [string]$Environment = "dev"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting GASS deployment for environment: $Environment" -ForegroundColor Blue

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if Docker is running
function Test-Docker {
    Write-Status "Checking Docker..."
    try {
        docker info | Out-Null
        Write-Success "Docker is running"
    }
    catch {
        Write-Error "Docker is not running. Please start Docker Desktop and try again."
        exit 1
    }
}

# Check if docker-compose is available
function Test-DockerCompose {
    Write-Status "Checking Docker Compose..."
    try {
        docker-compose --version | Out-Null
        Write-Success "Docker Compose is available"
    }
    catch {
        Write-Error "Docker Compose is not available. Please install Docker Desktop with Compose."
        exit 1
    }
}

# Check if .env file exists
function Test-Environment {
    Write-Status "Checking environment file..."
    if (-not (Test-Path ".env")) {
        Write-Warning ".env file not found."
        if (Test-Path ".env.example") {
            Write-Warning "Creating .env from .env.example..."
            Copy-Item ".env.example" ".env"
            Write-Warning "Please edit .env file with your configuration before continuing."
            Read-Host "Press Enter to continue after editing .env file"
        }
        else {
            Write-Error ".env.example file not found. Please create .env file manually."
            exit 1
        }
    }
    Write-Success "Environment file found"
}

# Build images
function Build-Images {
    Write-Status "Building Docker images..."
    docker-compose build --no-cache
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Images built successfully"
    }
    else {
        Write-Error "Failed to build images"
        exit 1
    }
}

# Start services
function Start-Services {
    Write-Status "Starting services..."
    docker-compose up -d
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Services started"
    }
    else {
        Write-Error "Failed to start services"
        exit 1
    }
}

# Wait for services to be healthy
function Wait-ForServices {
    Write-Status "Waiting for services to be healthy..."
    
    # Wait for MySQL
    Write-Status "Waiting for MySQL..."
    $timeout = 60
    $elapsed = 0
    do {
        Start-Sleep -Seconds 2
        $elapsed += 2
        try {
            docker-compose exec mysql mysqladmin ping -h localhost --silent
            if ($LASTEXITCODE -eq 0) {
                Write-Success "MySQL is ready"
                break
            }
        }
        catch {
            # Continue waiting
        }
    } while ($elapsed -lt $timeout)
    
    if ($elapsed -ge $timeout) {
        Write-Error "MySQL failed to start within timeout"
        exit 1
    }
    
    # Wait for Backend
    Write-Status "Waiting for Backend..."
    $timeout = 60
    $elapsed = 0
    do {
        Start-Sleep -Seconds 2
        $elapsed += 2
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Success "Backend is ready"
                break
            }
        }
        catch {
            # Continue waiting
        }
    } while ($elapsed -lt $timeout)
    
    if ($elapsed -ge $timeout) {
        Write-Error "Backend failed to start within timeout"
        exit 1
    }
    
    # Wait for Frontend
    Write-Status "Waiting for Frontend..."
    $timeout = 60
    $elapsed = 0
    do {
        Start-Sleep -Seconds 2
        $elapsed += 2
        try {
            $response = Invoke-WebRequest -Uri "http://localhost" -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -eq 200) {
                Write-Success "Frontend is ready"
                break
            }
        }
        catch {
            # Continue waiting
        }
    } while ($elapsed -lt $timeout)
    
    if ($elapsed -ge $timeout) {
        Write-Error "Frontend failed to start within timeout"
        exit 1
    }
}

# Run database migrations
function Invoke-Migrations {
    Write-Status "Running database migrations..."
    docker-compose exec backend npm run migrate
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Database migrations completed"
    }
    else {
        Write-Error "Database migrations failed"
        exit 1
    }
}

# Show deployment info
function Show-DeploymentInfo {
    Write-Success "🎉 Deployment completed successfully!"
    Write-Host ""
    Write-Host "📋 Service Information:" -ForegroundColor Yellow
    Write-Host "  Frontend: http://localhost" -ForegroundColor White
    Write-Host "  Backend API: http://localhost:3001" -ForegroundColor White
    Write-Host "  Health Check: http://localhost:3001/api/health" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 Management Commands:" -ForegroundColor Yellow
    Write-Host "  View logs: docker-compose logs -f" -ForegroundColor White
    Write-Host "  Stop services: docker-compose down" -ForegroundColor White
    Write-Host "  Restart services: docker-compose restart" -ForegroundColor White
    Write-Host "  View status: docker-compose ps" -ForegroundColor White
    Write-Host ""
    Write-Host "📊 Service Status:" -ForegroundColor Yellow
    docker-compose ps
}

# Cleanup function
function Invoke-Cleanup {
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Deployment failed. Cleaning up..."
        docker-compose down
    }
}

# Main deployment flow
function Start-Deployment {
    Write-Host "🏗️  GASS (RTRW Management System) Deployment" -ForegroundColor Magenta
    Write-Host "Environment: $Environment" -ForegroundColor White
    Write-Host "Compose file: docker-compose.yml" -ForegroundColor White
    Write-Host ""
    
    Test-Docker
    Test-DockerCompose
    Test-Environment
    
    # Stop existing services
    Write-Status "Stopping existing services..."
    docker-compose down
    
    Build-Images
    Start-Services
    Wait-ForServices
    Invoke-Migrations
    
    Show-DeploymentInfo
}

# Error handling
trap {
    Invoke-Cleanup
    Write-Error "An error occurred: $_"
    exit 1
}

# Run main function
Start-Deployment

Write-Success "✅ Deployment script completed successfully!"
Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")