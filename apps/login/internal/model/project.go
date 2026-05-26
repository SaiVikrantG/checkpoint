package model

type Project struct {
	Base
	Name        string  `json:"name" db:"name"`
	Description *string `json:"description" db:"description"`
	IsPublic    bool    `json:"isPublic" db:"is_public"`
	CreatedBy   string  `json:"createdBy" db:"created_by"`
	UpdatedBy   *string `json:"updatedBy" db:"updated_by"`
}
