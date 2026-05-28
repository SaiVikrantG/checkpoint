-- name: GetArticleByID :one
SELECT id, project_id, title, content, slug, is_public, created_by, updated_by, created_at, updated_at
FROM articles
WHERE id = $1;

-- name: GetAllArticles :many
SELECT id, project_id, title, content, slug, is_public, created_by, updated_by, created_at, updated_at
FROM articles
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: GetArticlesCount :one
SELECT COUNT(*) FROM articles;

-- name: CreateArticle :one
INSERT INTO articles (project_id, title, content, slug, is_public, created_by, created_at)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: DeleteArticle :exec
DELETE FROM articles
WHERE id = $1;

-- name: UpdateArticle :one
UPDATE articles
SET title = COALESCE($2, title),
    content = COALESCE($3, content),
    slug = COALESCE($4, slug),
    is_public = COALESCE($5, is_public),
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;
