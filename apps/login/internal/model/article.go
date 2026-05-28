package model

type Article struct {
	Base
	ProjectID *int64  `json:"projectId" db:"project_id"`
	Title     string  `json:"title" db:"title"`
	Content   string  `json:"content" db:"content"`
	Slug      *string `json:"slug" db:"slug"`
	IsPublic  bool    `json:"isPublic" db:"is_public"`
	CreatedBy string  `json:"createdBy" db:"created_by"`
	UpdatedBy *string `json:"updatedBy" db:"updated_by"`
}
