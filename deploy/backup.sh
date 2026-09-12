#!/usr/bin/env bash
set -euo pipefail

# Nightly Postgres backup: dumps the running container's database, compresses it,
# ships it to Cloudflare R2 via rclone, then prunes old local copies.

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$DEPLOY_DIR/backups"
R2_REMOTE="r2:checkpoint-backups"
LOCAL_RETENTION_DAYS=7

# Load DB credentials from deploy/.env
set -a
# shellcheck disable=SC1091
source "$DEPLOY_DIR/.env"
set +a

mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
FILENAME="checkpoint-${TIMESTAMP}.sql.gz"
FILEPATH="$BACKUP_DIR/$FILENAME"

echo "[$(date)] Starting backup: $FILENAME"

docker compose -f "$DEPLOY_DIR/docker-compose.yml" exec -T postgres \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$FILEPATH"

echo "[$(date)] Dump complete, uploading to R2"

rclone copy "$FILEPATH" "$R2_REMOTE"

echo "[$(date)] Upload complete, pruning local backups older than ${LOCAL_RETENTION_DAYS} days"

find "$BACKUP_DIR" -name "checkpoint-*.sql.gz" -mtime "+${LOCAL_RETENTION_DAYS}" -delete

echo "[$(date)] Backup finished: $FILENAME"
