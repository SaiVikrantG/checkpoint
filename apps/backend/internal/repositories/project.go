package repositories

import (
	"context"
	"time"

	db "github.com/SaiVikrantG/checkpoint/internal/database/db"
	"github.com/SaiVikrantG/checkpoint/internal/model"
	"github.com/jackc/pgx/v5/pgtype"
)

type ProjectRepository struct {
	queries *db.Queries
}

func NewProjectRepository(q *db.Queries) *ProjectRepository {
	return &ProjectRepository{queries: q}
}

func (r *ProjectRepository) GetProjectByID(ctx context.Context, id int64, requestingUserID string) (model.Project, error) {
	requestingUserIDParam := pgtype.Text{}
	if requestingUserID != "" {
		requestingUserIDParam = pgtype.Text{String: requestingUserID, Valid: true}
	}

	row, err := r.queries.GetProjectByID(ctx, db.GetProjectByIDParams{
		ID:               id,
		RequestingUserID: requestingUserIDParam,
	})
	if err != nil {
		return model.Project{}, err
	}
	return toModelProjectFromRow(row), nil
}

func (r *ProjectRepository) GetAllProjects(ctx context.Context, page, limit int, createdBy, requestingUserID string) ([]model.Project, int64, error) {
	createdByParam := pgtype.Text{}
	if createdBy != "" {
		createdByParam = pgtype.Text{String: createdBy, Valid: true}
	}
	requestingUserIDParam := pgtype.Text{}
	if requestingUserID != "" {
		requestingUserIDParam = pgtype.Text{String: requestingUserID, Valid: true}
	}

	rows, err := r.queries.GetAllProjects(ctx, db.GetAllProjectsParams{
		Limit:            int32(limit),              //nolint:gosec // bounded by handler validation
		Offset:           int32((page - 1) * limit), //nolint:gosec // bounded by handler validation
		CreatedBy:        createdByParam,
		RequestingUserID: requestingUserIDParam,
	})
	if err != nil {
		return nil, 0, err
	}

	total, err := r.queries.GetProjectsCount(ctx, db.GetProjectsCountParams{
		CreatedBy:        createdByParam,
		RequestingUserID: requestingUserIDParam,
	})
	if err != nil {
		return nil, 0, err
	}

	projects := make([]model.Project, len(rows))
	for i, row := range rows {
		projects[i] = toModelProjectFromListRow(row)
	}

	return projects, total, nil
}

func (r *ProjectRepository) CreateProject(ctx context.Context, project *model.Project) (*model.Project, error) {
	row, err := r.queries.CreateProject(ctx, db.CreateProjectParams{
		Name:        project.Name,
		Description: pgtype.Text{String: derefStr(project.Description), Valid: project.Description != nil},
		Url:         pgtype.Text{String: derefStr(project.URL), Valid: project.URL != nil},
		Status:      project.Status,
		Stack:       project.Stack,
		IsPublic:    pgtype.Bool{Bool: project.IsPublic, Valid: true},
		CreatedBy:   project.CreatedBy,
		CreatedAt:   pgtype.Timestamp{Time: project.CreatedAt, Valid: true},
	})
	if err != nil {
		return nil, err
	}
	result := toModelProjectFromDB(row)
	return &result, nil
}

func (r *ProjectRepository) DeleteProject(ctx context.Context, id int64) error {
	return r.queries.DeleteProject(ctx, id)
}

func (r *ProjectRepository) UpdateProject(ctx context.Context, id int64, project *model.Project) (*model.Project, error) {
	row, err := r.queries.UpdateProject(ctx, db.UpdateProjectParams{
		ID:          id,
		Name:        project.Name,
		Description: pgtype.Text{String: derefStr(project.Description), Valid: project.Description != nil},
		Url:         pgtype.Text{String: derefStr(project.URL), Valid: project.URL != nil},
		Status:      project.Status,
		Stack:       project.Stack,
		IsPublic:    pgtype.Bool{Bool: project.IsPublic, Valid: true},
	})
	if err != nil {
		return nil, err
	}
	result := toModelProjectFromDB(row)
	return &result, nil
}

func toModelProjectFromRow(p db.GetProjectByIDRow) model.Project {
	return model.Project{
		Base: model.Base{
			BaseWithId:        model.BaseWithId{ID: p.ID},
			BaseWithCreatedAt: model.BaseWithCreatedAt{CreatedAt: timeFromPg(p.CreatedAt)},
			BaseWithUpdatedAt: model.BaseWithUpdatedAt{UpdatedAt: timeFromPg(p.UpdatedAt)},
		},
		Name:        p.Name,
		Description: textToPtr(p.Description),
		URL:         textToPtr(p.Url),
		Status:      p.Status,
		Stack:       p.Stack,
		IsPublic:    p.IsPublic.Bool,
		CreatedBy:   p.CreatedBy,
		UpdatedBy:   textToPtr(p.UpdatedBy),
	}
}

func toModelProjectFromListRow(p db.GetAllProjectsRow) model.Project {
	return model.Project{
		Base: model.Base{
			BaseWithId:        model.BaseWithId{ID: p.ID},
			BaseWithCreatedAt: model.BaseWithCreatedAt{CreatedAt: timeFromPg(p.CreatedAt)},
			BaseWithUpdatedAt: model.BaseWithUpdatedAt{UpdatedAt: timeFromPg(p.UpdatedAt)},
		},
		Name:        p.Name,
		Description: textToPtr(p.Description),
		URL:         textToPtr(p.Url),
		Status:      p.Status,
		Stack:       p.Stack,
		IsPublic:    p.IsPublic.Bool,
		CreatedBy:   p.CreatedBy,
		UpdatedBy:   textToPtr(p.UpdatedBy),
	}
}

func toModelProjectFromDB(p db.Project) model.Project {
	return model.Project{
		Base: model.Base{
			BaseWithId:        model.BaseWithId{ID: p.ID},
			BaseWithCreatedAt: model.BaseWithCreatedAt{CreatedAt: timeFromPg(p.CreatedAt)},
			BaseWithUpdatedAt: model.BaseWithUpdatedAt{UpdatedAt: timeFromPg(p.UpdatedAt)},
		},
		Name:        p.Name,
		Description: textToPtr(p.Description),
		URL:         textToPtr(p.Url),
		Status:      p.Status,
		Stack:       p.Stack,
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
