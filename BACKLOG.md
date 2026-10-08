# Backlog

## Middleware Logging Architecture

**Status**: Done (traced + fixed 2026-10-08)
**Priority**: Medium  
**Effort**: Medium

Traced the full middleware pipeline (`apps/backend/internal/middlewares/`) and fixed several real gaps found along the way:

- **tracing.go errors not logged to Zerolog**: turned out to be a non-issue — errors returned from `EnhanceTracing` propagate up to `GlobalErrorHandler`, which already logs them with `.Stack()` and full request context. No fix needed here.
- **Duplicate error logging**: `RequestLogger` and `GlobalErrorHandler` were both logging the same error per request (once each), with mismatched severity (`RequestLogger` scaled by status, `GlobalErrorHandler` always logged at `Error`). Fixed: `RequestLogger` now skips logging entirely when `v.Error != nil`; `GlobalErrorHandler` is now the single source of truth for error-path logs, with status-based severity and the access-log fields (`latency`, `uri`, `host`, `user_agent`) it was previously missing. `latency` is sourced from a new `StartTimeKey` timestamp set in `request_id.go`, with a `Warn` log if it's ever missing from context.
- **`user_id` missing from all request logs**: found that `ContextEnhancer.EnhanceContext()` (global middleware) ran *before* `OptionalAuth`/`RequireAuth` (per-route), so `user_id`/`user_role` were never present when the enriched logger was built. Fixed by promoting `OptionalAuth` to global middleware (runs before `EnhanceContext` now), and removing the now-redundant per-route `OptionalAuth` from GET routes in `articles.go`/`devlogs.go`/`projects.go`.
- **`RequireAuth`'s failure-handler logging**: fixed a wrong import (`pgx-zerolog` aliased as `zerolog` instead of `rs/zerolog`) and wired the request-scoped logger through to Clerk's raw `net/http` failure handler via `context.WithValue`, since `echo.Context` isn't reachable from that layer.
- **Known, deliberately deferred**: `RequireAuth` now double-verifies the JWT on write routes (once via global `OptionalAuth`, once via its own `clerkhttp` verification) since `OptionalAuth` went global. Left as-is intentionally to profile the real cost before optimizing.

`database.go`'s pgx query tracing (local-mode-only) was not addressed in this pass — still open, see below.

---

## Code TODOs & CHECKs

**Status**: Pending  
**Priority**: Varies  

### Critical (Blocking Features)
- [ ] **apps/backend/internal/service/auth.go** - Change auth service to custom implementation (currently stubbed)
- [ ] **apps/backend/internal/middlewares/auth.go** - Implement authorization and authentication on own (currently using Clerk SDK)

### Important (Infrastructure)
- [ ] **apps/login/internal/router/router.go** - Implement in-memory rate limiter using Redis (currently in-memory store can crash and lose state on restart)
- [ ] **apps/login/internal/logger/logger.go** - Swap Zerolog + New Relic logger out with Grafana integration

### Medium (Code Quality)
- [ ] **apps/login/internal/validator/utils.go** - Format error messages properly
- [ ] **apps/login/internal/config/config.go** - Review commented overrides and determine if they should be enabled
- [ ] validation logic needs to be confirmed for all the endpoints

### Low (Investigation/Clarification)
- [x] **Logging Setup** - Traced 2026-10-08: base logger fields set once at startup (`logger.go`), per-request enrichment via `EnhanceContext`, trace IDs via `WithTraceContext`, stack traces via `pkgerrors.MarshalStack` (always registered, but only auto-applied on the base logger in non-prod; prod opts in explicitly per call site). See Middleware Logging Architecture entry above for the fixes that came out of this.
- [ ] **apps/login/internal/database/database.go** - Review pgx logger initialization as struct method (potential issue on line ~95)
- [ ] **apps/login/internal/database/database.go** - Verify pgx trace level struct method call doesn't cause issues
- [x] **apps/backend/internal/middlewares/tracing.go** - Documented 2026-10-08: `NewRelicMiddleware()` wires `nrecho` for APM transactions; `EnhanceTracing()` adds custom attributes (ip, user agent, request id, user id) to the NR transaction and reports handler errors via `nrpkgerrors.Wrap(err)` + `NoticeError`. CHECK comment can be removed.
- [ ] **apps/login/internal/middlewares/global.go** - Document CORS implementation details (code has CHECK comment)

## Feature Gaps

### Medium (Backend)
- [ ] **Analytics service** - The admin `/user/stats` page currently renders static/mocked numbers (views, referrers, top articles) — no real tracking exists yet. Needs scoping: what gets tracked (page views, article reads, devlog activity), whether it's self-hosted (fits the project's own-your-data VPS philosophy) or a third-party embed, and whether it lives in `apps/backend` or as a separate lightweight service.
- [ ] **apps/backend/internal/service/article.go** - Wire `IncrementViews` so article view counts actually increment (column + query already exist, nothing calls it — counts are frozen at 0)
- [ ] **apps/backend/internal/repositories/*.go** - Define repository interfaces + error sentinels (e.g. `ErrNotFound`) so the DB backend is swappable without touching services/handlers; services currently hold concrete `*repositories.XRepository` structs and check `pgx.ErrNoRows` directly
- [ ] **apps/backend/internal/handlers/base.go** - Use the existing (currently unused) `BindAndValidate`/`extractValidationErrors` helpers in `validator/utils.go` instead of every resource hand-rolling its own `Validate()` method

### Medium (Frontend Integration)
- [ ] **apps/frontend/src/components/FinderModal.jsx** - Replace hardcoded search results with a real backend search index endpoint (`GET /api/v1/search/index`) so telescope shows dynamic articles/projects/devlogs
- [ ] **apps/frontend/src/pages/UserNewArticlePage.jsx / UserNewDevlogPage.jsx** - Read field-level `{field, error}` entries from 400 responses and show them inline under the matching form input instead of just `console.error`

### Low (RBAC / Auth)
- [ ] **RBAC: admin cross-user read access** - Admins should be able to read all users' private content, not just their own; today only owner-or-self is enforced for GET routes (`is_public = true OR created_by = requesting_user_id`), with no admin-role bypass. Deprioritized for now.

### Low (Deferred)
- [ ] **SSR for public pages** - Server-render public pages via Go templates for SEO + social previews (deferred until after initial deployment)
- [ ] **Devlog batch sync + offline mode** - Batch update API for the devlog compose flow, plus a local queue with sync-on-reconnect for unstable connections
- [ ] **apps/frontend/src/pages/DevlogsPage.jsx** - Build a real calendar view (currently shows a "coming soon" placeholder when the `cal` chip is selected). Month grid, 7 cols × weeks, each day cell showing an entry count/dot (GitHub-heatmap style); clicking a day filters the reader pane to that day's entries. Needs a decision on how to handle entries outside the currently-loaded page range before implementing.

## Frontend Content

### Low (Content)
- [ ] **apps/frontend/src/pages/AboutPage.jsx** - Replace static placeholder content with real bio/content
