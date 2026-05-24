package repositories

import (
	"context"

	"github.com/SaiVikrantG/checkpoint/internal/model"
	"github.com/SaiVikrantG/checkpoint/internal/server"
)

type ProjectRepository struct {
	server *server.Server
}

func NewProjectRepository(server *server.Server) *ProjectRepository {
	return &ProjectRepository{
		server: server,
	}
}

func (r *ProjectRepository) GetProjectByID(ctx context.Context, id int64) (model.Project, error) {
	db := r.server.Db
	var project model.Project
	err := db.Pool.QueryRow(ctx,
		"SELECT id, name, description, is_public, created_by, updated_by, created_at, updated_at FROM projects WHERE id = $1 RETURNING *",
		id,
	).Scan(
		project.ID,
		project.Name,
		project.Description,
		project.IsPublic,
		project.CreatedBy,
		project.UpdatedBy,
		project.CreatedAt,
		project.UpdatedAt,
	)

	if err != nil {
		return model.Project{}, err
	}

	return project, nil
}

func (r *ProjectRepository) CreateProject(ctx context.Context, project *model.Project) (*model.Project, error) {
	db := r.server.Db
	err := db.Pool.QueryRow(ctx,
		"INSERT INTO projects (name, description, is_public, created_by, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING *",
		project.Name,
		project.Description,
		project.IsPublic,
		project.CreatedBy,
		project.CreatedAt,
	).Scan(
		&project.ID,
		&project.Name,
		&project.Description,
		&project.IsPublic,
		&project.CreatedBy,
		&project.UpdatedBy,
		&project.CreatedAt,
		&project.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return project, nil
}
