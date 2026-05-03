package middlewares

import (
	"github.com/SaiVikrantG/checkpoint/internal/server"
)

type Middlewares struct {
	Global          *GlobalMiddlewares
	Auth            *AuthMiddleWare
	ContextEnhancer *ContextEnhancer
	RateLimit       *RateLimitMiddleware
}

func NewMiddlewares(s *server.Server) *Middlewares {

	return &Middlewares{
		Global:          NewGlobalMiddlewares(s),
		Auth:            NewAuthMiddleWare(s),
		ContextEnhancer: NewContextEnhancer(s),
		RateLimit:       NewRateLimitMiddleware(s),
	}
}
