package service

import (
	"context"

	"github.com/SaiVikrantG/checkpoint/internal/model"
	"github.com/SaiVikrantG/checkpoint/internal/repositories"
	"github.com/SaiVikrantG/checkpoint/internal/server"
)

type SettingsService struct {
	server     *server.Server
	repository *repositories.SettingsRepository
}

func NewSettingsService(server *server.Server, settingsRepo *repositories.SettingsRepository) *SettingsService {
	return &SettingsService{
		server:     server,
		repository: settingsRepo,
	}
}

func (s *SettingsService) GetTheme(ctx context.Context) (model.ThemeSettings, error) {
	return s.repository.GetTheme(ctx)
}

func (s *SettingsService) UpdateTheme(ctx context.Context, theme *model.ThemeSettings, updatedBy string) (model.ThemeSettings, error) {
	return s.repository.UpdateTheme(ctx, theme, updatedBy)
}
