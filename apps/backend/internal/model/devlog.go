package model

type Devlog struct {
	Base
	ProjectID int64   `json:"projectId" db:"project_id"`
	Title     string  `json:"title" db:"title"`
	Content   string  `json:"content" db:"content"`
	IsPublic  bool    `json:"isPublic" db:"is_public"`
	CreatedBy string  `json:"createdBy" db:"created_by"`
	UpdatedBy *string `json:"updatedBy" db:"updated_by"`
}
