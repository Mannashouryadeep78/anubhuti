# ─────────────────────────────────────────────────────────────────────────────
# Anubhuti — Developer commands
# Usage: make <target>
# ─────────────────────────────────────────────────────────────────────────────

.PHONY: up down logs ps build clean seed kafka-topics redis-cli

# Start entire stack
up:
	docker compose up -d
	@echo "Stack started. Services:"
	@echo "  API Gateway:     http://localhost:3000"
	@echo "  Kafka UI:        http://localhost:8090"
	@echo "  Grafana:         http://localhost:3010  (admin / see .env)"
	@echo "  Prometheus:      http://localhost:9090"

# Start only infrastructure (Kafka + Redis + Postgres) without app services
infra:
	docker compose up -d zookeeper kafka-broker-1 kafka-broker-2 kafka-broker-3 \
	  kafka-init redis postgres-users postgres-orders postgres-inventory kafka-ui
	@echo "Infrastructure ready."

# Stop everything
down:
	docker compose down

# Wipe all data volumes (DESTRUCTIVE)
clean:
	docker compose down -v
	@echo "All volumes deleted."

# View logs for a specific service: make logs s=order-service
logs:
	docker compose logs -f $(s)

# Show running containers and ports
ps:
	docker compose ps

# Build all service images
build:
	docker compose build --parallel

# Open a Redis CLI shell
redis-cli:
	docker exec -it anubhuti-redis redis-cli -a $$(grep REDIS_PASSWORD .env | cut -d= -f2)

# List all Kafka topics
kafka-topics:
	docker exec anubhuti-kafka-1 kafka-topics --bootstrap-server localhost:9092 --list

# Watch Kafka consumer group lag
kafka-lag:
	docker exec anubhuti-kafka-1 kafka-consumer-groups \
	  --bootstrap-server localhost:9092 --describe --all-groups

# Scale a service horizontally: make scale s=order-service n=5
scale:
	docker compose up -d --scale $(s)=$(n) $(s)

# Run database migrations manually
migrate-users:
	docker exec -i anubhuti-postgres-users psql \
	  -U $$(grep POSTGRES_USER .env | cut -d= -f2) -d anubhuti_users \
	  < backend/user-service/migrations/001_init.sql

migrate-orders:
	docker exec -i anubhuti-postgres-orders psql \
	  -U $$(grep POSTGRES_USER .env | cut -d= -f2) -d anubhuti_orders \
	  < backend/order-service/migrations/001_init.sql

migrate-inventory:
	docker exec -i anubhuti-postgres-inventory psql \
	  -U $$(grep POSTGRES_USER .env | cut -d= -f2) -d anubhuti_inventory \
	  < backend/inventory-service/migrations/001_init.sql

migrate: migrate-users migrate-orders migrate-inventory
	@echo "All migrations complete."

# Seed inventory with sample products
seed:
	node backend/scripts/seed-inventory.js

# Health check all services
health:
	@curl -sf http://localhost:3000/health && echo " ✓ api-gateway" || echo " ✗ api-gateway"
	@docker exec anubhuti-user-service wget -qO- http://localhost:3001/health > /dev/null \
	  && echo " ✓ user-service" || echo " ✗ user-service"
	@docker exec anubhuti-order-service wget -qO- http://localhost:3002/health > /dev/null \
	  && echo " ✓ order-service" || echo " ✗ order-service"
	@docker exec anubhuti-inventory-service wget -qO- http://localhost:3003/health > /dev/null \
	  && echo " ✓ inventory-service" || echo " ✗ inventory-service"
