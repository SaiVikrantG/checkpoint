package middlewares

import (
	"github.com/SaiVikrantG/checkpoint/internal/server"
	"github.com/newrelic/go-agent/v3/newrelic"
)

type Middlewares struct {
	Global          *GlobalMiddlewares
	Auth            *AuthMiddleWare
	ContextEnhancer *ContextEnhancer
	RateLimit       *RateLimitMiddleware
	Tracing         *TracingMiddleware
}

func NewMiddlewares(s *server.Server) *Middlewares {
	var nrApp *newrelic.Application
	if s.LoggerService != nil {
		nrApp = s.LoggerService.GetApplication()
	}

	return &Middlewares{
		Global:          NewGlobalMiddlewares(s),
		Auth:            NewAuthMiddleWare(s),
		ContextEnhancer: NewContextEnhancer(s),
		RateLimit:       NewRateLimitMiddleware(s),
		Tracing:         NewTracingMiddleware(s, nrApp),
	}
}
