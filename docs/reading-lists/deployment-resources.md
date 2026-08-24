# Self-Hosted Deployment — Reading List

A curated guide to the concepts behind our VPS + Docker Compose deployment plan (see `DEPLOYMENT.md`): what each phase does, why it's built that way, and where to learn the underlying idea properly instead of just copy-pasting config.

---

## 1. GitHub Actions CI Basics

| Resource | Summary | Level |
|----------|---------|-------|
| [Quickstart for GitHub Actions](https://docs.github.com/en/actions/get-started/quickstart) | Official docs. Explains the core mental model (workflow → job → step) with a minimal working example before any complexity is added. | Beginner |
| [Creating PostgreSQL service containers](https://docs.github.com/en/actions/tutorials/use-containerized-services/create-postgresql-service-containers) | Official docs, walks through the `services:` block, health checks (`pg_isready`), and port mapping — exactly the pattern our CI uses for real Postgres integration tests. | Beginner |

## 2. Multi-Stage Docker Builds

| Resource | Summary | Level |
|----------|---------|-------|
| [Multi-stage builds — Docker Docs](https://docs.docker.com/build/building/multi-stage/) | The official reference: why multiple `FROM` statements exist, how to selectively `COPY --from=`, why only the last stage ends up in your final image. | Beginner |
| [Go Multi-Stage Docker Tutorial — TutorialEdge](https://tutorialedge.net/golang/go-multi-stage-docker-tutorial/) | Walks through the exact pattern we use (Go builder stage → slim Alpine runtime stage) with a complete Dockerfile. | Beginner |

## 3. Docker Compose for Production

| Resource | Summary | Level |
|----------|---------|-------|
| [Use Compose in production — Docker Docs](https://docs.docker.com/compose/how-tos/production/) | Official docs on the dev-vs-production differences that matter: dropping code volume mounts, `restart:` policies, layering an override file. | Beginner |
| [Docker Compose Restart Policies — Baeldung](https://www.baeldung.com/ops/docker-compose-restart-policies) | Clear explainer of the four restart policy options (`no`, `always`, `on-failure`, `unless-stopped`) — answers "what happens when my container crashes at 3am." | Beginner |

## 4. Caddy as a Reverse Proxy with Automatic HTTPS

| Resource | Summary | Level |
|----------|---------|-------|
| [Reverse proxy quick-start — Caddy Docs](https://caddyserver.com/docs/quick-starts/reverse-proxy) | Official docs, a working reverse proxy Caddyfile in a few lines — ideal for grasping "public domain → internal app port" fast. | Beginner |
| [HTTPS quick-start — Caddy Docs](https://caddyserver.com/docs/quick-starts/https) | Official docs explaining why Caddy is the beginner-friendly choice: any real domain in a Caddyfile auto-triggers Let's Encrypt provisioning and renewal, zero extra config. | Beginner |

## 5. VPS Hardening Basics

| Resource | Summary | Level |
|----------|---------|-------|
| [Initial Server Setup with Ubuntu — DigitalOcean](https://www.digitalocean.com/community/tutorials/initial-server-setup-with-ubuntu) | One of the most widely trusted beginner sysadmin tutorials on the web: non-root sudo user, SSH keys, a basic UFW pass, in the order you'd actually do it. | Beginner |
| [Ubuntu 24.04 VPS Hardening: SSH, UFW & Fail2Ban — QubitLogic](https://qubitlogic.dev/infrastructure/secure-ubuntu-24-04-vps-hardening/) | Fills the gap the DigitalOcean guide leaves: Fail2ban and explicitly disabling SSH password auth, explained in plain language. | Beginner |

## 6. Database Backup Strategy for Self-Hosted Postgres

| Resource | Summary | Level |
|----------|---------|-------|
| [How To Backup PostgreSQL Databases on an Ubuntu VPS — DigitalOcean](https://www.digitalocean.com/community/tutorials/how-to-backup-postgresql-databases-on-an-ubuntu-vps) | Covers `pg_dump` fundamentals and basic automation on a self-managed VPS — matches our setup exactly (no managed-DB safety net). | Beginner |
| [Self-Hosted Backup Strategy with Restic and Rclone — Self Host Setup](https://selfhostsetup.com/posts/self-hosted-backup-restic-rclone/) | Why off-box backups matter, and the cron + restic (encrypted, incremental) + rclone (ships to S3/B2/etc.) pattern end to end — the natural next step after plain `pg_dump`. | Intermediate |

## 7. SSH-Based Deploy from CI (CD)

| Resource | Summary | Level |
|----------|---------|-------|
| [Automated Docker Compose Deployment with GitHub Actions — Ecostack](https://ecostack.dev/posts/automated-docker-compose-deployment-github-actions/) | Clear, practical walkthrough of the whole pattern: generating a deploy-only SSH key, storing the private key as a GitHub secret, and a workflow job that SSHes in and runs `docker compose up -d`. | Intermediate |
| [How to deploy a Docker hosted website using GitHub Actions — Don't Panic](https://www.andrewhoog.com/posts/how-to-deploy-a-docker-hosted-website-using-github-actions/) | A second, independently-written take on the same pattern with more explanation of *why* each secret/step exists — useful for cementing the idea. | Intermediate |

## 8. Diun — Registry-Watching Update Notifier

Diun's job in our setup: poll GHCR every 2 minutes for new `v*` tags on `checkpoint-backend`, and when one appears, POST a notification. It never touches the running containers itself — pure detection.

| Resource | Summary | Level |
|----------|---------|-------|
| [Diun — Overview](https://crazymax.dev/diun/) | Official docs homepage — the core idea: providers (what to watch) + notifiers (how to tell you) are separate, composable concerns. Read this first. | Beginner |
| [Diun — File Provider](https://crazymax.dev/diun/providers/file/) | How `deploy/diun.yml`'s `providers.file` block (pointing at `deploy/images.yml`) works — explicitly naming one image to watch (vs. the `docker` provider, which auto-discovers from running containers; we don't use that mode since Diun itself never needs Docker socket access). Diun v4 has no `static` provider — that's a name from an earlier plan that never shipped; `file` is the real equivalent. | Beginner |
| [Diun — Registry Options](https://crazymax.dev/diun/config/#regopts) | Explains `regopts[].selector`, which is `name` or `image` (matches a regopt to an image entry by its `regopt:` field or by image-name prefix) — **not** a registry hostname. An earlier draft of `deploy/diun.yml` set `selector: ghcr.io`, which fails Diun's config validation (`oneof=name image`); the fix is `selector: name` paired with `images.yml`'s `regopt: ghcr` reference. | Beginner |
| [Diun — Configuration (env var overrides)](https://crazymax.dev/diun/config/) | Diun's YAML file loader (`gonfig`) does **not** expand `${VAR}` placeholders in file content — that's a Docker Compose-only feature, and an earlier draft of `deploy/diun.yml` wrongly assumed it worked for `regopts[].password` and `notif.webhook.headers.authorization`, silently sending the literal string `${CHECKPOINT_DEPLOY_GHCR_PAT}` as the token (causing 403s). The fix: Diun separately supports `DIUN_`-prefixed env var overrides with list/map path notation (e.g. `DIUN_REGOPTS_0_PASSWORD`, `DIUN_NOTIF_WEBHOOK_HEADERS_AUTHORIZATION`), set in `docker-compose.yml`'s `environment:` block where Compose's (real) `${VAR}` interpolation does apply. | Intermediate |
| [Diun — Webhook Notifier](https://crazymax.dev/diun/notif/webhook/) | Explains the fixed JSON payload format Diun POSTs (`image`, `status`, `digest`, etc.) — important because this is *not* a templated URL like most webhook configs; it's why `deploy/hooks.json` pulls the tag out of the payload body instead of a query string. | Beginner |

## 9. adnanh/webhook — HTTP-Triggered Shell Commands

This is the glue: a tiny server that receives Diun's POST, checks a shared secret, and runs `deploy-backend.sh` with the new image tag as an argument. It has no concept of Docker or deploys — it's a generic "HTTP request → shell command" trigger, which is exactly why it needed the Docker CLI installed into its image (`deploy/webhook.Dockerfile`) to be useful here.

| Resource | Summary | Level |
|----------|---------|-------|
| [adnanh/webhook — README](https://github.com/adnanh/webhook) | Project overview and the core mental model: one `hooks.json` file defines named hooks, each hook maps an incoming request to a command + arguments. | Beginner |
| [Hook Definition reference](https://github.com/adnanh/webhook/blob/master/docs/Hook-Definition.md) | The actual fields used in `deploy/hooks.json` — `execute-command`, `pass-arguments-to-command` (source: `payload`, pulling the `image` field out of Diun's JSON body), `trigger-rule` (the secret check). | Intermediate |
| [Templates](https://github.com/adnanh/webhook/blob/master/docs/Templates.md) | Explains the `-template` flag and the `getenv` function — how `hooks.json` reads the shared secret out of the container's environment (`CHECKPOINT_DEPLOY_WEBHOOK_SECRET`) instead of hardcoding it in the file. | Intermediate |
| [Hook Examples](https://github.com/adnanh/webhook/blob/master/docs/Hook-Examples.md) | Worked examples of `trigger-rule` and `pass-arguments-to-command` combos closest to what we built (GitHub-style webhook receivers) — useful for seeing the pattern in a more familiar context (git push) before mapping it onto Diun. | Intermediate |

## 10. Why This Shape: Health-Gated Deploys and Docker Socket Exposure

| Resource | Summary | Level |
|----------|---------|-------|
| [Kubernetes: Rolling Update Deployment](https://kubernetes.io/docs/tutorials/kubernetes-basics/deploy-app/deploy-intro/) | Not something we're adopting, but reading how a "real" orchestrator gates traffic on readiness and can auto-rollback explains *why* `deploy-backend.sh` health-checks before calling a deploy done, instead of just restarting and hoping (what Watchtower did). | Beginner |
| [Docker Docs: Protect the Docker daemon socket](https://docs.docker.com/engine/security/protect-access/) | Explains exactly what access `/var/run/docker.sock` grants — relevant because the `webhook` container holds this socket to run `docker compose pull/up`, which is effectively root-equivalent host access. Worth understanding the tradeoff we accepted rather than skipping past it. | Intermediate |

---

**Not covered here (already explained in our own project docs):** Clerk/Svix webhook signature verification (`WEBHOOK_SECRET`), and New Relic's in-process log forwarding — both niche/project-specific enough that `DEPLOYMENT.md` and our conversation history are the better reference.
