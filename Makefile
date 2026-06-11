.PHONY: help docker-build docker-up docker-down docker-logs docker-clean migrate-dev migrate-prod db-shell app-shell build dev start test lint format docker-ps

# Default target
help:
	@echo "Habit Tracker API - Available Commands"
	@echo ""
	@echo "Development:"
	@echo "  make dev              - Start local dev server (SQLite)"
	@echo "  make build            - Build TypeScript"
	@echo "  make start            - Start production server"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build     - Build Docker image"
	@echo "  make docker-up        - Start all Docker services"
	@echo "  make docker-down      - Stop all Docker services"
	@echo "  make docker-ps        - Show Docker container status"
	@echo "  make docker-logs      - Follow app container logs"
	@echo "  make docker-db-logs   - Follow MySQL container logs"
	@echo "  make docker-clean     - Remove containers, volumes (full reset)"
	@echo ""
	@echo "Database:"
	@echo "  make migrate-dev      - Run Prisma migration (dev)"
	@echo "  make migrate-prod     - Run Prisma migration (prod)"
	@echo "  make db-shell         - Access MySQL shell"
	@echo ""
	@echo "Development Tools:"
	@echo "  make app-shell        - SSH into app container"
	@echo "  make test             - Run tests"
	@echo "  make lint             - Run ESLint"
	@echo "  make format           - Format code with Prettier"

# Local Development
dev:
	npm run dev

build:
	npm run build

start: build
	npm start

test:
	npm test

lint:
	npm run lint

format:
	npm run format

# Docker Commands
docker-build:
	docker-compose build

docker-up:
	docker-compose up -d
	@echo "✓ Services started"
	@echo "  App: http://localhost:3000"
	@echo "  DB: localhost:3306"

docker-down:
	docker-compose down
	@echo "✓ Services stopped"

docker-ps:
	docker-compose ps

docker-logs:
	docker-compose logs -f app

docker-db-logs:
	docker-compose logs -f mysql

docker-clean:
	docker-compose down -v
	@echo "✓ All containers and volumes removed"

# Database Operations
migrate-dev:
	docker-compose exec app npx prisma migrate dev

migrate-prod:
	docker-compose exec app npx prisma migrate deploy

db-shell:
	docker-compose exec mysql mysql -u habit_user -phabit_password habit_tracker

# Container Access
app-shell:
	docker-compose exec app sh

# Quick Setup
setup: docker-build docker-up
	@echo "✓ Docker setup complete"
	@echo "  Run 'make docker-logs' to see app logs"
	@echo "  Run 'make migrate-dev' to initialize database"

# Health Check
health:
	@curl -s http://localhost:3000/api/health | jq . || echo "API not responding"

# Full Reset (Warning: Deletes all data)
reset: docker-clean docker-build docker-up
	@echo "✓ Full reset complete - all containers rebuilt"
	@echo "  WARNING: All database data has been deleted"
