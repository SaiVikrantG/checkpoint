package router

import (
	"github.com/SaiVikrantG/checkpoint/internal/handlers"
	"github.com/SaiVikrantG/checkpoint/internal/middlewares"
	"github.com/labstack/echo/v4"
)

func registerSettingsRoutes(g *echo.Group, h *handlers.Handlers, auth *middlewares.AuthMiddleWare) {
	g.GET("/settings/theme", h.Settings.GetTheme())
	g.PUT("/settings/theme", h.Settings.UpdateTheme(), auth.RequireAuth)
}
