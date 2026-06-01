package repositories

import (
	db "github.com/SaiVikrantG/checkpoint/internal/database/db"
	"github.com/SaiVikrantG/checkpoint/internal/server"
)

type Repository struct {
	ProjectRepo *ProjectRepository
	ArticleRepo *ArticleRepository
	DevlogRepo  *DevlogRepository
}

func RepositoryInit(server *server.Server) *Repository {
	queries := db.New(server.Db.Pool)
	return &Repository{
		ProjectRepo: NewProjectRepository(queries),
		ArticleRepo: NewArticleRepository(queries),
		DevlogRepo:  NewDevlogRepository(queries),
	}
}
