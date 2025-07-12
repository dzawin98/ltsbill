#!/bin/bash

# GASS Deployment Script
# Usage: ./deploy.sh [environment]
# Environment: dev, staging, production (default: dev)

set -e

ENV=${1:-dev}
COMPOSE_FILE="docker-compose.yml"

echo "🚀 Starting GASS deployment for environment: $ENV"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    print_status "Checking Docker..."
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Check if docker-compose is available
check_compose() {
    print_status "Checking Docker Compose..."
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install it and try again."
        exit 1
    fi
    print_success "Docker Compose is available"
}

# Check if .env file exists
check_env() {
    print_status "Checking environment file..."
    if [ ! -f ".env" ]; then
        print_warning ".env file not found. Creating from .env.example..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_warning "Please edit .env file with your configuration before continuing."
            read -p "Press Enter to continue after editing .env file..."
        else
            print_error ".env.example file not found. Please create .env file manually."
            exit 1
        fi
    fi
    print_success "Environment file found"
}

# Build images
build_images() {
    print_status "Building Docker images..."
    docker-compose build --no-cache
    print_success "Images built successfully"
}

# Start services
start_services() {
    print_status "Starting services..."
    docker-compose up -d
    print_success "Services started"
}

# Wait for services to be healthy
wait_for_services() {
    print_status "Waiting for services to be healthy..."
    
    # Wait for MySQL
    print_status "Waiting for MySQL..."
    timeout 60 bash -c 'until docker-compose exec mysql mysqladmin ping -h localhost --silent; do sleep 2; done'
    print_success "MySQL is ready"
    
    # Wait for Backend
    print_status "Waiting for Backend..."
    timeout 60 bash -c 'until curl -f http://localhost:3001/api/health > /dev/null 2>&1; do sleep 2; done'
    print_success "Backend is ready"
    
    # Wait for Frontend
    print_status "Waiting for Frontend..."
    timeout 60 bash -c 'until curl -f http://localhost > /dev/null 2>&1; do sleep 2; done'
    print_success "Frontend is ready"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    docker-compose exec backend npm run migrate
    print_success "Database migrations completed"
}

# Show deployment info
show_info() {
    print_success "🎉 Deployment completed successfully!"
    echo ""
    echo "📋 Service Information:"
    echo "  Frontend: http://localhost"
    echo "  Backend API: http://localhost:3001"
    echo "  Health Check: http://localhost:3001/api/health"
    echo ""
    echo "🔧 Management Commands:"
    echo "  View logs: docker-compose logs -f"
    echo "  Stop services: docker-compose down"
    echo "  Restart services: docker-compose restart"
    echo "  View status: docker-compose ps"
    echo ""
    echo "📊 Service Status:"
    docker-compose ps
}

# Cleanup function
cleanup() {
    if [ $? -ne 0 ]; then
        print_error "Deployment failed. Cleaning up..."
        docker-compose down
    fi
}

# Set trap for cleanup
trap cleanup EXIT

# Main deployment flow
main() {
    echo "🏗️  GASS (RTRW Management System) Deployment"
    echo "Environment: $ENV"
    echo "Compose file: $COMPOSE_FILE"
    echo ""
    
    check_docker
    check_compose
    check_env
    
    # Stop existing services
    print_status "Stopping existing services..."
    docker-compose down
    
    build_images
    start_services
    wait_for_services
    run_migrations
    
    show_info
}

# Run main function
main

print_success "✅ Deployment script completed successfully!"