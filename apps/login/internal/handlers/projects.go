package handlers

import (
	"fmt"

	"github.com/SaiVikrantG/checkpoint/internal/model"
	"github.com/SaiVikrantG/checkpoint/internal/server"
	"github.com/SaiVikrantG/checkpoint/internal/service"
	"github.com/labstack/echo/v4"
)

type ProjectHandler struct {
	Handler
	projectServices *service.ProjectService
}

func NewProjectHandler(server *server.Server, services *service.ProjectService) *ProjectHandler {
	return &ProjectHandler{
		Handler:         NewHandler(server),
		projectServices: services,
	}
}

type GetProjectByIDRequest struct {
	ID int64 `param:"id"`
}

func (r GetProjectByIDRequest) Validate() error {
	if r.ID < 0 {
		return fmt.Errorf("Id cant be negative")
	}

	return nil
}

func (h *ProjectHandler) handleGetProjectLogic(c echo.Context, req GetProjectByIDRequest) (model.Project, error) {
	project, err := h.projectServices.GetProjectByID(c, req.ID)
	if err != nil {
		return model.Project{}, err
	}

	return project, nil
}

func (h *ProjectHandler) GetProjectByID() echo.HandlerFunc {
	return Handle(h.Handler, h.handleGetProjectLogic, 200, GetProjectByIDRequest{ID: 0})
}
