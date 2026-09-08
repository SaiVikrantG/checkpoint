# Backlog

## Middleware Logging Architecture

**Status**: Pending  
**Priority**: Medium  
**Effort**: Medium

Investigate and document how all middlewares in `apps/login/internal/middlewares/` work together:

### Middlewares to understand:
- tracing.go (New Relic + pgx tracer integration)
- context.go (request context enrichment)
- rate_limiter.go
- logger.go
- cors.go
- security_headers.go
- request_id.go
- panic_recovery.go

### Known gaps to address:
1. **tracing.go**: Errors are sent to New Relic but NOT logged to Zerolog (lines 66-68)
   - Need to add Zerolog logging alongside New Relic error tracking
   
2. **database.go**: pgx query tracing only works in local mode (line 95)
   - Consider making this configurable for production debugging if needed

### Deliverables:
- Document how middleware pipeline executes
- Identify and fix logging gaps (ensure both Zerolog and New Relic capture critical events)
- Consider if pgx logging should be configurable beyond local-only mode

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
- [ ] **Logging Setup** - Understand how the logging setup works in the service (Zerolog + New Relic integration, logger initialization, propagation through context)
- [ ] **apps/login/internal/database/database.go** - Review pgx logger initialization as struct method (potential issue on line ~95)
- [ ] **apps/login/internal/database/database.go** - Verify pgx trace level struct method call doesn't cause issues
- [ ] **apps/login/internal/middlewares/tracing.go** - Document what this middleware does (code has CHECK comment)
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

## Parked Ideas

### Content index + graph layer (devlogs/articles/projects)

**Status**: Parked — not committed, revisit if search + knowledge graph both become real priorities

Unified abstraction sitting on top of the existing `devlogs`/`articles`/`projects` tables (unchanged) to back two planned features together instead of separately:
- `content_index` table (`content_type, content_id, title, body_text, tags, visibility, author, created_at`) — derived/synced from each domain table on write, backs the planned `GET /api/v1/search/index` endpoint with one query instead of three.
- `content_edges` table (`source_type, source_id, target_type, target_id, edge_type`) — `belongs_to` edges auto-derived from existing FKs (e.g. devlog → project), explicit `references`/`links_to` edges created when content is manually linked. Backs the project board / knowledge graph view.
- Both layers key content generically by `(type, id)` so domain services/repositories stay untouched; sync happens via a small `ContentIndexer` called from each service on create/update/delete.
- Bonus: if the devlog CTF easter egg idea (below) is revisited, the hint chain can ride `content_edges` as a `ctf_next` edge type instead of needing its own schema.

Cost is real: two new tables + sync-on-write logic in three services + eventual graph-rendering UI. Worth it once there's enough content that search/relationships actually matter; pure overhead before that.

### Devlog CTF easter egg

**Status**: Parked

Continuous CTF chain with hints hidden in devlog prose (one ordered chain, not scattered independent eggs). Sketch:
- `ctf_hints` (`devlog_id, sequence, answer_hash, reward_fragment`) — the authored chain.
- `ctf_progress` (`user_id or session_token, current_sequence, completed_at`) — one row per player.
- `POST /api/v1/ctf/submit` validates server-side (hash match + sequence gating) so the flag logic can't be read out of client JS.

Open question before building: anonymous play (session-token cookie) vs. Clerk-auth-only.

## Frontend Content

### Low (Content)
- [ ] **apps/frontend/src/pages/AboutPage.jsx** - Replace static placeholder content with real bio/content
