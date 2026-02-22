#!/bin/bash
# Docker management script for diet-mood-next

set -e

COMMAND=${1:-help}

show_help() {
    echo "Diet Mood Next - Docker Management"
    echo ""
    echo "Usage: ./docker.sh [command]"
    echo ""
    echo "Commands:"
    echo "  build       Build the Docker image"
    echo "  up          Start containers in detached mode"
    echo "  down        Stop and remove containers"
    echo "  restart     Restart the container"
    echo "  logs        View container logs (follow mode)"
    echo "  status      Check container and health status"
    echo "  shell       Open a shell in the running container"
    echo "  update      Pull latest code, rebuild and restart"
    echo "  health      Test health endpoints"
    echo ""
}

case $COMMAND in
    build)
        echo "Building Docker image..."
        docker compose build --no-cache
        ;;
    up|start)
        echo "Starting containers..."
        docker compose up -d
        echo ""
        echo "Services available at:"
        echo "  - App:       http://localhost:3001"
        echo "  - Health:    http://localhost:3008/health"
        ;;
    down|stop)
        echo "Stopping containers..."
        docker compose down
        ;;
    restart)
        echo "Restarting container..."
        docker compose restart
        ;;
    logs)
        echo "Viewing logs (Ctrl+C to exit)..."
        docker compose logs -f
        ;;
    status)
        echo "Container status:"
        docker compose ps
        echo ""
        echo "Health check (port 3001):"
        curl -s http://localhost:3001/api/health | jq . 2>/dev/null || curl -s http://localhost:3001/api/health
        echo ""
        echo "Health check (port 3008):"
        curl -s http://localhost:3008/health | jq . 2>/dev/null || curl -s http://localhost:3008/health
        ;;
    shell)
        echo "Opening shell in container..."
        docker compose exec diet-mood-next sh
        ;;
    update)
        echo "Updating container..."
        docker compose down
        docker compose build --no-cache
        docker compose up -d
        ;;
    health)
        echo "Testing health endpoints..."
        echo ""
        echo "Main app (port 3001):"
        curl -s http://localhost:3001/api/health | jq . 2>/dev/null || curl -s http://localhost:3001/api/health
        echo ""
        echo ""
        echo "Health server (port 3008):"
        curl -s http://localhost:3008/health | jq . 2>/dev/null || curl -s http://localhost:3008/health
        echo ""
        ;;
    *)
        show_help
        ;;
esac
