package router

import (
	"github.com/SaiVikrantG/checkpoint/internal/handlers"
	"github.com/labstack/echo/v4"
)

func registerSystemRoutes(r *echo.Echo, h *handlers.Handlers) {
	r.GET("/status", h.Health.CheckHealth)

	r.Static("/static", "static")

	r.GET("/docs", h.OpenAPI.ServeOpenAPIUI)
}
