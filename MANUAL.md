# Anubhuti System Manual

## 1. Third-Party Account Checklist
To move from simulation to reality, obtain keys from:
- [ ] **Razorpay:** For real payment processing (Sign up -> API Keys -> Test Mode).
- [ ] **EmailJS:** For sending passcodes to users (Verify the IDs in `RequestAccessModal.tsx`).
- [ ] **Supabase:** For the database (Ensure the URL/Key in `lib/supabase.ts` is yours).
- [ ] **Docker Desktop:** Install on your machine to run the backend services.

## 2. Infrastructure (Self-Hosted)
No accounts needed. Run these via `docker-compose up -d`:
- **Kafka Cluster:** (Brokers 1-3) Handles order events asynchronously.
- **Redis:** Manages real-time stock and JWT blacklisting.
- **Postgres:** Stores user data, orders, and inventory.

## 3. Project Workflow
1. **Auth:** `Index.tsx` → Supabase Passcode → JWT/Session.
2. **Discovery:** `Archive.tsx` → `StateDetail.tsx`.
3. **Transaction:** `Checkout.tsx` (Current: Simulation | Target: Razorpay SDK).
4. **Post-Purchase:** `OrderHistory.tsx` (Status tracking: PENDING → SHIPPED → DELIVERED).

## 4. How to Start the Real Backend
1. Install Docker Desktop.
2. Create a `.env` file in the root using `.env.example`.
3. Run `docker-compose up -d`.
4. The services in `backend/` will now have a message bus (Kafka) to talk to each other.