# Plan: CRUD Handlers for Projects, Articles, and Devlogs

## Auth Model

- **Public list** (`GET /api/v1/articles`, `GET /api/v1/devlogs`, `GET /api/v1/projects`) — no auth required, returns only `is_public = true`, supports `?project_id=X` filter
- **My content** (`GET .../me`) — auth required, returns authenticated user's own content regardless of `is_public`
- **Single GET** (`GET .../:id`) — optional auth: public if `is_public = true`; private accessible only to creator (use OptionalAuth middleware)
- **Mutations** (create/update/delete) — always require auth + ownership check

---

## Step 1 — Optional Auth Middleware

**New file:** `internal/middlewares/optional_auth.go`

Add `OptionalAuth` method to `AuthMiddleWare`. Uses Clerk's `clerkhttp.WithHeaderAuthorization` but with a no-op failure handler — on missing/invalid token, request continues with empty `user_id`. On valid token, sets `"user_id"` on echo context (same as `RequireAuth`).

---

## Step 2 — Repositories

**Update:** `internal/repositories/repository.go` — add `Projects`, `Articles`, `Devlogs` fields; initialize in `RepositoryInit`.

**New files:**
- `internal/repositories/projects.go`
- `internal/repositories/articles.go`
- `internal/repositories/devlogs.go`

### ProjectRepository methods
- `Create(ctx, name, description, isPublic, createdBy) (*Project, error)`
- `GetByID(ctx, id int64) (*Project, error)`
- `ListPublic(ctx) ([]*Project, error)`
- `ListByUser(ctx, userID string) ([]*Project, error)`
- `Update(ctx, id int64, name, description string, isPublic bool, updatedBy string) (*Project, error)`
- `Delete(ctx, id int64) error`

### ArticleRepository methods
- `Create(ctx, projectID *int64, title, content, slug string, isPublic bool, createdBy string) (*Article, error)`
- `GetByID(ctx, id int64) (*Article, error)`
- `ListPublic(ctx, projectID *int64) ([]*Article, error)`
- `ListByUser(ctx, userID string, projectID *int64) ([]*Article, error)`
- `Update(ctx, id int64, title, content string, isPublic bool, updatedBy string) (*Article, error)`
- `Delete(ctx, id int64) error`

### DevlogRepository methods
Same as ArticleRepository but no `slug` field. Note: `project_id` is `NOT NULL` for devlogs (required).

### Model structs (defined in repo files)
```go
type Project struct {
    ID          int64
    Name        string
    Description string
    IsPublic    bool
    CreatedBy   string
    UpdatedBy   string
    CreatedAt   time.Time
    UpdatedAt   time.Time
}

type Article struct {
    ID        int64
    ProjectID *int64  // nullable
    Title     string
    Content   string
    Slug      string
    IsPublic  bool
    CreatedBy string
    UpdatedBy string
    CreatedAt time.Time
    UpdatedAt time.Time
}

type Devlog struct {
    ID        int64
    ProjectID int64   // required (NOT NULL in schema)
    Title     string
    Content   string
    IsPublic  bool
    CreatedBy string
    UpdatedBy string
    CreatedAt time.Time
    UpdatedAt time.Time
}
```

---

## Step 3 — Services

**Update:** `internal/service/service.go` — add `Projects`, `Articles`, `Devlogs` fields; initialize in `NewService`.

**New files:**
- `internal/service/projects.go`
- `internal/service/articles.go`
- `internal/service/devlogs.go`

Each service holds `*server.Server` + pointer to its repository.

