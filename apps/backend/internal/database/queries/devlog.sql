-- name: GetDevlogByID :one
SELECT id, project_id, title, content, is_public, created_by, updated_by, created_at, updated_at
FROM devlogs
WHERE id = $1;

-- name: GetAllDevlogs :many
SELECT id, project_id, title, content, is_public, created_by, updated_by, created_at, updated_at
FROM devlogs
WHERE (sqlc.narg('created_by')::text IS NULL OR created_by = sqlc.narg('created_by'))
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: GetDevlogsCount :one
SELECT COUNT(*) FROM devlogs
WHERE (sqlc.narg('created_by')::text IS NULL OR created_by = sqlc.narg('created_by'));

-- name: GetDevlogsByProjectID :many
SELECT id, project_id, title, content, is_public, created_by, updated_by, created_at, updated_at
FROM devlogs
WHERE project_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetDevlogsCountByProjectID :one
SELECT COUNT(*) FROM devlogs WHERE project_id = $1;

-- name: CreateDevlog :one
INSERT INTO devlogs (project_id, title, content, is_public, created_by, created_at)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: DeleteDevlog :exec
DELETE FROM devlogs
WHERE id = $1;

-- name: UpdateDevlog :one
UPDATE devlogs
SET title = COALESCE($2, title),
    content = COALESCE($3, content),
    is_public = COALESCE($4, is_public),
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;
