# PulsePoll Backend (Go / Gin + MongoDB + Redis)

High-performance real-time polling backend built with Go, Gin, MongoDB, and Redis.

## Architecture Highlights
- **Clean Architecture**: Strict separation of concerns (Controllers -> Services -> Repositories -> Database/Redis).
- **Redis Real-Time Pipeline**:
  - Atomic counters with `INCR` for sub-millisecond vote tally updates.
  - Redis Set `SADD` for O(1) duplicate vote detection.
  - Redis Pub/Sub (`poll:{id}:updates`) dispatching real-time changes to WebSocket listeners.
  - Active viewers tracking with Redis Sets.
- **MongoDB Persistence**:
  - Persistent document storage for users, polls, and votes with compound indexes.
- **Gorilla WebSocket Hub**:
  - Real-time zero-refresh event broadcasting to connected frontend clients.
- **Security**:
  - Bcrypt password hashing.
  - HMAC-SHA256 JWT tokens.
  - Rate limiting per IP on auth and voting endpoints.
  - Privacy-preserving voter hashing.

## Setup & Running Locally

### Prerequisites
- Go 1.22+
- MongoDB instance (local or MongoDB Atlas)
- Redis instance (local or Upstash / Redis Cloud)

### Environment Variables
Copy `.env.example` to `.env`:
```bash
PORT=8080
MONGO_URI=mongodb://localhost:27017
MONGO_DATABASE=pulsepoll
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secure-jwt-secret-key-at-least-32-chars
FRONTEND_URL=http://localhost:5173
GIN_MODE=debug
```

### Commands
```bash
# Download dependencies
go mod download

# Run tests
go test ./tests/...

# Run server
go run ./cmd/server
```
