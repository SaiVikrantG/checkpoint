package router

import (
	"github.com/SaiVikrantG/checkpoint/internal/handlers"
	"github.com/labstack/echo/v4"
)

func registerDevlogRoutes(g *echo.Group, h *handlers.Handlers) {
	g.GET("/devlogs", h.Devlogs.GetAllDevlogs())
	g.GET("/devlogs/:id", h.Devlogs.GetDevlogByID())
	g.POST("/devlogs", h.Devlogs.CreateDevlog())
	g.PATCH("/devlogs/:id", h.Devlogs.UpdateDevlog())
	g.DELETE("/devlogs/:id", h.Devlogs.DeleteDevlog())
}
