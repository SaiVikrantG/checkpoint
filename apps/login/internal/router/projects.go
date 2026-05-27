package router

import (
	"github.com/SaiVikrantG/checkpoint/internal/handlers"
	"github.com/labstack/echo/v4"
)

func registerProjectRoutes(g *echo.Group, h *handlers.Handlers) {
	g.GET("/projects", h.Projects.GetAllProjects())
	g.GET("/projects/:id", h.Projects.GetProjectByID())
	g.POST("/projects", h.Projects.CreateProject())
	g.DELETE("/projects/:id", h.Projects.DeleteProject())
}
