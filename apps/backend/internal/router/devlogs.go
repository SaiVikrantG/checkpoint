package router

import (
	"github.com/SaiVikrantG/checkpoint/internal/handlers"
	"github.com/SaiVikrantG/checkpoint/internal/middlewares"
	"github.com/labstack/echo/v4"
)

func registerDevlogRoutes(g *echo.Group, h *handlers.Handlers, auth *middlewares.AuthMiddleWare) {
	g.GET("/devlogs", h.Devlogs.GetAllDevlogs(), auth.OptionalAuth)
	g.GET("/devlogs/project/:projectId", h.Devlogs.GetDevlogsByProjectID(), auth.OptionalAuth)
	g.GET("/devlogs/:id", h.Devlogs.GetDevlogByID(), auth.OptionalAuth)

	g.POST("/devlogs", h.Devlogs.CreateDevlog(), auth.RequireAuth)
	g.PATCH("/devlogs/:id", h.Devlogs.UpdateDevlog(), auth.RequireAuth)
	g.DELETE("/devlogs/:id", h.Devlogs.DeleteDevlog(), auth.RequireAuth)
}
