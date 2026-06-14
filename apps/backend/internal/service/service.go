package service

import (
	"github.com/SaiVikrantG/checkpoint/internal/repositories"
	"github.com/SaiVikrantG/checkpoint/internal/server"
)

const roleSuperAdmin = "org:super_admin"

func canModify(resourceOwner, userID, userRole string) bool {
	return userRole == roleSuperAdmin || resourceOwner == userID
}

type Services struct {
	Auth     *AuthService
	Projects *ProjectService
	Articles *ArticleService
	Devlogs  *DevlogService
}

// TODO: Need to implement services logic with all the logical resources in my backend
//
//	which would then need the repository implementations
func NewService(server *server.Server, repos *repositories.Repository) (*Services, error) {
	authService := NewAuthService(server)
	projectService := NewProjectService(server, repos.ProjectRepo)
	articleService := NewArticleService(server, repos.ArticleRepo)
	devlogService := NewDevlogService(server, repos.DevlogRepo)

	return &Services{
		Auth:     authService,
		Projects: projectService,
		Articles: articleService,
		Devlogs:  devlogService,
	}, nil
}
