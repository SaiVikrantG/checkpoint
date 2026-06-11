package router

import (
	handler "github.com/SaiVikrantG/checkpoint/internal/handlers"
	"github.com/labstack/echo/v4"
)

func registerWebhookRoutes(g *echo.Group, h *handler.Handlers) {
	g.POST("/webhooks/clerk", h.Webhooks.HandleClerkWebhook())
}
