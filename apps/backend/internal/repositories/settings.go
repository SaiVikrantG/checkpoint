package repositories

import (
	"context"

	db "github.com/SaiVikrantG/checkpoint/internal/database/db"
	"github.com/SaiVikrantG/checkpoint/internal/model"
	"github.com/jackc/pgx/v5/pgtype"
)

type SettingsRepository struct {
	queries *db.Queries
}

func NewSettingsRepository(q *db.Queries) *SettingsRepository {
	return &SettingsRepository{queries: q}
}

func (r *SettingsRepository) GetTheme(ctx context.Context) (model.ThemeSettings, error) {
	row, err := r.queries.GetThemeSettings(ctx)
	if err != nil {
		return model.ThemeSettings{}, err
	}
	return toModelTheme(row), nil
}

func (r *SettingsRepository) UpdateTheme(ctx context.Context, theme *model.ThemeSettings, updatedBy string) (model.ThemeSettings, error) {
	row, err := r.queries.UpdateThemeSettings(ctx, db.UpdateThemeSettingsParams{
		Name:      theme.Name,
		Bg:        theme.Bg,
		Fg:        theme.Fg,
		Ac:        theme.Ac,
		UpdatedBy: pgtype.Text{String: updatedBy, Valid: updatedBy != ""},
	})
	if err != nil {
		return model.ThemeSettings{}, err
	}
	return toModelTheme(row), nil
}

func toModelTheme(s db.SiteSetting) model.ThemeSettings {
	return model.ThemeSettings{
		Name:      s.Name,
		Bg:        s.Bg,
		Fg:        s.Fg,
		Ac:        s.Ac,
		UpdatedBy: textToPtr(s.UpdatedBy),
		UpdatedAt: timeFromPg(s.UpdatedAt),
	}
}
