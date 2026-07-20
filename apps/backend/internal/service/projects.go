package service

import (
	"context"
	"math"

	"github.com/SaiVikrantG/checkpoint/internal/errors"
	"github.com/SaiVikrantG/checkpoint/internal/model"
	"github.com/SaiVikrantG/checkpoint/internal/repositories"
	"github.com/SaiVikrantG/checkpoint/internal/server"
	"github.com/SaiVikrantG/checkpoint/internal/sqlerr"
	"github.com/jackc/pgx/v5"
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

func (s *ProjectService) GetAllProjects(ctx context.Context, page, limit int, createdBy, requestingUserID string) (model.PaginatedResponse[model.Project], error) {
	projects, total, err := s.repository.GetAllProjects(ctx, page, limit, createdBy, requestingUserID)
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

func (s *ProjectService) GetProjectByID(ctx context.Context, id int64, requestingUserID string) (model.Project, error) {
	project, err := s.repository.GetProjectByID(ctx, id, requestingUserID)
	if err != nil {
		if err == pgx.ErrNoRows {
			notFoundErr := errors.NewNotFoundError("project not found", true)
			notFoundErr.Code = sqlerr.NotFoundCode("projects")
			return model.Project{}, notFoundErr
		}
		return model.Project{}, err
	}
	return project, nil
}

func (s *ProjectService) CreateProject(ctx context.Context, project *model.Project) (*model.Project, error) {
	return s.repository.CreateProject(ctx, project)
}

func (s *ProjectService) DeleteProject(ctx context.Context, id int64, userID, userRole string) error {
	existing, err := s.repository.GetProjectByID(ctx, id, userID)
	if err != nil {
		if err == pgx.ErrNoRows {
			notFoundErr := errors.NewNotFoundError("project not found", true)
			notFoundErr.Code = sqlerr.NotFoundCode("projects")
			return notFoundErr
		}
		return err
	}
	if !canModify(existing.CreatedBy, userID, userRole) {
		forbiddenErr := errors.NewForbiddenError("you do not have permission to delete this project", true)
		forbiddenErr.Code = sqlerr.ForbiddenCode("projects")
		return forbiddenErr
	}
	return s.repository.DeleteProject(ctx, id)
}

func (s *ProjectService) UpdateProject(ctx context.Context, id int64, project *model.Project, userID, userRole string) (*model.Project, error) {
	existingProject, err := s.repository.GetProjectByID(ctx, id, userID)
	if err != nil {
		if err == pgx.ErrNoRows {
			notFoundErr := errors.NewNotFoundError("project not found", true)
			notFoundErr.Code = sqlerr.NotFoundCode("projects")
			return nil, notFoundErr
		}
		return nil, err
	}
	if !canModify(existingProject.CreatedBy, userID, userRole) {
		forbiddenErr := errors.NewForbiddenError("you do not have permission to update this project", true)
		forbiddenErr.Code = sqlerr.ForbiddenCode("projects")
		return nil, forbiddenErr
	}

	if project.Name == "" {
		project.Name = existingProject.Name
	}
	if project.Description == nil {
		project.Description = existingProject.Description
	}
	if project.URL == nil {
		project.URL = existingProject.URL
	}
	if project.Status == "" {
		project.Status = existingProject.Status
	}
	if project.Stack == nil {
		project.Stack = existingProject.Stack
	}

	return s.repository.UpdateProject(ctx, id, project)
}
