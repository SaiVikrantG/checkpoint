package repositories

import (
	"github.com/SaiVikrantG/checkpoint/internal/server"
)

// TODO: Need to implenment repository methods based onrequirements here

type Repository struct {
}

func RepositoryInit(server *server.Server) *Repository {
	return &Repository{}
}
