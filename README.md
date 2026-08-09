# Checkpoint

A personal documentation, blogging, and portfolio platform with authentication — articles, devlogs, projects, and a knowledge-graph board, wrapped in a Monkeytype-inspired dark theme.

## Tech Stack

**Backend** (`apps/backend`)
- Go 1.26
- [Echo](https://echo.labstack.com/) — HTTP framework
- PostgreSQL via [pgx/v5](https://github.com/jackc/pgx) (no ORM, sqlc-generated queries)
- [tern](https://github.com/jackc/tern) — database migrations
- [Clerk](https://clerk.com/) — authentication, JWT sessions
- [Zerolog](https://github.com/rs/zerolog) + [New Relic](https://newrelic.com/) — structured logging & APM tracing
- [Koanf](https://github.com/knadh/koanf) — env-based configuration
- [go-playground/validator](https://github.com/go-playground/validator) — request validation

**Frontend** (`apps/frontend`)
- React 18 + Vite
- React Router
- Tiptap — rich text / markdown editor (with collaborative editing via Yjs)
- Mermaid — diagram rendering
- d3-force — knowledge graph / board layout
- Vitest + Testing Library

**Infra**
- Docker / docker-compose (PostgreSQL)
- Bun + Turbo — monorepo tooling
- GitHub Actions — CI (path-filtered backend/frontend jobs)

## Features

### Available now
- Clerk-based authentication (login/register)
- Articles: create, edit, and view (owner + public read)
- Devlogs: per-project dev logs with caching on the frontend
- Projects: CRUD with public/private visibility
- Project board with a graph-style layout
- Admin stats page
- Owner/visitor content visibility rules (RBAC groundwork)
- Rate limiting, CORS, security headers, request tracing, structured logging, New Relic APM
- OpenAPI docs endpoint

### Planned / in progress
See [`BACKLOG.md`](./BACKLOG.md) for the full list. Highlights:
- Search index endpoint for the command-palette ("Finder") to surface articles/projects/devlogs dynamically
- Inline field-level validation errors on the frontend forms
- Admin cross-user read access (full RBAC)
- Article view counts (column exists, increment not wired up)
- Devlog batch sync + offline mode with local queue
- Calendar view for devlogs
- Server-rendered public pages for SEO/social previews
- Repository interfaces + error sentinels for DB backend swappability
- Redis-backed rate limiter (currently in-memory)
- Grafana-based logging (currently Zerolog + New Relic)

## Getting Started

### Prerequisites
- Go 1.26.2+
- PostgreSQL 18+ (or Docker)
- Bun 1.3.13+

### 1. Start the database
```bash
docker-compose up -d
```
Starts PostgreSQL on `localhost:5432`, database `checkpoint`.

### 2. Configure environment
Copy/edit `apps/backend/.env` — uses `CHECKPOINT_*` env vars (database, server, auth, observability). See `CLAUDE.md` for the full variable reference.

### 3. Run the backend
```bash
cd apps/backend
go run ./cmd/login/main.go
```
Server starts on `:8080`. Health check at `GET /status`.

### 4. Run the frontend
```bash
cd apps/frontend
bun install
bun run dev
```

## Common Commands

**Backend**
```bash
go build -o bin/login ./cmd/login/main.go
go test ./...
go fmt ./...
go vet ./...
```

**Frontend**
```bash
bun run build
bun run test
bun run lint
```

**Database**
```bash
docker-compose up -d
docker-compose down
docker-compose logs -f db
```

## Project Structure

```
checkpoint/
├── apps/
│   ├── backend/     # Go API service (Echo, clean architecture)
│   └── frontend/    # React app (Vite)
├── deploy/          # Deployment scripts
├── docs/            # Project documentation
├── scripts/         # Utility scripts
├── docker-compose.yml
├── BACKLOG.md
└── CLAUDE.md        # Architecture & conventions reference
```

For backend architecture details (clean architecture layers, request flow, endpoint-creation workflow), see [`CLAUDE.md`](./CLAUDE.md).
