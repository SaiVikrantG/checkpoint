package router

import (
	"github.com/SaiVikrantG/checkpoint/internal/handlers"
	"github.com/SaiVikrantG/checkpoint/internal/middlewares"
	"github.com/labstack/echo/v4"
)

func registerProjectRoutes(g *echo.Group, h *handlers.Handlers, auth *middlewares.AuthMiddleWare) {
	g.GET("/projects", h.Projects.GetAllProjects(), auth.OptionalAuth)
	g.GET("/projects/:id", h.Projects.GetProjectByID(), auth.OptionalAuth)

	g.POST("/projects", h.Projects.CreateProject(), auth.RequireAuth)
	g.PATCH("/projects/:id", h.Projects.UpdateProject(), auth.RequireAuth)
	g.DELETE("/projects/:id", h.Projects.DeleteProject(), auth.RequireAuth)
}
