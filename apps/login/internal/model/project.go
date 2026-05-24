package model

type Project struct {
	Base
	Name        string `json:"name"`
	Description string `json:"description"`
	IsPublic    bool   `json:"is_public"`
	CreatedBy   string `json:"created_by"`
	UpdatedBy   string `json:"updated_by"`
}
