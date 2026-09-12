#!/usr/bin/env bash
set -euo pipefail

# Nightly Postgres backup: dumps the running container's database, compresses it,
# ships it to Cloudflare R2 via rclone, then prunes old local copies.

DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$DEPLOY_DIR/backups"
R2_REMOTE="r2:checkpoint-backups"
LOCAL_RETENTION_DAYS=7

# Load DB credentials from deploy/.env (file also contains dotted
# CHECKPOINT_* keys for the app's koanf config, which aren't valid bash
# identifiers, so extract only the vars we need instead of sourcing it all)
POSTGRES_USER="$(grep -m1 '^POSTGRES_USER=' "$DEPLOY_DIR/.env" | cut -d= -f2-)"
POSTGRES_PASSWORD="$(grep -m1 '^POSTGRES_PASSWORD=' "$DEPLOY_DIR/.env" | cut -d= -f2-)"
POSTGRES_DB="$(grep -m1 '^POSTGRES_DB=' "$DEPLOY_DIR/.env" | cut -d= -f2-)"

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
