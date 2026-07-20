-- name: GetThemeSettings :one
SELECT id, name, bg, fg, ac, updated_by, updated_at
FROM site_settings
WHERE id = 1;

-- name: UpdateThemeSettings :one
UPDATE site_settings
SET name = $1,
    bg = $2,
    fg = $3,
    ac = $4,
    updated_by = $5,
    updated_at = CURRENT_TIMESTAMP
WHERE id = 1
RETURNING id, name, bg, fg, ac, updated_by, updated_at;
