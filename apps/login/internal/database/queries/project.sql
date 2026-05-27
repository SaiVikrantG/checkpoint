-- name: GetProjectByID :one
SELECT id, name, description, is_public, created_by, updated_by, created_at, updated_at
FROM projects
WHERE id = $1;

-- name: CreateProject :one
INSERT INTO projects (name, description, is_public, created_by, created_at)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetAllProjects :many
SELECT id, name, description, is_public, created_by, updated_by, created_at, updated_at
FROM projects
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: GetProjectsCount :one
SELECT COUNT(*) FROM projects;

-- name: DeleteProject :exec
DELETE FROM projects
WHERE id = $1;

