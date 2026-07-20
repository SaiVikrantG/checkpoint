package router

import (
	"github.com/SaiVikrantG/checkpoint/internal/handlers"
	"github.com/SaiVikrantG/checkpoint/internal/middlewares"
	"github.com/labstack/echo/v4"
)

func registerArticleRoutes(g *echo.Group, h *handlers.Handlers, auth *middlewares.AuthMiddleWare) {
	g.GET("/articles", h.Articles.GetAllArticles(), auth.OptionalAuth)
	g.GET("/articles/slug/:slug", h.Articles.GetArticleBySlug(), auth.OptionalAuth)
	g.GET("/articles/:id", h.Articles.GetArticleByID(), auth.OptionalAuth)

	g.POST("/articles", h.Articles.CreateArticle(), auth.RequireAuth)
	g.PATCH("/articles/:id", h.Articles.UpdateArticle(), auth.RequireAuth)
	g.DELETE("/articles/:id", h.Articles.DeleteArticle(), auth.RequireAuth)
}
