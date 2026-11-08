package router

import (
	"github.com/SaiVikrantG/checkpoint/internal/handlers"
	"github.com/SaiVikrantG/checkpoint/internal/middlewares"
	"github.com/labstack/echo/v4"
)

// registerTailnetRoutes mounts the minimal subset of endpoints the Obsidian
// plugin needs under /tailnet/*. The trust boundary is the network path (see
// TailnetAuthMiddleWare); Caddy must block /tailnet/* on public listeners and
// the backend's port must be bound only to the tailnet interface.
//
// Handlers are reused from the regular route group — they read user_id out of
// the echo context, which the tailnet middleware populates from the request
// header.
func registerTailnetRoutes(e *echo.Echo, h *handlers.Handlers, tailnet *middlewares.TailnetAuthMiddleWare) {
	g := e.Group("/tailnet", tailnet.RequireTailnetUser)

	g.GET("/projects", h.Projects.GetAllProjects())
	g.POST("/projects", h.Projects.CreateProject())

	g.GET("/devlogs", h.Devlogs.GetAllDevlogs())
	g.GET("/devlogs/:id", h.Devlogs.GetDevlogByID())
	g.GET("/devlogs/project/:projectId", h.Devlogs.GetDevlogsByProjectID())
	g.POST("/devlogs", h.Devlogs.CreateDevlog())
}
