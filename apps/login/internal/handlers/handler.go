package handlers

import (
	"github.com/SaiVikrantG/checkpoint/internal/server"
	"github.com/SaiVikrantG/checkpoint/internal/service"
)

// handlers needed for services
// will basically be embedded in this struct
type Handlers struct {
	Health   *HealthHandler
	OpenAPI  *OpenAPIHandler
	Projects *ProjectHandler
	Articles *ArticleHandler
	Devlogs  *DevlogHandler
}

// handler instances for handlers of each service will be passed
// to this init function to succesfully initialize and return the
// handlers struct, such that each handler can be called conveniently from one handler struct
func InitHandlers(s *server.Server, services *service.Services) *Handlers {
	return &Handlers{
		Health:   NewHealthHandler(s),
		Projects: NewProjectHandler(s, services.Projects),
		Articles: NewArticleHandler(s, services.Articles),
		Devlogs:  NewDevlogHandler(s, services.Devlogs),
	}
}
