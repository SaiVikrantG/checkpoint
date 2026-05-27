package service

import (
	"context"
	"math"

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

func (s *ProjectService) GetAllProjects(ctx context.Context, page, limit int) (model.PaginatedResponse[model.Project], error) {
	projects, total, err := s.repository.GetAllProjects(ctx, page, limit)
	if err != nil {
		return model.PaginatedResponse[model.Project]{}, err
	}

	totalPages := int(math.Ceil(float64(total) / float64(limit)))

	return model.PaginatedResponse[model.Project]{
		Data:       projects,
		Page:       page,
		Limit:      limit,
		Total:      int(total),
		TotalPages: totalPages,
	}, nil
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

func (s *ProjectService) CreateProject(ctx context.Context, project *model.Project) (*model.Project, error) {
	return s.repository.CreateProject(ctx, project)
}

func (s *ProjectService) DeleteProject(ctx context.Context, id int64) error {
	return s.repository.DeleteProject(ctx, id)
}
