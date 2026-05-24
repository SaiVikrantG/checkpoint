package repositories

import (
	"github.com/SaiVikrantG/checkpoint/internal/server"
)

type Repository struct {
	ProjectRepo *ProjectRepository
}

func RepositoryInit(server *server.Server) *Repository {
	projectRepo := NewProjectRepository(server)

	return &Repository{
		ProjectRepo: projectRepo,
	}
}
