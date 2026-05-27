package handlers

import (
	"github.com/SaiVikrantG/checkpoint/internal/errors"
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
	if r.ID <= 0 {
		return errors.NewBadRequestError("Invalid request", false, []errors.FieldError{
			{Field: "id", Error: "must be a positive integer"},
		}, nil)
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

type GetAllProjectsRequest struct {
	Page  int `query:"page"`
	Limit int `query:"limit"`
}

func (r GetAllProjectsRequest) Validate() error {
	if r.Limit > 100 {
		return errors.NewBadRequestError("Invalid request", false, []errors.FieldError{
			{Field: "limit", Error: "must not exceed 100"},
		}, nil)
	}
	return nil
}

func (h *ProjectHandler) handleGetAllProjectsLogic(c echo.Context, req GetAllProjectsRequest) (model.PaginatedResponse[model.Project], error) {
	page := req.Page
	if page <= 0 {
		page = 1
	}
	limit := req.Limit
	if limit <= 0 {
		limit = 20
	}
	return h.projectServices.GetAllProjects(c.Request().Context(), page, limit)
}

func (h *ProjectHandler) GetAllProjects() echo.HandlerFunc {
	return Handle(h.Handler, h.handleGetAllProjectsLogic, 200, GetAllProjectsRequest{})
}

func (h *ProjectHandler) GetProjectByID() echo.HandlerFunc {
	return Handle(h.Handler, h.handleGetProjectLogic, 200, GetProjectByIDRequest{ID: 0})
}
