#!/bin/bash

# Deploy Script for dna Hub with Nginx Proxy
# Simple deployment script like SBC setup

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check which docker compose version is available
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    print_error "Neither 'docker compose' nor 'docker-compose' found"
    exit 1
fi

# Start Nginx Proxy (if not running)
start_proxy() {
    print_info "Checking Nginx Proxy..."
    
    if ! docker ps | grep -q "proxy"; then
        print_info "Starting Nginx Proxy..."
        cd SERVER
        $DOCKER_COMPOSE up -d
        cd ..
        sleep 5
        print_success "Nginx Proxy started"
    else
        print_success "Nginx Proxy is already running"
    fi
}

# Build application
build() {
    print_info "Building Docker image..."
    $DOCKER_COMPOSE build --no-cache
    print_success "Docker image built"
}

# Start application
start() {
    print_info "Starting dna Hub..."
    $DOCKER_COMPOSE up -d
    print_success "dna Hub started"
    print_info "Application will be available at: https://dna.sbc.om"
    print_warning "Wait 1-2 minutes for SSL certificate to be generated"
}

# Stop application
stop() {
    print_info "Stopping dna Hub..."
    $DOCKER_COMPOSE down
    print_success "dna Hub stopped"
}

# View logs
logs() {
    $DOCKER_COMPOSE logs -f
}

# Initialize database
init() {
    print_info "Initializing database..."
    $DOCKER_COMPOSE exec app npm run db:init
    print_success "Database initialized"
}

# Show status
status() {
    print_info "=== Nginx Proxy Status ==="
    docker ps --filter name=proxy --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    echo ""
    print_info "=== dna Hub Status ==="
    $DOCKER_COMPOSE ps
}

# Full deployment
deploy() {
    print_info "Starting full deployment..."
    echo ""
    print_warning "⚠️  IMPORTANT: Make sure DNS is configured!"
    print_info "Domain: dna.sbc.om → Your Server IP"
    echo ""
    read -p "Press Enter to continue or Ctrl+C to cancel..."
    echo ""
    
    start_proxy
    build
    start
    sleep 5
    init
    
    echo ""
    print_success "✅ Deployment complete!"
    echo ""
    print_info "🌐 Your application is now available at:"
    echo ""
    echo "   https://dna.sbc.om"
    echo ""
    print_warning "⏳ Wait 1-2 minutes for SSL certificate generation"
    echo ""
}

# Show help
show_help() {
    echo ""
    echo "dna Hub - Server Deployment Script"
    echo ""
    echo "Usage: ./deploy-server.sh [command]"
    echo ""
    echo "Commands:"
    echo "  deploy     - Full deployment (proxy + build + start + init)"
    echo "  proxy      - Start Nginx Proxy only"
    echo "  build      - Build Docker image"
    echo "  start      - Start application"
    echo "  stop       - Stop application"
    echo "  restart    - Restart application"
    echo "  logs       - View logs"
    echo "  init       - Initialize database"
    echo "  status     - Show status of all services"
    echo "  help       - Show this help"
    echo ""
    echo "Examples:"
    echo "  ./deploy-server.sh deploy    # Full deployment"
    echo "  ./deploy-server.sh status    # Check status"
    echo "  ./deploy-server.sh logs      # View logs"
    echo ""
    echo "Domain Configuration:"
    echo "  Domain: dna.sbc.om"
    echo "  Email:  admin@sbc.om"
    echo ""
    echo "⚠️  Remember to:"
    echo "  1. Configure DNS (A record) pointing to your server IP"
    echo "  2. Open firewall ports 80 and 443"
    echo "  3. Change JWT_SECRET and CRON_SECRET in docker-compose.yml"
    echo ""
}

# Main
case "${1:-}" in
    deploy)
        deploy
        ;;
    proxy)
        start_proxy
        ;;
    build)
        build
        ;;
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        stop
        sleep 2
        start
        ;;
    logs)
        logs
        ;;
    init)
        init
        ;;
    status)
        status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Invalid command: ${1:-}"
        show_help
        exit 1
        ;;
esac
