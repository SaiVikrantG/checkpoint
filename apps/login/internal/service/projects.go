package service

import (
	"context"

	"github.com/SaiVikrantG/checkpoint/internal/model"
	"github.com/SaiVikrantG/checkpoint/internal/repositories"
	"github.com/SaiVikrantG/checkpoint/internal/server"
)

type ProjectService struct {
	server     *server.Server
	repository *repositories.ProjectRepository
}

func NewProjectService(server *server.Server, projectRepo *repositories.ProjectRepository) *ProjectService {
	return &ProjectService{
		server:     server,
		repository: projectRepo,
	}
}

func (s *ProjectService) GetProjectByID(ctx context.Context, id int64) (model.Project, error) {
	project, err := s.repository.GetProjectByID(ctx, id)
	if err != nil {
		// TODO: Where do we actually need to do logging?
		return model.Project{}, err
	}

	return project, nil
}
