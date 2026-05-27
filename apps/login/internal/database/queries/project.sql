-- name: GetProjectByID :one
SELECT id, name, description, is_public, created_by, updated_by, created_at, updated_at
FROM projects
WHERE id = $1;

-- name: CreateProject :one
INSERT INTO projects (name, description, is_public, created_by, created_at)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;
