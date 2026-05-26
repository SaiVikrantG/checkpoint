package service

import (
	"github.com/SaiVikrantG/checkpoint/internal/errors"
	"github.com/SaiVikrantG/checkpoint/internal/model"
	"github.com/SaiVikrantG/checkpoint/internal/repositories"
	"github.com/SaiVikrantG/checkpoint/internal/server"
	"github.com/jackc/pgx/v5"
	"github.com/labstack/echo/v4"
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

func (s *ProjectService) GetProjectByID(ctx echo.Context, id int64) (model.Project, error) {
	project, err := s.repository.GetProjectByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return model.Project{}, errors.NewNotFoundError("project not found", true)
		}
		return model.Project{}, err
	}
	return project, nil
}
