#!/usr/bin/env bash
set -euo pipefail

# Deploys a new checkpoint-backend image tag, health-checks it against /status,
# and automatically rolls back to the last-known-good tag if the health check fails.
# Invoked by the `webhook` container's deploy-backend hook, with $1 being the full
# image reference Diun reported (e.g. ghcr.io/saivikrantg/checkpoint-backend:v1.2.3) —
# Diun's webhook notifier sends a fixed JSON payload, not a templated URL, so hooks.json
# passes the whole `image` field through and we strip the tag off it here.

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE="docker compose -f $DEPLOY_DIR/docker-compose.yml --env-file $DEPLOY_DIR/.env --env-file $DEPLOY_DIR/current-tag.env"
LOCK_FILE="$DEPLOY_DIR/.deploy.lock"

# docker compose gives an inherited shell/process env var priority over --env-file
# values for ${VAR} interpolation. current-tag.env must be the sole source of truth
# for BACKEND_TAG, so drop any inherited value before it can shadow the file.
unset BACKEND_TAG

# .env holds dotted keys (CHECKPOINT_AUTH.SECRET_KEY etc, read by the Go app via koanf,
# not valid bash variable names) so it can't be `source`-d whole here. Pull out only the
# underscore-named deploy-tooling keys we need, directly.
env_val() { grep "^$1=" "$DEPLOY_DIR/.env" | tail -1 | cut -d= -f2-; }

IMAGE_REF="${1:-}"
NEW_TAG="${IMAGE_REF##*:}"
TAG_RE='^v[0-9]+\.[0-9]+\.[0-9]+$'

log() { echo "[$(date)] $*"; }

notify() {
  local message="$1"
  local topic_url
  topic_url="$(env_val CHECKPOINT_DEPLOY_NTFY_TOPIC_URL)"
  if [ -n "$topic_url" ]; then
    curl -sf -X POST -d "$message" "$topic_url" > /dev/null || log "WARNING: notify failed"
  fi
}

health_check() {
  local retries interval
  retries="$(env_val CHECKPOINT_DEPLOY_HEALTHCHECK_RETRIES)"
  interval="$(env_val CHECKPOINT_DEPLOY_HEALTHCHECK_INTERVAL_SECONDS)"
  retries="${retries:-10}"
  interval="${interval:-3}"
  local attempt=1
  while [ "$attempt" -le "$retries" ]; do
    if curl -sf "http://backend:8080/status" | grep -q '"status":"healthy"'; then
      return 0
    fi
    log "health check attempt $attempt/$retries failed, retrying in ${interval}s"
    sleep "$interval"
    attempt=$((attempt + 1))
  done
  return 1
}

# Sets current-tag.env to $1, pulls + starts backend on it, then health-checks.
# Returns non-zero on ANY failure in that chain (pull, up, or health check) so the
# caller can treat "image doesn't exist" the same as "started but unhealthy" —
# both need to trigger rollback, not abort the script via set -e.
deploy_and_check() {
  local tag="$1"
  sed -i "s/^BACKEND_TAG=.*/BACKEND_TAG=$tag/" "$DEPLOY_DIR/current-tag.env"
  if ! $COMPOSE pull backend; then
    log "pull failed for $tag"
    return 1
  fi
  if ! $COMPOSE up -d backend; then
    log "up failed for $tag"
    return 1
  fi
  health_check
}

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  log "another deploy is already in progress, exiting"
  exit 1
fi

if [ -z "$NEW_TAG" ]; then
  log "ERROR: no tag provided"
  exit 1
fi
if ! [[ "$NEW_TAG" =~ $TAG_RE ]]; then
  log "ERROR: tag '$NEW_TAG' does not match $TAG_RE"
  exit 1
fi

LAST_GOOD_TAG="$(grep '^BACKEND_TAG=' "$DEPLOY_DIR/current-tag.env" | cut -d= -f2)"

if [ "$NEW_TAG" = "$LAST_GOOD_TAG" ]; then
  log "tag $NEW_TAG is already deployed, nothing to do"
  exit 0
fi

log "deploying $NEW_TAG (previous: $LAST_GOOD_TAG)"

if deploy_and_check "$NEW_TAG"; then
  log "deploy of $NEW_TAG succeeded"
  notify "checkpoint backend deployed: $NEW_TAG"
  exit 0
fi

log "$NEW_TAG failed, rolling back to $LAST_GOOD_TAG"

if deploy_and_check "$LAST_GOOD_TAG"; then
  log "rollback to $LAST_GOOD_TAG succeeded"
  notify "checkpoint backend rollback: $NEW_TAG failed, reverted to $LAST_GOOD_TAG"
  exit 1
fi

log "CRITICAL: rollback to $LAST_GOOD_TAG also failed, manual intervention required"
notify "CRITICAL: checkpoint backend deploy AND rollback both failed ($NEW_TAG -> $LAST_GOOD_TAG). SSH in now."
exit 1
