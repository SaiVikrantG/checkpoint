-- name: GetArticleByID :one
SELECT id, project_id, title, content, slug, tags, views, status, is_public, created_by, updated_by, created_at, updated_at
FROM articles
WHERE id = $1;

-- name: GetAllArticles :many
SELECT id, project_id, title, content, slug, tags, views, status, is_public, created_by, updated_by, created_at, updated_at
FROM articles
WHERE (sqlc.narg('created_by')::text IS NULL OR created_by = sqlc.narg('created_by'))
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: GetArticlesCount :one
SELECT COUNT(*) FROM articles
WHERE (sqlc.narg('created_by')::text IS NULL OR created_by = sqlc.narg('created_by'));

-- name: CreateArticle :one
INSERT INTO articles (project_id, title, content, slug, tags, status, is_public, created_by, created_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING *;

-- name: DeleteArticle :exec
DELETE FROM articles
WHERE id = $1;

-- name: UpdateArticle :one
UPDATE articles
SET title = COALESCE($2, title),
    content = COALESCE($3, content),
    slug = COALESCE($4, slug),
    tags = COALESCE($5, tags),
    status = COALESCE($6, status),
    is_public = COALESCE($7, is_public),
    project_id = COALESCE($8, project_id),
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- name: IncrementArticleViews :exec
UPDATE articles
SET views = views + 1
WHERE id = $1;
