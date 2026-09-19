# PulsePoll — Real-Time Live Polling Tool

[![Go](https://img.shields.io/badge/Go-1.22+-00ADD8?style=flat&logo=go)](https://golang.org)
[![Gin Framework](https://img.shields.io/badge/Gin-v1.10.0-008ECF?style=flat&logo=go)](https://gin-gonic.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-v7.0-47A248?style=flat&logo=mongodb)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-v7.2-DC382D?style=flat&logo=redis)](https://redis.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

> A production-ready, full-stack live polling application built for the **HCL / GUVI Developer Task**. PulsePoll allows creators to launch instant polls, share direct links or QR codes, and watch audience votes update dynamically in real time with **zero page refreshes**.

---

## Table of Contents
1. [Core Flow & Architecture](#core-flow--architecture)
2. [Why MongoDB + Redis?](#why-mongodb--redis)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Real-Time & Redis Design](#real-time--redis-design)
6. [Security & Validation](#security--validation)
7. [API Documentation](#api-documentation)
8. [Database Schemas & Indexes](#database-schemas--indexes)
9. [Local Development Setup](#local-development-setup)
10. [Docker Compose Deployment](#docker-compose-deployment)
11. [Public Cloud Deployment Guide](#public-cloud-deployment-guide)
12. [Testing & Verification](#testing--verification)

---

## Core Flow & Architecture

```
   [Poll Creator] ──> React Frontend (/polls/create)
                             │
                             ▼
                      Go / Gin REST API (/api/polls)
                             │
                             ▼
                      MongoDB (Persist Poll & Options)
                             │
                             ▼
                      Redis (Initialize Counters & Cache)

   [Audience] ──────> Public URL (/poll/:slugOrId) [No Login Required]
                             │
                             ▼ (Cast Vote)
                      Go / Gin API (/api/public/polls/:id/vote)
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
       MongoDB (Store Vote)         Redis (Atomic INCR)
                                            │
                                            ▼
                                   Redis Pub/Sub Channel
                                   (poll:{id}:updates)
                                            │
                                            ▼
                                    Go WebSocket Hub
                                            │
                                            ▼
                               Broadcast to Connected Clients
                                            │
                                            ▼
                               React UI Rerenders Instantly
                                 (ZERO PAGE REFRESH)
```

---

## Why MongoDB + Redis?

In high-concurrency real-time systems, mixing transactional persistence with high-frequency reads/writes can bottleneck traditional databases. PulsePoll leverages both engines for their distinct strengths:

| Layer | Technology | Primary Responsibility |
| :--- | :--- | :--- |
| **Persistence** | **MongoDB** | Stores canonical relational records: users, questions, options, settings, and permanent audit logs of every vote with compound indexes. |
| **Real-Time Counters** | **Redis (`INCR`)** | Provides $O(1)$ atomic vote increments. Avoids expensive database aggregation queries on every single incoming vote. |
| **Duplicate Prevention** | **Redis (`SADD`)** | Sub-millisecond voter fingerprint checking via in-memory Redis Sets before querying MongoDB. |
| **Event Distribution** | **Redis (Pub/Sub)** | Decouples the voting ingestion API from WebSocket delivery. Scales effortlessly across multiple backend replicas. |
| **Viewer Presence** | **Redis (SCARD)** | Real-time tracking of active browser connections per poll room. |

---

## Technology Stack

- **Frontend**:
  - React 19 + Vite 8
  - Tailwind CSS v4 (Clean modern typography, subtle borders, soft shadows)
  - Lucide React icons
  - React Router DOM v7
  - Axios (with JWT interceptors and centralized error handling)
  - HTML5 Canvas Confetti & SVG QR Code Generator
- **Backend**:
  - Go 1.22+
  - Gin Web Framework
  - Gorilla WebSocket
  - MongoDB Go Official Driver (`go.mongodb.org/mongo-driver`)
  - Go-Redis v9 (`github.com/redis/go-redis/v9`)
  - JWT Authentication (`github.com/golang-jwt/jwt/v5`)
  - bcrypt password hashing (`golang.org/x/crypto/bcrypt`)
  - Thread-safe sliding-window IP rate limiting
- **Databases**:
  - MongoDB 7.0
  - Redis 7.2

---

## Project Structure

PulsePoll enforces strict separation of concerns with clean architectural boundaries:

```
live-polling-tool/
├── frontend/                     # React Single Page Application (SPA)
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/           # Reusable UI primitives (Button, Input, Card, Modal, etc.)
│   │   │   ├── poll/             # Poll UI (PollOption, PollResult, LiveIndicator, ShareModal)
│   │   │   ├── layout/           # Navbar, Sidebar, Footer
│   │   │   └── charts/           # Vote distribution & timeline charts
│   │   ├── pages/                # Landing, Login, Register, Dashboard, Create, Voting, Results, Analytics, Demo
│   │   ├── layouts/              # RootLayout, DashboardLayout
│   │   ├── hooks/                # useAuth, useWebSocket, useToast
│   │   ├── services/             # Axios API client, authService, pollService, socketService
│   │   ├── context/              # AuthContext, ToastContext
│   │   ├── utils/                # formatters, voter fingerprinting
│   │   ├── App.jsx               # Client router configuration
│   │   └── main.jsx              # React DOM mounting
│   ├── Dockerfile                # Multi-stage Node + Alpine Nginx build
│   └── vite.config.js
│
├── backend/                      # Go High-Performance Microservice
│   ├── cmd/server/main.go        # Server entrypoint & graceful shutdown
│   ├── config/config.go          # Environment configuration loader
│   ├── controllers/              # HTTP request parsing & response serialization
│   ├── services/                 # Business logic, voting validation, Redis coordination
│   ├── repositories/             # MongoDB database interactions & aggregations
│   ├── database/mongodb.go       # MongoDB connection & index configuration
│   ├── redis/                    # Redis client, atomic counters, Pub/Sub channels
│   ├── websocket/                # Gorilla WebSocket Hub, client pump, room dispatch
│   ├── middleware/               # JWT auth, CORS, panic recovery, IP rate limiting
│   ├── validators/               # Deep backend request validation
│   ├── utils/                    # JWT generation, bcrypt, cryptographic slug generator
│   ├── models/                   # Go struct definitions & DTOs
│   ├── tests/                    # Automated unit & integration tests
│   ├── Dockerfile                # Multi-stage Alpine Go binary builder
│   └── go.mod
│
├── docker-compose.yml            # Complete multi-container orchestration
├── .env.example                  # Environment variables template
└── README.md
```

---

## Real-Time & Redis Design

Redis is an active operational participant in live vote processing:

1. **Vote Counters**:
   - `poll:{pollId}:votes:{optionId}` — Redis atomic string/hash counter incremented with `INCR`.
   - `poll:{pollId}:total_votes` — Atomic total votes counter.
2. **Sub-Millisecond Duplicate Protection**:
   - `poll:{pollId}:voters` — Redis Set of SHA-256 voter hashes (`SADD`). If `SADD` returns 0 and `allowVoteChanges` is false, rejection is instantaneous.
3. **Presence Tracking**:
   - `poll:{pollId}:active_users` — Tracks active WebSocket connection IDs (`SADD` on connect, `SREM` on disconnect).
4. **Redis Pub/Sub Channel**:
   - Channel: `poll:{pollId}:updates`
   - Payload example:
     ```json
     {
       "pollId": "652ef1a59f1b2c3d4e5f6a7b",
       "question": "What is your preferred frontend framework?",
       "status": "active",
       "results": [
         { "optionId": "opt-1", "optionText": "React", "votes": 45, "percentage": 45.0 },
         { "optionId": "opt-2", "optionText": "Vue", "votes": 30, "percentage": 30.0 }
       ],
       "totalVotes": 75,
       "activeViewers": 18,
       "lastUpdated": "2026-09-18T20:30:00Z"
     }
     ```
   - All Go backend instances listen to `poll:*:updates` pattern and relay immediately to local connected WebSocket clients in that room.

---

## Security & Validation

- **Never Trust the Client**: Input is validated on both frontend and backend.
  - Question: 5 to 300 characters.
  - Options: 2 to 10 unique, non-empty options.
  - Email: RFC 5322 format.
  - Password: Minimum 8 characters.
- **Bcrypt Password Hashing**: Passwords are never stored in plain text.
- **JWT Authentication**: Secured with HMAC-SHA256 and expiration.
- **Privacy-Conscious Voter Fingerprinting**: Anonymously hashes device entropy without harvesting PII.
- **Rate Limiting**: Sliding-window IP rate limiting prevents spam and brute-force voting.

---

## API Documentation

### Authentication
- `POST /api/auth/register` — Create new user account.
- `POST /api/auth/login` — Authenticate and receive JWT token.
- `GET /api/auth/me` — Retrieve current authenticated user profile.

### Polls (Authenticated)
- `POST /api/polls` — Create a new poll with options and settings.
- `GET /api/polls` — List all polls created by current user.
- `GET /api/polls/:id` — Retrieve poll details.
- `POST /api/polls/:id/close` — Close poll to new votes.
- `DELETE /api/polls/:id` — Delete poll and associated votes.
- `GET /api/polls/stats` — Retrieve creator dashboard totals.
- `GET /api/polls/:id/analytics` — Detailed breakdown and timeline.

### Public Endpoints (No Auth Required)
- `GET /api/public/polls/:idOrSlug` — Get public poll question and options.
- `POST /api/public/polls/:idOrSlug/vote` — Submit vote with option IDs and voter hash.
- `GET /api/public/polls/:idOrSlug/results` — Fetch live tallies.

### Real-Time WebSocket
- `GET /ws/polls/:id` — Connect to live poll room for real-time result broadcasts and active viewer updates.

### Health
- `GET /api/health` — Checks status of Go server, MongoDB, and Redis.

---

## Database Schemas & Indexes

### 1. Users Collection (`users`)
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string",
  "passwordHash": "string",
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```
*Index: `email` (Unique)*

### 2. Polls Collection (`polls`)
```json
{
  "_id": "ObjectId",
  "creatorId": "ObjectId",
  "slug": "string",
  "question": "string",
  "options": [
    { "id": "string", "text": "string" }
  ],
  "settings": {
    "multipleChoice": false,
    "anonymousVoting": true,
    "showResultsAfterVoting": true,
    "allowVoteChanges": false
  },
  "status": "active | closed",
  "expiresAt": "ISODate | null",
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```
*Indexes: `slug` (Unique), `creatorId`, `status`*

### 3. Votes Collection (`votes`)
```json
{
  "_id": "ObjectId",
  "pollId": "ObjectId",
  "optionIds": ["string"],
  "voterHash": "string",
  "ipHash": "string",
  "createdAt": "ISODate"
}
```
*Indexes: `pollId`, Compound: `{ pollId: 1, voterHash: 1 }`*

---

## Local Development Setup

### 1. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 2. Run Backend
```bash
cd backend
go mod download
go run ./cmd/server
# Listening on http://localhost:8080
```

### 3. Run Frontend
```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:5173
```

---

## Docker Compose Deployment

Run the complete 4-tier stack (React + Go + MongoDB + Redis) with a single command:

```bash
docker compose up --build
```

- **Frontend**: Accessible at `http://localhost:3000`
- **Backend API**: Accessible at `http://localhost:8080`
- **Health Check**: `http://localhost:8080/api/health`
- **MongoDB**: Port `27017`
- **Redis**: Port `6379`

---

## Public Cloud Deployment Guide

PulsePoll is structured so it never depends on `localhost`.

### 1. Managed Databases
- **MongoDB Atlas**:
  1. Create a free M0 cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
  2. Whitelist `0.0.0.0/0` or cloud IP in Network Access.
  3. Copy connection string into `MONGO_URI`.
- **Redis Cloud / Upstash**:
  1. Create a free Redis database at [redis.com](https://redis.com) or [upstash.com](https://upstash.com).
  2. Copy Redis URL into `REDIS_URL`.

### 2. Backend Deployment (Render / Railway / Fly.io)
1. Point to the repository root with context directory `/backend`.
2. Set Environment Variables:
   - `PORT=8080`
   - `MONGO_URI=<your-atlas-uri>`
   - `MONGO_DATABASE=pulsepoll`
   - `REDIS_URL=<your-redis-cloud-url>`
   - `JWT_SECRET=<32-char-random-secret>`
   - `FRONTEND_URL=https://your-frontend.vercel.app`
   - `GIN_MODE=release`

### 3. Frontend Deployment (Vercel / Netlify)
1. Set Root Directory: `frontend`
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. Set Environment Variables:
   - `VITE_API_URL=https://your-backend.onrender.com`
   - `VITE_WS_URL=wss://your-backend.onrender.com`

---

## Testing & Verification

### Automated Backend Tests
```bash
cd backend
go test -v ./tests/...
```

### End-to-End Real-Time Test (Zero Refresh)
1. Open the frontend at `http://localhost:5173` (or deployed URL).
2. Log in and create a poll.
3. Open the public poll voting link in **Window A**.
4. Open the live results link in **Window B** side-by-side.
5. In **Window A**, select an option and click **Submit Vote**.
6. **Window B** immediately animates its progress bar and increments the count with **ZERO PAGE REFRESH**.
