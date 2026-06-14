package service

import (
	"context"
	"math"

	"github.com/SaiVikrantG/checkpoint/internal/errors"
	"github.com/SaiVikrantG/checkpoint/internal/model"
	"github.com/SaiVikrantG/checkpoint/internal/repositories"
	"github.com/SaiVikrantG/checkpoint/internal/server"
	"github.com/jackc/pgx/v5"
)

type DevlogService struct {
	server     *server.Server
	repository *repositories.DevlogRepository
}

func NewDevlogService(server *server.Server, devlogRepo *repositories.DevlogRepository) *DevlogService {
	return &DevlogService{
		server:     server,
		repository: devlogRepo,
	}
}

func (s *DevlogService) GetAllDevlogs(ctx context.Context, page, limit int, createdBy string) (model.PaginatedResponse[model.Devlog], error) {
	devlogs, total, err := s.repository.GetAllDevlogs(ctx, page, limit, createdBy)
	if err != nil {
		return model.PaginatedResponse[model.Devlog]{}, err
	}

	totalPages := int(math.Ceil(float64(total) / float64(limit)))

	return model.PaginatedResponse[model.Devlog]{
		Data:       devlogs,
		Page:       page,
		Limit:      limit,
		Total:      int(total),
		TotalPages: totalPages,
	}, nil
}

func (s *DevlogService) GetDevlogsByProjectID(ctx context.Context, projectID int64, page, limit int) (model.PaginatedResponse[model.Devlog], error) {
	devlogs, total, err := s.repository.GetDevlogsByProjectID(ctx, projectID, page, limit)
	if err != nil {
		return model.PaginatedResponse[model.Devlog]{}, err
	}

	totalPages := int(math.Ceil(float64(total) / float64(limit)))

	return model.PaginatedResponse[model.Devlog]{
		Data:       devlogs,
		Page:       page,
		Limit:      limit,
		Total:      int(total),
		TotalPages: totalPages,
	}, nil
}

func (s *DevlogService) GetDevlogByID(ctx context.Context, id int64) (model.Devlog, error) {
	devlog, err := s.repository.GetDevlogByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return model.Devlog{}, errors.NewNotFoundError("devlog not found", true)
		}
		return model.Devlog{}, err
	}
	return devlog, nil
}

func (s *DevlogService) CreateDevlog(ctx context.Context, devlog *model.Devlog) (*model.Devlog, error) {
	return s.repository.CreateDevlog(ctx, devlog)
}

func (s *DevlogService) UpdateDevlog(ctx context.Context, id int64, devlog *model.Devlog, userID, userRole string) (*model.Devlog, error) {
	existing, err := s.repository.GetDevlogByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, errors.NewNotFoundError("devlog not found", true)
		}
		return nil, err
	}
	if !canModify(existing.CreatedBy, userID, userRole) {
		return nil, errors.NewForbiddenError("you do not have permission to update this devlog", true)
	}

	if devlog.Title == "" {
		devlog.Title = existing.Title
	}
	if devlog.Content == "" {
		devlog.Content = existing.Content
	}

	return s.repository.UpdateDevlog(ctx, id, devlog)
}

func (s *DevlogService) DeleteDevlog(ctx context.Context, id int64, userID, userRole string) error {
	existing, err := s.repository.GetDevlogByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return errors.NewNotFoundError("devlog not found", true)
		}
		return err
	}
	if !canModify(existing.CreatedBy, userID, userRole) {
		return errors.NewForbiddenError("you do not have permission to delete this devlog", true)
	}
	return s.repository.DeleteDevlog(ctx, id)
}
