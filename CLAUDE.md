# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Checkpoint** is a personal documentation and blogging platform with authentication. It's a monorepo with a Go backend (login service) and React frontend. The project stores markdown-based documentation, blogs, and portfolio content with a Monkey type-inspired dark theme.

**Tech Stack:**
- **Backend**: Go 1.26.2, Echo framework
- **Frontend**: React, Bun + Turbo
- **Database**: PostgreSQL (RDBMS chosen for structure)
- **Auth**: Clerk SDK, JWT tokens
- **Observability**: New Relic, Zerolog logging
- **Deployment**: Docker, GitHub Actions (planned)

## npm Safety

Before installing any npm package, read and follow the guidelines in `npm_safety_guide.md` at the project root.

## Architecture

### Clean Architecture Layers

The backend follows clean architecture with clear separation of concerns:

```
HTTP Request → Router (Echo) → Middleware Stack → Handlers → Services → Repositories → Database
```

**Layers** (from `/apps/login/internal`):
- **router/**: HTTP request routing, middleware pipeline orchestration
- **handlers/**: HTTP endpoint handlers, request/response mapping
- **service/**: Business logic, application workflows (currently minimal - needs implementation)
- **repositories/**: Data access layer, database queries
- **database/**: Connection pool, migrations (migrations not yet implemented)
- **middlewares/**: Cross-cutting concerns (rate limiting, auth, tracing, CORS, request IDs)
- **config/**: Environment configuration with Koanf
- **logger/**: Zerolog + New Relic integration
- **errors/**: Custom error types and HTTP error responses
- **validator/**: Input validation using go-playground/validator

### Request Flow

1. **Middleware Pipeline** (global order): Rate Limiter → CORS → Security Headers → Request ID → Tracing → Context → Logger → Panic Recovery
2. **Route Matching**: Echo matches path + method to registered endpoints
3. **Handler**: Business logic is delegated to services
4. **Service Layer**: Services orchestrate repositories and business rules
5. **Repository Layer**: Data access patterns (repo pattern)
6. **Database**: PostgreSQL via pgx (with zerolog integration for slow query logs)

### Key Architectural Decisions

- **Configuration**: Environment variables with `CHECKPOINT_` prefix (koanf for parsing)
- **Error Handling**: Global error handler in middleware returns consistent HTTP error responses
- **Observability**: Request IDs, New Relic APM tracing, structured Zerolog logs, slow query detection
- **Rate Limiting**: Echo middleware with in-memory store (configurable limits)
- **Database**: pgx/v5 for PostgreSQL (prepared statements, no ORM currently)

## Getting Started

### Prerequisites

- Go 1.26.2+
- PostgreSQL 18+
- Bun 1.3.13+ (for frontend/monorepo management)
- Docker (optional, for database)

### Local Development Setup

**1. Start the database:**
```bash
cd /Users/vikrant/projects/checkpoint
docker-compose up -d
```

This starts PostgreSQL on `localhost:5432` with database name `checkpoint`.

**2. Configure environment:**
- Copy `.env` file (already present in `apps/login/.env`) — uses `CHECKPOINT_*` env vars
- Key vars: `CHECKPOINT_DATABASE.*`, `CHECKPOINT_SERVER.PORT`, `CHECKPOINT_AUTH.SECRET_KEY`
- For local dev, defaults in `.env` should work

**3. Run the backend:**
```bash
cd apps/login
go run ./cmd/login/main.go
```

Server starts on `:8080` by default. Health check at `GET /status`.

**4. Frontend (planned):**
- Frontend assets go in `apps/login/static/`
- Currently empty; will be served from root path

### Common Commands

**Backend (Go):**
```bash
# From apps/login/ directory
go build -o bin/login ./cmd/login/main.go    # Build binary
go run ./cmd/login/main.go                   # Run server
go test ./...                                 # Run all tests
go test -run TestName ./pkg/...              # Run specific test
go fmt ./...                                  # Format code
go vet ./...                                  # Lint code
go mod tidy                                   # Clean up dependencies
```

**Database (PostgreSQL via Docker):**
```bash
# From root
docker-compose up -d        # Start DB
docker-compose down         # Stop DB
docker-compose logs -f db   # Watch logs
```

**Monorepo (Turbo + Bun):**
```bash
bun install                 # Install all dependencies
turbo run build             # Build all packages
```

## Project Structure

```
checkpoint/
├── apps/
│   └── login/               # Login microservice (Go)
│       ├── cmd/login/       # Entry point (main.go)
│       ├── internal/
│       │   ├── handlers/    # HTTP handlers
│       │   ├── services/    # Business logic (needs expansion)
│       │   ├── repositories/# Data access
│       │   ├── database/    # DB connection & migrations
│       │   ├── router/      # Echo router setup
│       │   ├── middlewares/ # Rate limit, auth, tracing, etc.
│       │   ├── config/      # Env config loading
│       │   ├── logger/      # Zerolog + New Relic
│       │   ├── errors/      # Error types
│       │   └── validator/   # Input validation
│       ├── static/          # Frontend assets (empty, planned)
│       ├── docs/            # Documentation
│       ├── .env             # Local env variables
│       └── go.mod/go.sum    # Dependencies
├── docker-compose.yml       # PostgreSQL setup
├── package.json             # Root monorepo config
├── bun.lock                 # Bun lock file
├── features.md              # Feature roadmap
└── README.md                # (empty, needs content)
```

## Configuration & Environment Variables

Configuration is centralized in `config.go` using **Koanf** for structured parsing. All env vars use the `CHECKPOINT_` prefix and are converted to lowercase.

**Core Config Structure:**
```go
Config struct {
    Primary       // env (local/dev/prod)
    Server        // port, timeouts, CORS origins
    Database      // host, port, user, password, SSL mode, connection pool
    Auth          // secret key for JWT
    Redis         // (commented out, not currently used)
    Integration   // Resend API key
    Observability // New Relic, logging, health checks
}
```

**Example .env entry:**
```
CHECKPOINT_DATABASE.HOST=localhost
CHECKPOINT_DATABASE.PORT=5432
```

See `/apps/login/.env` for full list. Validation is automatic (struct tags with `validate:"required"`).

## Services Architecture (Needs Implementation)

Currently, **only AuthService is stubbed**. The patterns to follow when adding services:

1. **Service Definition**: Create service struct with dependencies (repositories, logger, etc.)
2. **Service Methods**: Business logic that orchestrates repositories and external calls
3. **Registration**: Create service in `service.NewService()` and inject into handlers

Example (from existing code):
```go
type Services struct {
    Auth *AuthService  // Currently the only service
    // Add more services here (Blog, Documentation, User, etc.)
}

func NewService(server *server.Server, repos *repositories.Repository) (*Services, error) {
    return &Services{
        Auth: NewAuthService(server),
        // ... initialize other services
    }, nil
}
```

## Database & Migrations

**Current State:**
- PostgreSQL connection via pgx/v5 (pool-based, supports prepared statements)
- Zerolog integration for slow query logging (configurable threshold)
- **Migrations NOT yet implemented** — see TODO in `main.go`

**When Implementing Migrations:**
- Use a migration tool (e.g., golang-migrate, Flyway, or write custom)
- Migrations should live in `internal/database/migrations/` (suggested structure)
- Call migration before starting server (in `main.go`, currently commented out)

## Middleware Pipeline

Middlewares are registered **globally** in the router and execute in order:

1. **Rate Limiter**: Protects against abuse (configured limits)
2. **CORS**: Allows origins from `CHECKPOINT_SERVER.CORS_ALLOWED_ORIGINS`
3. **Security Headers**: Adds security headers (HSTS, etc.)
4. **Request ID Generator**: Unique ID per request for tracing
5. **Tracing (New Relic)**: APM integration
6. **Context Enhancer**: Enriches request context with app data
7. **Logger**: Logs incoming request details
8. **Panic Recovery**: Catches panics and returns 500

All middleware code is in `/internal/middlewares/`. The middleware pipeline is orchestrated in `router/router.go`.

## Error Handling

Custom error types in `errors/types.go`:
- Structured error responses with HTTP status codes
- Global error handler formats all errors consistently
- Errors logged with request ID for debugging

## Observability

**Logging:**
- Zerolog with structured output (console format for local dev)
- Log levels: debug, info, warn, error (configurable)
- Slow query logging in database layer (default threshold 100ms)

**Tracing:**
- New Relic APM integration
- Request tracing with IDs
- License key configured via `CHECKPOINT_OBSERVABILITY.NEW_RELIC.LICENSE_KEY` (needed for production)

**Metrics:**
- Rate limit hits recorded
- Health check endpoint at `GET /status`

## Key Patterns & Conventions

### Dependency Injection

All components receive dependencies via constructor functions or struct fields:
```go
// Example: Handler receives Server (which has DB, Config, Logger)
type Handler struct {
    Server   *server.Server
    Services *service.Services
}
```

Benefits: Mockable for testing, clear dependencies, no globals.

### Error Propagation

Errors bubble up to the global error handler in middleware. Handlers should return errors; the error handler converts them to HTTP responses.

### Configuration Over Convention

Configuration is explicit (env vars) rather than implicit. No magic defaults except observability (falls back to DefaultObservabilityConfig if not provided).

### Repository Pattern

Repositories encapsulate data access:
```go
type Repository struct {
    User *UserRepository
    Blog *BlogRepository
    // Add more as needed
}
```

This decouples services from database details.

## Creating Endpoints: Complete Workflow

This section documents the end-to-end process for creating new endpoints, based on the project handlers implementation.

### 1. Database Layer (SQL + sqlc)

**Step 1a: Write SQL Queries**
- Location: `/apps/login/internal/database/queries/`
- File naming: `<resource>.sql` (e.g., `project.sql`)
- Use sqlc-compatible syntax with comments for operation types

```sql
-- name: GetProjectByID :one
SELECT id, name, description, is_public, created_by, updated_by, created_at, updated_at
FROM projects
WHERE id = $1;

-- name: CreateProject :one
INSERT INTO projects (name, description, is_public, created_by, created_at)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: UpdateProject :one
UPDATE projects
SET name = COALESCE($2, name),
    description = COALESCE($3, description),
    is_public = COALESCE($4, is_public),
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- name: DeleteProject :exec
DELETE FROM projects
WHERE id = $1;
```

**Key Points:**
- Use `COALESCE($2, column_name)` for partial updates (PATCH) — client can omit fields
- Use `:one` for single row results, `:many` for multiple, `:exec` for no return
- Always `RETURNING *` to get the updated record

**Step 1b: Generate Go Code**
```bash
cd apps/login
sqlc generate
```

This creates `/internal/database/db/<resource>.sql.go` with typed functions and structs.

### 2. Repository Layer

**Location:** `/apps/login/internal/repositories/<resource>.go`

**Rules:**
- Repository methods accept `context.Context` (NOT `echo.Context`)
- Repositories are data access only — no business logic
- Use sqlc-generated `Queries` to access database
- Convert database types to model types

**Example Pattern:**

```go
type ProjectRepository struct {
    queries *db.Queries
}

// Read operations
func (r *ProjectRepository) GetProjectByID(ctx context.Context, id int64) (model.Project, error) {
    row, err := r.queries.GetProjectByID(ctx, id)
    if err != nil {
        return model.Project{}, err
    }
    return toModelProject(row), nil
}

// Write operations
func (r *ProjectRepository) CreateProject(ctx context.Context, project *model.Project) (*model.Project, error) {
    row, err := r.queries.CreateProject(ctx, db.CreateProjectParams{
        Name:        project.Name,
        Description: pgtype.Text{String: derefStr(project.Description), Valid: project.Description != nil},
        IsPublic:    pgtype.Bool{Bool: project.IsPublic, Valid: true},
        CreatedBy:   project.CreatedBy,
        CreatedAt:   pgtype.Timestamp{Time: project.CreatedAt, Valid: true},
    })
    if err != nil {
        return nil, err
    }
    result := toModelProject(row)
    return &result, nil
}

func (r *ProjectRepository) UpdateProject(ctx context.Context, id int64, project *model.Project) (*model.Project, error) {
    row, err := r.queries.UpdateProject(ctx, db.UpdateProjectParams{
        ID:          id,
        Name:        project.Name,
        Description: pgtype.Text{String: derefStr(project.Description), Valid: project.Description != nil},
        IsPublic:    pgtype.Bool{Bool: project.IsPublic, Valid: true},
    })
    if err != nil {
        return nil, err
    }
    result := toModelProject(row)
    return &result, nil
}

func (r *ProjectRepository) DeleteProject(ctx context.Context, id int64) error {
    return r.queries.DeleteProject(ctx, id)
}

// Helper for converting DB types to model types
func toModelProject(p db.Project) model.Project {
    return model.Project{
        Base: model.Base{
            BaseWithId:        model.BaseWithId{ID: p.ID},
            BaseWithCreatedAt: model.BaseWithCreatedAt{CreatedAt: timeFromPg(p.CreatedAt)},
            BaseWithUpdatedAt: model.BaseWithUpdatedAt{UpdatedAt: timeFromPg(p.UpdatedAt)},
        },
        Name:        p.Name,
        Description: textToPtr(p.Description),
        IsPublic:    p.IsPublic.Bool,
        CreatedBy:   p.CreatedBy,
        UpdatedBy:   textToPtr(p.UpdatedBy),
    }
}
```

### 3. Service Layer

**Location:** `/apps/login/internal/service/<resource>.go`

**Rules:**
- Services accept `context.Context` (extracted from `echo.Context` in handler)
- Implement business logic: validation, orchestration, error mapping
- Call repositories with context
- Handle database-specific errors (e.g., `pgx.ErrNoRows` → `NotFoundError`)
- Services know nothing about HTTP or echo

**Example Pattern:**

```go
type ProjectService struct {
    server     *server.Server
    repository *repositories.ProjectRepository
}

func NewProjectService(server *server.Server, projectRepo *repositories.ProjectRepository) *ProjectService {
    return &ProjectService{
        server:     server,
        repository: projectRepo,
    }
}

func (s *ProjectService) GetProjectByID(ctx context.Context, id int64) (model.Project, error) {
    project, err := s.repository.GetProjectByID(ctx, id)
    if err != nil {
        if err == pgx.ErrNoRows {
            return model.Project{}, errors.NewNotFoundError("project not found", true)
        }
        return model.Project{}, err
    }
    return project, nil
}

func (s *ProjectService) CreateProject(ctx context.Context, project *model.Project) (*model.Project, error) {
    return s.repository.CreateProject(ctx, project)
}

func (s *ProjectService) UpdateProject(ctx context.Context, id int64, project *model.Project) (*model.Project, error) {
    // Fetch existing project for merge logic
    existingProject, err := s.repository.GetProjectByID(ctx, id)
    if err != nil {
        if err == pgx.ErrNoRows {
            return nil, errors.NewNotFoundError("project not found", true)
        }
        return nil, err
    }

    // Partial update: preserve unmodified fields
    if project.Name == "" {
        project.Name = existingProject.Name
    }
    if project.Description == nil {
        project.Description = existingProject.Description
    }

    return s.repository.UpdateProject(ctx, id, project)
}

func (s *ProjectService) DeleteProject(ctx context.Context, id int64) error {
    return s.repository.DeleteProject(ctx, id)
}
```

### 4. Handler Layer

**Location:** `/apps/login/internal/handlers/<resource>.go`

**Rules:**
- Handlers accept `echo.Context` (HTTP request context)
- Extract `context.Context` with `c.Request().Context()` and pass to service
- Define request/response structs with validation
- Implement `Validate()` method on request structs
- Use the `Handle()` wrapper for boilerplate (logging, metrics, error handling)
- Return model types directly (not JSON serialization details)

**Request/Response Structure Pattern:**

```go
// Request struct with validation
type GetProjectByIDRequest struct {
    ID int64 `param:"id"`
}

func (r GetProjectByIDRequest) Validate() error {
    if r.ID <= 0 {
        return errors.NewBadRequestError("Invalid request", false, []errors.FieldError{
            {Field: "id", Error: "must be a positive integer"},
        }, nil)
    }
    return nil
}

// For POST requests, include data in body
type CreateProjectRequest struct {
    Name        string  `json:"name" validate:"required,min=1,max=255"`
    Description *string `json:"description" validate:"omitempty,max=1000"`
    IsPublic    bool    `json:"isPublic"`
    UserID      string  `json:"userId" validate:"required"`
}

func (r CreateProjectRequest) Validate() error {
    if r.Name == "" {
        return errors.NewBadRequestError("Invalid request", false, []errors.FieldError{
            {Field: "name", Error: "name is required"},
        }, nil)
    }
    if r.UserID == "" {
        return errors.NewBadRequestError("Invalid request", false, []errors.FieldError{
            {Field: "userId", Error: "userId is required"},
        }, nil)
    }
    return nil
}

// For PATCH requests, use pointers for optional fields
type UpdateProjectRequest struct {
    ID          int64   `param:"id"`
    Name        *string `json:"name" validate:"omitempty,min=1,max=255"`
    Description *string `json:"description" validate:"omitempty,max=1000"`
    IsPublic    *bool   `json:"isPublic"`
}

func (r UpdateProjectRequest) Validate() error {
    if r.ID <= 0 {
        return errors.NewBadRequestError("Invalid request", false, []errors.FieldError{
            {Field: "id", Error: "must be a positive integer"},
        }, nil)
    }
    return nil
}
```

**Handler Implementation:**

```go
type ProjectHandler struct {
    Handler
    projectServices *service.ProjectService
}

func NewProjectHandler(server *server.Server, services *service.ProjectService) *ProjectHandler {
    return &ProjectHandler{
        Handler:         NewHandler(server),
        projectServices: services,
    }
}

// GET single resource
func (h *ProjectHandler) handleGetProjectLogic(c echo.Context, req GetProjectByIDRequest) (model.Project, error) {
    project, err := h.projectServices.GetProjectByID(c.Request().Context(), req.ID)
    if err != nil {
        return model.Project{}, err
    }
    return project, nil
}

func (h *ProjectHandler) GetProjectByID() echo.HandlerFunc {
    return Handle(h.Handler, h.handleGetProjectLogic, 200, GetProjectByIDRequest{ID: 0})
}

// POST create resource
func (h *ProjectHandler) handleCreateProjectLogic(c echo.Context, req CreateProjectRequest) (model.Project, error) {
    project := &model.Project{
        Name:        req.Name,
        Description: req.Description,
        IsPublic:    req.IsPublic,
        CreatedBy:   req.UserID,
        Base: model.Base{
            BaseWithCreatedAt: model.BaseWithCreatedAt{CreatedAt: time.Now()},
        },
    }

    createdProject, err := h.projectServices.CreateProject(c.Request().Context(), project)
    if err != nil {
        return model.Project{}, err
    }

    return *createdProject, nil
}

func (h *ProjectHandler) CreateProject() echo.HandlerFunc {
    return Handle(h.Handler, h.handleCreateProjectLogic, 201, CreateProjectRequest{})
}

// PATCH partial update
func (h *ProjectHandler) handleUpdateProjectLogic(c echo.Context, req UpdateProjectRequest) (model.Project, error) {
    project := &model.Project{
        Name:        derefStr(req.Name),
        Description: req.Description,
        IsPublic:    derefBool(req.IsPublic),
    }

    updatedProject, err := h.projectServices.UpdateProject(c.Request().Context(), req.ID, project)
    if err != nil {
        return model.Project{}, err
    }

    return *updatedProject, nil
}

func (h *ProjectHandler) UpdateProject() echo.HandlerFunc {
    return Handle(h.Handler, h.handleUpdateProjectLogic, 200, UpdateProjectRequest{ID: 0})
}

// DELETE resource
func (h *ProjectHandler) handleDeleteProjectLogic(c echo.Context, req DeleteProjectRequest) (map[string]string, error) {
    err := h.projectServices.DeleteProject(c.Request().Context(), req.ID)
    if err != nil {
        return nil, err
    }
    return map[string]string{
        "message": "project deleted successfully",
    }, nil
}

func (h *ProjectHandler) DeleteProject() echo.HandlerFunc {
    return Handle(h.Handler, h.handleDeleteProjectLogic, 200, DeleteProjectRequest{ID: 0})
}

// Helper functions for pointer dereferencing
func derefStr(s *string) string {
    if s == nil {
        return ""
    }
    return *s
}

func derefBool(b *bool) bool {
    if b == nil {
        return false
    }
    return *b
}
```

### 5. Router Registration

**Location:** `/apps/login/internal/router/<resource>.go`

```go
func registerProjectRoutes(g *echo.Group, h *handlers.Handlers) {
    g.GET("/projects", h.Projects.GetAllProjects())
    g.GET("/projects/:id", h.Projects.GetProjectByID())
    g.POST("/projects", h.Projects.CreateProject())
    g.PATCH("/projects/:id", h.Projects.UpdateProject())
    g.DELETE("/projects/:id", h.Projects.DeleteProject())
}
```

**HTTP Method Conventions:**
- `GET /resource` — list/paginate
- `GET /resource/:id` — get single
- `POST /resource` — create (201 status)
- `PATCH /resource/:id` — partial update (prefer PATCH over PUT)
- `DELETE /resource/:id` — delete

### 6. Error Handling & Status Codes

**Standard Status Codes:**
```go
// From errors/http.go
400 → NewBadRequestError() // Used in Validate() for invalid input
401 → NewUnauthorizedError() // Auth failure
403 → NewForbiddenError() // Permission denied
404 → NewNotFoundError() // Resource not found
500 → NewInternalServerError() // Unhandled errors
```

**Important:** Don't expose internal errors (e.g., `strconv.ParseInt`) to clients. The binding layer in `base.go` has been updated to return generic "Invalid request parameters or format" while logging the actual error server-side.

### 7. Testing Endpoints

**With curl:**
```bash
# GET
curl http://localhost:8080/api/v1/projects/1

# POST
curl -X POST http://localhost:8080/api/v1/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","description":"Desc","isPublic":true,"userId":"user-123"}'

# PATCH
curl -X PATCH http://localhost:8080/api/v1/projects/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name"}'

# DELETE
curl -X DELETE http://localhost:8080/api/v1/projects/1
```

**With Postman:**
1. Set method (GET, POST, PATCH, DELETE)
2. Enter full URL (e.g., `http://localhost:8080/api/v1/projects/1`)
3. For POST/PATCH, set Body → raw → JSON and include request body
4. Click Send

### 8. Key Observations

1. **Context Flow**: `echo.Context` → extract with `.Request().Context()` → pass to service/repository
2. **Partial Updates**: Use `COALESCE` in SQL + pointer fields in request struct
3. **Validation**: Always validate in request `Validate()` method, returns 400 status
4. **Error Mapping**: Services map database errors (e.g., `ErrNoRows`) to domain errors (e.g., `NotFoundError`)
5. **No Business Logic in Handlers**: Handlers only parse requests and call services
6. **No Database Details in Services**: Services call repositories, which handle sqlc types
7. **Status Code 201 for CREATE**: Only POST (create) returns 201; PATCH and DELETE return 200

## Planned Features (from features.md)

Major features to be implemented:
- Markdown editor & renderer
- Blog/documentation management (tree layout, date/time organization)
- Like/dislike for blogs
- Project board (knowledge graph)
- Admin stats dashboard
- Public/private toggles for content
- Offline mode with local sync
- Game integrations
- Role-based access control (RBAC)

## TODOs & Known Gaps

1. **Database Migrations**: Not implemented; currently commented out in `main.go` (see `//CHECK` comment)
2. **Service Layer**: Only AuthService stubbed; needs implementation for core features
3. **Repository Implementations**: Stubs exist; need actual query implementations
4. **Frontend**: Assets folder is empty
5. **Tests**: No test files yet (use `go test` when adding)
6. **Redis Cache**: Commented out; not currently used
7. **New Relic**: License key needed for production; disabled for local dev

## Troubleshooting

**Database connection fails:**
- Ensure PostgreSQL is running: `docker-compose up -d`
- Check connection string in `.env` (host, port, user, password, database name)
- Verify Docker postgres is healthy: `docker-compose logs db`

**Port 8080 already in use:**
- Change `CHECKPOINT_SERVER.PORT` in `.env` or via env var

**New Relic not reporting:**
- Provides license key in `.env` or leave disabled for local dev

**Tests failing with database errors:**
- Integration tests need a real database connection (no mocking planned per project patterns)

## Dependencies & Versions

Key dependencies (see `go.mod`):
- `github.com/labstack/echo/v4` — HTTP routing & middleware
- `github.com/jackc/pgx/v5` — PostgreSQL driver
- `github.com/rs/zerolog` — Structured logging
- `github.com/go-playground/validator/v10` — Input validation
- `github.com/clerk/clerk-sdk-go/v2` — Authentication (integrated)
- `github.com/newrelic/go-agent/v3` — APM
- `github.com/knadh/koanf` — Configuration management
- `github.com/google/uuid` — UUID generation

Run `go mod why <package>` to understand why a dependency is included.

## References

- **Echo Framework**: https://echo.labstack.com/
- **pgx Documentation**: https://github.com/jackc/pgx
- **Zerolog**: https://github.com/rs/zerolog
- **Koanf**: https://github.com/knadh/koanf
- **New Relic Go Agent**: https://docs.newrelic.com/docs/apm/agents/go-agent/
