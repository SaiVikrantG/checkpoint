package handlers

import (
	"github.com/SaiVikrantG/checkpoint/internal/errors"
	"github.com/SaiVikrantG/checkpoint/internal/model"
	"github.com/SaiVikrantG/checkpoint/internal/server"
	"github.com/SaiVikrantG/checkpoint/internal/service"
	"github.com/labstack/echo/v4"
)

type SettingsHandler struct {
	Handler
	settingsServices *service.SettingsService
}

func NewSettingsHandler(server *server.Server, services *service.SettingsService) *SettingsHandler {
	return &SettingsHandler{
		Handler:          NewHandler(server),
		settingsServices: services,
	}
}

// GetTheme

type GetThemeRequest struct{}

func (r GetThemeRequest) Validate() error {
	return nil
}

func (h *SettingsHandler) handleGetThemeLogic(c echo.Context, _ GetThemeRequest) (model.ThemeSettings, error) {
	return h.settingsServices.GetTheme(c.Request().Context())
}

func (h *SettingsHandler) GetTheme() echo.HandlerFunc {
	return Handle(h.Handler, h.handleGetThemeLogic, 200, GetThemeRequest{})
}

// UpdateTheme

type UpdateThemeRequest struct {
	Name string `json:"name" validate:"required,min=1,max=255"`
	Bg   string `json:"bg" validate:"required,hexcolor"`
	Fg   string `json:"fg" validate:"required,hexcolor"`
	Ac   string `json:"ac" validate:"required,hexcolor"`
}

func (r UpdateThemeRequest) Validate() error {
	if r.Name == "" {
		return errors.NewBadRequestError("Invalid request", false, []errors.FieldError{
			{Field: "name", Error: "name is required"},
		}, nil)
	}
	return nil
}

func (h *SettingsHandler) handleUpdateThemeLogic(c echo.Context, req UpdateThemeRequest) (model.ThemeSettings, error) {
	userID, _ := c.Get("user_id").(string)
	theme := &model.ThemeSettings{
		Name: req.Name,
		Bg:   req.Bg,
		Fg:   req.Fg,
		Ac:   req.Ac,
	}
	return h.settingsServices.UpdateTheme(c.Request().Context(), theme, userID)
}

func (h *SettingsHandler) UpdateTheme() echo.HandlerFunc {
	return Handle(h.Handler, h.handleUpdateThemeLogic, 200, UpdateThemeRequest{})
}
