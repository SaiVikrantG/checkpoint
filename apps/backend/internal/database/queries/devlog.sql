-- name: GetDevlogByID :one
SELECT d.id, d.project_id, d.title, d.content, d.is_public, d.created_by, d.updated_by, d.created_at, d.updated_at
FROM devlogs d
INNER JOIN projects p ON p.id = d.project_id
WHERE d.id = $1
  AND ((d.is_public = true AND p.is_public = true)
       OR (sqlc.narg('requesting_user_id')::text IS NOT NULL AND d.created_by = sqlc.narg('requesting_user_id')));

-- name: GetAllDevlogs :many
SELECT d.id, d.project_id, d.title, d.content, d.is_public, d.created_by, d.updated_by, d.created_at, d.updated_at
FROM devlogs d
INNER JOIN projects p ON p.id = d.project_id
WHERE ((d.is_public = true AND p.is_public = true)
       OR (sqlc.narg('requesting_user_id')::text IS NOT NULL AND d.created_by = sqlc.narg('requesting_user_id')))
  AND (sqlc.narg('created_by')::text IS NULL OR d.created_by = sqlc.narg('created_by'))
ORDER BY d.created_at DESC
LIMIT $1 OFFSET $2;

-- name: GetDevlogsCount :one
SELECT COUNT(*) FROM devlogs d
INNER JOIN projects p ON p.id = d.project_id
WHERE ((d.is_public = true AND p.is_public = true)
       OR (sqlc.narg('requesting_user_id')::text IS NOT NULL AND d.created_by = sqlc.narg('requesting_user_id')))
  AND (sqlc.narg('created_by')::text IS NULL OR d.created_by = sqlc.narg('created_by'));

-- name: GetDevlogsByProjectID :many
SELECT d.id, d.project_id, d.title, d.content, d.is_public, d.created_by, d.updated_by, d.created_at, d.updated_at
FROM devlogs d
INNER JOIN projects p ON p.id = d.project_id
WHERE d.project_id = $1
  AND ((d.is_public = true AND p.is_public = true)
       OR (sqlc.narg('requesting_user_id')::text IS NOT NULL AND d.created_by = sqlc.narg('requesting_user_id')))
ORDER BY d.created_at DESC
LIMIT $2 OFFSET $3;

-- name: GetDevlogsCountByProjectID :one
SELECT COUNT(*) FROM devlogs d
INNER JOIN projects p ON p.id = d.project_id
WHERE d.project_id = $1
  AND ((d.is_public = true AND p.is_public = true)
       OR (sqlc.narg('requesting_user_id')::text IS NOT NULL AND d.created_by = sqlc.narg('requesting_user_id')));

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
