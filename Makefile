.PHONY: all help install build test package up down clean migrate

help:
	@echo "GearBids Microservices Platform - Commands:"
	@echo "  make install    - Install dependencies for all microservices & frontend"
	@echo "  make build      - Build frontend and TypeScript services"
	@echo "  make tag-check  - Validate repository-wide version alignment"
	@echo "  make package    - Package versioned tarballs and release manifest into dist-releases/"
	@echo "  make up         - Start complete platform locally via Docker Compose"
	@echo "  make down       - Stop local Docker Compose environment"
	@echo "  make migrate    - Run PostgreSQL schema and seed migrations"

tag-check:
	./devops/scripts/tag-release.sh check

install:
	cd frontend && npm install
	cd services/notification-service && npm install
	cd services/bidding-worker-service && pip3 install -r requirements.txt
	cd services/inspection-service && pip3 install -r requirements.txt

build:
	cd frontend && npm run build
	cd services/auction-service && (if [ -f ./mvnw ]; then ./mvnw clean package -DskipTests -B; else mvn clean package -DskipTests -B; fi)
	cd services/notification-service && npm run build

test:
	@echo "=== Running Auction Service (Spring Boot 4) Tests ==="
	cd services/auction-service && (if [ -f ./mvnw ]; then ./mvnw test -B; else mvn test -B; fi)
	@echo "=== Running Notification Service Tests ==="
	cd services/notification-service && npm test
	@echo "=== Running Bidding Worker Tests ==="
	cd services/bidding-worker-service && pytest tests/
	@echo "=== Running Inspection Service Tests ==="
	cd services/inspection-service && pytest tests/

package:
	./devops/scripts/package-services.sh

up:
	docker-compose up --build -d
	@echo "Platform started! Web frontend accessible at: http://localhost:3000"

down:
	docker-compose down -v

migrate:
	./database/migrate.sh seed
