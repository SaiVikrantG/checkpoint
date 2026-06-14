package model

type Project struct {
	Base
	Name        string   `json:"name" db:"name"`
	Description *string  `json:"description" db:"description"`
	URL         *string  `json:"url" db:"url"`
	Status      string   `json:"status" db:"status"`
	Stack       []string `json:"stack" db:"stack"`
	IsPublic    bool     `json:"isPublic" db:"is_public"`
	CreatedBy   string   `json:"createdBy" db:"created_by"`
	UpdatedBy   *string  `json:"updatedBy" db:"updated_by"`
}
