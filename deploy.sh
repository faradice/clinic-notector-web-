#!/bin/bash

# Clinic Notector Music - Deployment Script
# Usage: ./deploy.sh [dev|prod|stop|logs|backup]

set -e

COMPOSE_FILE="docker-compose.yml"
ENV=${1:-dev}

case "$ENV" in
  dev)
    echo "🚀 Starting development environment..."
    docker-compose up -d postgres
    echo "✅ PostgreSQL started on port 5432"
    echo ""
    echo "To start backend: cd backend && ./gradlew bootRun"
    echo "To start frontend: cd frontend && npm run dev"
    ;;

  prod)
    echo "🚀 Building and deploying production environment..."

    # Build images
    echo "📦 Building Docker images..."
    docker-compose build --no-cache

    # Start services
    echo "🎬 Starting services..."
    docker-compose up -d

    # Wait for services to be healthy
    echo "⏳ Waiting for services to be ready..."
    sleep 10

    # Check health
    echo "🏥 Checking service health..."

    if docker-compose ps | grep -q "healthy"; then
      echo "✅ Services are healthy!"
      echo ""
      echo "🌐 Application is running at:"
      echo "   Frontend: http://localhost"
      echo "   Backend:  http://localhost:8080/api"
      echo "   Health:   http://localhost:8080/api/actuator/health"
      echo ""
      echo "📊 View logs: ./deploy.sh logs"
      echo "🛑 Stop:      ./deploy.sh stop"
    else
      echo "❌ Some services are unhealthy. Check logs:"
      docker-compose logs --tail=50
      exit 1
    fi
    ;;

  stop)
    echo "🛑 Stopping all services..."
    docker-compose down
    echo "✅ All services stopped"
    ;;

  logs)
    SERVICE=${2:-}
    if [ -z "$SERVICE" ]; then
      docker-compose logs -f
    else
      docker-compose logs -f "$SERVICE"
    fi
    ;;

  backup)
    BACKUP_DIR="./backups"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)

    echo "💾 Creating backup..."
    mkdir -p "$BACKUP_DIR"

    # Backup database
    docker exec clinic-notector-db pg_dump -U clinic_user clinic_notector | gzip > "$BACKUP_DIR/db_$TIMESTAMP.sql.gz"

    echo "✅ Backup created: $BACKUP_DIR/db_$TIMESTAMP.sql.gz"

    # List recent backups
    echo ""
    echo "📋 Recent backups:"
    ls -lh "$BACKUP_DIR" | tail -5
    ;;

  clean)
    echo "🧹 Cleaning up Docker resources..."
    docker-compose down -v
    docker system prune -f
    echo "✅ Cleanup complete"
    ;;

  *)
    echo "Usage: ./deploy.sh [dev|prod|stop|logs|backup|clean]"
    echo ""
    echo "Commands:"
    echo "  dev     - Start database only (for local development)"
    echo "  prod    - Build and deploy full production stack"
    echo "  stop    - Stop all services"
    echo "  logs    - View logs (optional: specify service name)"
    echo "  backup  - Create database backup"
    echo "  clean   - Stop services and remove volumes"
    exit 1
    ;;
esac
