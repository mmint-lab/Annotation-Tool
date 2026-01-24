#!/bin/bash

# Deployment Script
# Usage: ./deploy.sh

set -e

echo "🚀 Deploying Annotation Tool..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get current IP address for sharing
get_ip() {
    IP=$(hostname -I | awk '{print $1}' 2>/dev/null || \
         ip route get 8.8.8.8 | awk '{print $7; exit}' 2>/dev/null || \
         echo "localhost")
    echo $IP
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${YELLOW}Docker not found. Installing...${NC}"
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        rm get-docker.sh
        echo -e "${GREEN}✅ Docker installed${NC}"
        echo -e "${YELLOW}Please log out and back in, then run this script again${NC}"
        exit 0
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${YELLOW}Installing Docker Compose...${NC}"
        sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    fi
}

# Set up environment if not exists
setup_env() {
    if [ ! -f .env ]; then
        echo -e "${BLUE}Creating environment file...${NC}"
        JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "change-this-secret-key-$(date +%s)")
        cat > .env << EOF
JWT_SECRET_KEY=$JWT_SECRET
DEFAULT_PROJECT_NAME=Annotation Tool
NODE_ENV=production
EOF
        echo -e "${GREEN}✅ Environment configured${NC}"
    fi
}

# Build and deploy
deploy() {
    echo -e "${BLUE}📦 Building React frontend...${NC}"
    cd frontend
    npm install --production
    npm run build
    cd ..
    
    echo -e "${BLUE}🐳 Starting containers...${NC}"
    docker-compose up -d --build
    
    # Wait for containers to start
    sleep 5
    
    echo -e "${GREEN}✅ Deployment completed!${NC}"
}

# Main execution
main() {
    check_docker
    setup_env
    deploy
    
    # Show access information
    SERVER_IP=$(get_ip)
    
    echo ""
    echo -e "${GREEN}🎉 Your Annotation Tool is ready!${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}📱 Access URLs:${NC}"
    echo -e "  Local: ${GREEN}http://localhost:8000${NC}"
    echo -e "  Network: ${GREEN}http://$SERVER_IP:8000${NC}"
    echo ""
    echo -e "${BLUE}🛠️  Management:${NC}"
    echo "  Check status: docker-compose ps"
    echo "  View logs: docker-compose logs -f"
    echo "  Stop: docker-compose down"
    echo "  Restart: docker-compose restart"
    echo ""
    echo -e "${YELLOW}👥 Share with others:${NC}"
    echo "  Anyone on your network can access: http://$SERVER_IP:8000"
}

main
