package model

type Article struct {
	Base
	ProjectID   *int64   `json:"projectId" db:"project_id"`
	ProjectName *string  `json:"projectName" db:"project_name"`
	Title       string   `json:"title" db:"title"`
	Content     string   `json:"content" db:"content"`
	Slug        *string  `json:"slug" db:"slug"`
	Tags        []string `json:"tags" db:"tags"`
	Views       int64    `json:"views" db:"views"`
	Status      string   `json:"status" db:"status"`
	IsPublic    bool     `json:"isPublic" db:"is_public"`
	CreatedBy   string   `json:"createdBy" db:"created_by"`
	UpdatedBy   *string  `json:"updatedBy" db:"updated_by"`
}
