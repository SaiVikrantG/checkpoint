package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/SaiVikrantG/checkpoint/internal/server"
	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/clerk/clerk-sdk-go/v2/user"
)

var ErrUserNotFound = errors.New("user not found")

// TODO: Need to implement custom authentication service
type AuthService struct {
	server *server.Server
}

func NewAuthService(server *server.Server) *AuthService {
	clerk.SetKey(server.Config.Auth.SecretKey)
	return &AuthService{
		server: server,
	}
}

func (s *AuthService) AssignDefaultRole(ctx context.Context, userID string) error {
	defaultRole := s.server.Config.Auth.DefaultRole
	metadata := json.RawMessage(fmt.Sprintf(`{"role":"%s"}`, defaultRole))
	_, err := user.Update(ctx, userID, &user.UpdateParams{
		PublicMetadata: &metadata,
	})
	if err != nil {
		var apiErr *clerk.APIErrorResponse
		if errors.As(err, &apiErr) && apiErr.HTTPStatusCode == 404 {
			return ErrUserNotFound
		}
		return err
	}
	return nil
}
