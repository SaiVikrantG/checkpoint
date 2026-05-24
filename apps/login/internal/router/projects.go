package router

import (
	"github.com/SaiVikrantG/checkpoint/internal/handlers"
	"github.com/labstack/echo/v4"
)

func registerProjectRoutes(g *echo.Group, h *handlers.Handlers) {
	g.GET("/api/v1/projects/:id", h.Projects.GetProjectByID)
}
