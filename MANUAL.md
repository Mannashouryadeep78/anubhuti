# Anubhuti System Manual

## 1. Project Workflow
1. **Auth:** `Index.tsx` → Supabase Passcode → JWT/Session.
2. **Discovery:** `Archive.tsx` → `StateDetail.tsx`.
3. **Transaction:** `Checkout.tsx` (Map-based shipping → Razorpay simulation → Kafka Event Log simulation).
4. **Post-Purchase:** `OrderHistory.tsx` (Status tracking: PENDING → SHIPPED → DELIVERED).

## 2. Running the Microservices
The backend is architected as an event-driven system. To start the real services:

### Prerequisites
- Docker & Docker Compose
- Node.js 20+

### Step 1: Start Infrastructure
Navigate to the root and run:
```bash
docker-compose up -d
```
This starts:
- **Kafka Cluster:** (Brokers 1-3) for order events.
- **Redis:** For atomic stock management.
- **Postgres:** Separate DBs for Users, Orders, and Inventory.

### Step 2: Start Services
Each service in `backend/` can be started individually for development:
```bash
cd backend/user-service && npm run dev
cd backend/order-service && npm run dev
cd backend/inventory-service && npm run dev
cd backend/api-gateway && npm run dev
```

## 3. Architecture Documentation
Visit the `/architecture` route in the application to see an interactive blueprint of how these services communicate via Kafka.