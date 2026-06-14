-- name: GetProjectByID :one
SELECT id, name, description, url, status, stack, is_public, created_by, updated_by, created_at, updated_at
FROM projects
WHERE id = $1;

-- name: CreateProject :one
INSERT INTO projects (name, description, url, status, stack, is_public, created_by, created_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: GetAllProjects :many
SELECT id, name, description, url, status, stack, is_public, created_by, updated_by, created_at, updated_at
FROM projects
WHERE (sqlc.narg('created_by')::text IS NULL OR created_by = sqlc.narg('created_by'))
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: GetProjectsCount :one
SELECT COUNT(*) FROM projects
WHERE (sqlc.narg('created_by')::text IS NULL OR created_by = sqlc.narg('created_by'));

-- name: DeleteProject :exec
DELETE FROM projects
WHERE id = $1;

-- name: UpdateProject :one
UPDATE projects
SET name = COALESCE($2, name),
    description = COALESCE($3, description),
    url = COALESCE($4, url),
    status = COALESCE($5, status),
    stack = COALESCE($6, stack),
    is_public = COALESCE($7, is_public),
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;
