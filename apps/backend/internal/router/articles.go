package router

import (
	"github.com/SaiVikrantG/checkpoint/internal/handlers"
	"github.com/labstack/echo/v4"
)

func registerArticleRoutes(g *echo.Group, h *handlers.Handlers) {
	g.GET("/articles", h.Articles.GetAllArticles())
	g.GET("/articles/:id", h.Articles.GetArticleByID())
	g.POST("/articles", h.Articles.CreateArticle())
	g.PATCH("/articles/:id", h.Articles.UpdateArticle())
	g.DELETE("/articles/:id", h.Articles.DeleteArticle())
}
