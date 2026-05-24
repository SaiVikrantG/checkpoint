package service

import (
	"github.com/SaiVikrantG/checkpoint/internal/repositories"
	"github.com/SaiVikrantG/checkpoint/internal/server"
)

type Services struct {
	Auth     *AuthService
	Projects *ProjectService
}

// TODO: Need to implement services logic with all the logical resources in my backend
//
//	which would then need the repository implementations
func NewService(server *server.Server, repos *repositories.Repository) (*Services, error) {
	authService := NewAuthService(server)

	projectService := NewProjectService(server, repos.ProjectRepo)

	return &Services{
		Auth:     authService,
		Projects: projectService,
	}, nil
}
