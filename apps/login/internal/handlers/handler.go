package handlers

import (
	"github.com/SaiVikrantG/checkpoint/internal/server"
	"github.com/SaiVikrantG/checkpoint/internal/service"
)

type Handlers struct{}

func InitHandlers(s server.Server, services *service.Services) *Handlers {
	return &Handlers{}
}
