package model

import "time"

type ThemeSettings struct {
	Name      string    `json:"name" db:"name"`
	Bg        string    `json:"bg" db:"bg"`
	Fg        string    `json:"fg" db:"fg"`
	Ac        string    `json:"ac" db:"ac"`
	UpdatedBy *string   `json:"updatedBy" db:"updated_by"`
	UpdatedAt time.Time `json:"updatedAt" db:"updated_at"`
}
