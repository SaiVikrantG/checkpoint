package service

import (
	"github.com/SaiVikrantG/checkpoint/internal/server"
	"github.com/clerk/clerk-sdk-go/v2"
)

// TODO: Need to change the auth service to a custom implementation
type AuthService struct {
	server *server.Server
}

func NewAuthService(server *server.Server) *AuthService {
	clerk.SetKey(server.Config.Auth.SecretKey)
	return &AuthService{
		server: server,
	}
}
