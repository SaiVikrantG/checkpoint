package repositories

import (
	"context"

	db "github.com/SaiVikrantG/checkpoint/internal/database/db"
	"github.com/SaiVikrantG/checkpoint/internal/model"
	"github.com/jackc/pgx/v5/pgtype"
)

type DevlogRepository struct {
	queries *db.Queries
}

func NewDevlogRepository(q *db.Queries) *DevlogRepository {
	return &DevlogRepository{queries: q}
}

func (r *DevlogRepository) GetAllDevlogs(ctx context.Context, page, limit int, createdBy string) ([]model.Devlog, int64, error) {
	createdByParam := pgtype.Text{}
	if createdBy != "" {
		createdByParam = pgtype.Text{String: createdBy, Valid: true}
	}

	rows, err := r.queries.GetAllDevlogs(ctx, db.GetAllDevlogsParams{
		Limit:     int32(limit),
		Offset:    int32((page - 1) * limit),
		CreatedBy: createdByParam,
	})
	if err != nil {
		return nil, 0, err
	}

	total, err := r.queries.GetDevlogsCount(ctx, createdByParam)
	if err != nil {
		return nil, 0, err
	}

	devlogs := make([]model.Devlog, len(rows))
	for i, row := range rows {
		devlogs[i] = toModelDevlog(row)
	}

	return devlogs, total, nil
}

func (r *DevlogRepository) GetDevlogsByProjectID(ctx context.Context, projectID int64, page, limit int) ([]model.Devlog, int64, error) {
	rows, err := r.queries.GetDevlogsByProjectID(ctx, db.GetDevlogsByProjectIDParams{
		ProjectID: projectID,
		Limit:     int32(limit),
		Offset:    int32((page - 1) * limit),
	})
	if err != nil {
		return nil, 0, err
	}

	total, err := r.queries.GetDevlogsCountByProjectID(ctx, projectID)
	if err != nil {
		return nil, 0, err
	}

	devlogs := make([]model.Devlog, len(rows))
	for i, row := range rows {
		devlogs[i] = toModelDevlog(row)
	}

	return devlogs, total, nil
}

func (r *DevlogRepository) GetDevlogByID(ctx context.Context, id int64) (model.Devlog, error) {
	row, err := r.queries.GetDevlogByID(ctx, id)
	if err != nil {
		return model.Devlog{}, err
	}
	return toModelDevlog(row), nil
}

func (r *DevlogRepository) CreateDevlog(ctx context.Context, devlog *model.Devlog) (*model.Devlog, error) {
	row, err := r.queries.CreateDevlog(ctx, db.CreateDevlogParams{
		ProjectID: devlog.ProjectID,
		Title:     devlog.Title,
		Content:   devlog.Content,
		IsPublic:  pgtype.Bool{Bool: devlog.IsPublic, Valid: true},
		CreatedBy: devlog.CreatedBy,
		CreatedAt: pgtype.Timestamp{Time: devlog.CreatedAt, Valid: true},
	})
	if err != nil {
		return nil, err
	}
	result := toModelDevlog(row)
	return &result, nil
}

func (r *DevlogRepository) UpdateDevlog(ctx context.Context, id int64, devlog *model.Devlog) (*model.Devlog, error) {
	row, err := r.queries.UpdateDevlog(ctx, db.UpdateDevlogParams{
		ID:       id,
		Title:    devlog.Title,
		Content:  devlog.Content,
		IsPublic: pgtype.Bool{Bool: devlog.IsPublic, Valid: true},
	})
	if err != nil {
		return nil, err
	}
	result := toModelDevlog(row)
	return &result, nil
}

func (r *DevlogRepository) DeleteDevlog(ctx context.Context, id int64) error {
	return r.queries.DeleteDevlog(ctx, id)
}

func toModelDevlog(d db.Devlog) model.Devlog {
	return model.Devlog{
		Base: model.Base{
			BaseWithId:        model.BaseWithId{ID: d.ID},
			BaseWithCreatedAt: model.BaseWithCreatedAt{CreatedAt: timeFromPg(d.CreatedAt)},
			BaseWithUpdatedAt: model.BaseWithUpdatedAt{UpdatedAt: timeFromPg(d.UpdatedAt)},
		},
		ProjectID: d.ProjectID,
		Title:     d.Title,
		Content:   d.Content,
		IsPublic:  d.IsPublic.Bool,
		CreatedBy: d.CreatedBy,
		UpdatedBy: textToPtr(d.UpdatedBy),
	}
}

