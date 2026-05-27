package repositories

import (
	"context"
	"time"

	db "github.com/SaiVikrantG/checkpoint/internal/database/db"
	"github.com/SaiVikrantG/checkpoint/internal/model"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/labstack/echo/v4"
)

type ProjectRepository struct {
	queries *db.Queries
}

func NewProjectRepository(q *db.Queries) *ProjectRepository {
	return &ProjectRepository{queries: q}
}

func (r *ProjectRepository) GetProjectByID(echoCtx echo.Context, id int64) (model.Project, error) {
	row, err := r.queries.GetProjectByID(echoCtx.Request().Context(), id)
	if err != nil {
		return model.Project{}, err
	}
	return toModelProject(row), nil
}

func (r *ProjectRepository) GetAllProjects(ctx context.Context, page, limit int) ([]model.Project, int64, error) {
	rows, err := r.queries.GetAllProjects(ctx, db.GetAllProjectsParams{
		Limit:  int32(limit),
		Offset: int32((page - 1) * limit),
	})
	if err != nil {
		return nil, 0, err
	}

	total, err := r.queries.GetProjectsCount(ctx)
	if err != nil {
		return nil, 0, err
	}

	projects := make([]model.Project, len(rows))
	for i, row := range rows {
		projects[i] = toModelProject(row)
	}

	return projects, total, nil
}

func (r *ProjectRepository) CreateProject(ctx context.Context, project *model.Project) (*model.Project, error) {
	row, err := r.queries.CreateProject(ctx, db.CreateProjectParams{
		Name:        project.Name,
		Description: pgtype.Text{String: derefStr(project.Description), Valid: project.Description != nil},
		IsPublic:    pgtype.Bool{Bool: project.IsPublic, Valid: true},
		CreatedBy:   project.CreatedBy,
		CreatedAt:   pgtype.Timestamp{Time: project.CreatedAt, Valid: true},
	})
	if err != nil {
		return nil, err
	}
	result := toModelProject(row)
	return &result, nil
}

func (r *ProjectRepository) DeleteProject(ctx context.Context, id int64) error {
	return r.queries.DeleteProject(ctx, id)
}

func toModelProject(p db.Project) model.Project {
	return model.Project{
		Base: model.Base{
			BaseWithId:        model.BaseWithId{ID: p.ID},
			BaseWithCreatedAt: model.BaseWithCreatedAt{CreatedAt: timeFromPg(p.CreatedAt)},
			BaseWithUpdatedAt: model.BaseWithUpdatedAt{UpdatedAt: timeFromPg(p.UpdatedAt)},
		},
		Name:        p.Name,
		Description: textToPtr(p.Description),
		IsPublic:    p.IsPublic.Bool,
		CreatedBy:   p.CreatedBy,
		UpdatedBy:   textToPtr(p.UpdatedBy),
	}
}

func textToPtr(t pgtype.Text) *string {
	if !t.Valid {
		return nil
	}
	return &t.String
}

func derefStr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func timeFromPg(t pgtype.Timestamp) time.Time {
	if !t.Valid {
		return time.Time{}
	}
	return t.Time
}
