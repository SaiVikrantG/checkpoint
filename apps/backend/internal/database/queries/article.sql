-- name: GetArticleByID :one
SELECT id, project_id, title, content, slug, tags, views, status, is_public, created_by, updated_by, created_at, updated_at
FROM articles
WHERE id = $1
  AND (is_public = true OR (sqlc.narg('requesting_user_id')::text IS NOT NULL AND created_by = sqlc.narg('requesting_user_id')));

-- name: GetArticleBySlug :one
SELECT a.id, a.project_id, p.name AS project_name, a.title, a.content, a.slug, a.tags, a.views, a.status, a.is_public, a.created_by, a.updated_by, a.created_at, a.updated_at
FROM articles a
LEFT JOIN projects p ON p.id = a.project_id
WHERE a.slug = $1
  AND (a.is_public = true OR (sqlc.narg('requesting_user_id')::text IS NOT NULL AND a.created_by = sqlc.narg('requesting_user_id')));

-- name: GetAllArticles :many
SELECT a.id, a.project_id, p.name AS project_name, a.title, a.content, a.slug, a.tags, a.views, a.status, a.is_public, a.created_by, a.updated_by, a.created_at, a.updated_at
FROM articles a
LEFT JOIN projects p ON p.id = a.project_id
WHERE (a.is_public = true OR (sqlc.narg('requesting_user_id')::text IS NOT NULL AND a.created_by = sqlc.narg('requesting_user_id')))
  AND (sqlc.narg('created_by')::text IS NULL OR a.created_by = sqlc.narg('created_by'))
ORDER BY a.created_at DESC
LIMIT $1 OFFSET $2;

-- name: GetArticlesCount :one
SELECT COUNT(*) FROM articles
WHERE (is_public = true OR (sqlc.narg('requesting_user_id')::text IS NOT NULL AND created_by = sqlc.narg('requesting_user_id')))
  AND (sqlc.narg('created_by')::text IS NULL OR created_by = sqlc.narg('created_by'));

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
    project_id = $8,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- name: IncrementArticleViews :exec
UPDATE articles
SET views = views + 1
WHERE id = $1;