**Ownership enforcement pattern:**
- On update/delete: `GetByID` → check `createdBy == userID` → return `errors.NewForbiddenError` if not owner
- On single GET: if `!isPublic && userID != createdBy` → return `errors.NewNotFoundError` (don't leak private resource existence)

---

## Step 4 — Handlers

**Update:** `internal/handlers/handler.go` — add `Projects`, `Articles`, `Devlogs` to `Handlers` struct; initialize in `InitHandlers`.

**New files:**
- `internal/handlers/projects.go`
- `internal/handlers/articles.go`
- `internal/handlers/devlogs.go`

Use existing `Handle[Req, Res]` generic wrapper from `base.go`. Request structs must implement `Validatable`.

**Request struct examples:**
```go
type CreateProjectRequest struct {
    Name        string `json:"name" validate:"required,max=255"`
    Description string `json:"description"`
    IsPublic    bool   `json:"is_public"`
}

type CreateArticleRequest struct {
    ProjectID *int64 `json:"project_id"`
    Title     string `json:"title" validate:"required,max=255"`
    Content   string `json:"content" validate:"required"`
    Slug      string `json:"slug" validate:"max=255"`
    IsPublic  bool   `json:"is_public"`
}

// Update requests: same fields but all optional (use pointers)
// Devlog: same as Article but ProjectID int64 (required), no Slug
```

**Methods per handler:** `Create`, `List`, `ListMine`, `GetByID`, `Update`, `Delete`

---

## Step 5 — Routes

**New file:** `internal/router/resources.go`

```go
func registerResourceRoutes(g *echo.Group, h *handlers.Handlers, m *middlewares.Middlewares) {
    projects := g.Group("/projects")
    projects.POST("",    h.Projects.Create,   m.Auth.RequireAuth)
    projects.GET("",     h.Projects.List)
    projects.GET("/me",  h.Projects.ListMine, m.Auth.RequireAuth)
    projects.GET("/:id", h.Projects.GetByID,  m.Auth.OptionalAuth)
    projects.PUT("/:id", h.Projects.Update,   m.Auth.RequireAuth)
    projects.DELETE("/:id", h.Projects.Delete, m.Auth.RequireAuth)

    articles := g.Group("/articles")
    articles.POST("",    h.Articles.Create,   m.Auth.RequireAuth)
    articles.GET("",     h.Articles.List)
    articles.GET("/me",  h.Articles.ListMine, m.Auth.RequireAuth)
    articles.GET("/:id", h.Articles.GetByID,  m.Auth.OptionalAuth)
    articles.PUT("/:id", h.Articles.Update,   m.Auth.RequireAuth)
    articles.DELETE("/:id", h.Articles.Delete, m.Auth.RequireAuth)

    devlogs := g.Group("/devlogs")
    devlogs.POST("",    h.Devlogs.Create,   m.Auth.RequireAuth)
    devlogs.GET("",     h.Devlogs.List)
    devlogs.GET("/me",  h.Devlogs.ListMine, m.Auth.RequireAuth)
    devlogs.GET("/:id", h.Devlogs.GetByID,  m.Auth.OptionalAuth)
    devlogs.PUT("/:id", h.Devlogs.Update,   m.Auth.RequireAuth)
    devlogs.DELETE("/:id", h.Devlogs.Delete, m.Auth.RequireAuth)
}
```

**Update:** `internal/router/router.go` — pass `m *middlewares.Middlewares` into `registerResourceRoutes` and call it on the `/api/v1` group.

---

## Files Summary

| Action | File |
|--------|------|
| New | `internal/middlewares/optional_auth.go` |
| New | `internal/repositories/projects.go` |
| New | `internal/repositories/articles.go` |
| New | `internal/repositories/devlogs.go` |
| Update | `internal/repositories/repository.go` |
| New | `internal/service/projects.go` |
| New | `internal/service/articles.go` |
| New | `internal/service/devlogs.go` |
| Update | `internal/service/service.go` |
| New | `internal/handlers/projects.go` |
| New | `internal/handlers/articles.go` |
| New | `internal/handlers/devlogs.go` |
| Update | `internal/handlers/handler.go` |
| New | `internal/router/resources.go` |
| Update | `internal/router/router.go` |

---

## Verification

1. `go build ./...` — compiles cleanly
2. `docker-compose up -d` + `go run ./cmd/login/main.go` — server starts
3. Curl tests:
   - `POST /api/v1/projects` with Bearer token → 201 with project
   - `GET /api/v1/projects` (no auth) → list of public projects
   - `GET /api/v1/articles?project_id=1` (no auth) → public articles for project
   - `GET /api/v1/articles/me` with Bearer token → user's own articles
   - `DELETE /api/v1/articles/:id` with different user's token → 403
