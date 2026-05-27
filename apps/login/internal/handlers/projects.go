package handlers

import (
	"time"

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

type CreateProjectRequest struct {
	Name        string  `json:"name" validate:"required,min=1,max=255"`
	Description *string `json:"description" validate:"omitempty,max=1000"`
	IsPublic    bool    `json:"isPublic"`
	UserID      string  `json:"userId" validate:"required"`
}

func (r CreateProjectRequest) Validate() error {
	if r.Name == "" {
		return errors.NewBadRequestError("Invalid request", false, []errors.FieldError{
			{Field: "name", Error: "name is required"},
		}, nil)
	}
	if len(r.Name) > 255 {
		return errors.NewBadRequestError("Invalid request", false, []errors.FieldError{
			{Field: "name", Error: "name must not exceed 255 characters"},
		}, nil)
	}
	if r.Description != nil && len(*r.Description) > 1000 {
		return errors.NewBadRequestError("Invalid request", false, []errors.FieldError{
			{Field: "description", Error: "description must not exceed 1000 characters"},
		}, nil)
	}
	if r.UserID == "" {
		return errors.NewBadRequestError("Invalid request", false, []errors.FieldError{
			{Field: "userId", Error: "userId is required"},
		}, nil)
	}
	return nil
}

func (h *ProjectHandler) handleCreateProjectLogic(c echo.Context, req CreateProjectRequest) (model.Project, error) {
	project := &model.Project{
		Name:        req.Name,
		Description: req.Description,
		IsPublic:    req.IsPublic,
		CreatedBy:   req.UserID,
		Base: model.Base{
			BaseWithCreatedAt: model.BaseWithCreatedAt{CreatedAt: time.Now()},
		},
	}

	createdProject, err := h.projectServices.CreateProject(c.Request().Context(), project)
	if err != nil {
		return model.Project{}, err
	}

	return *createdProject, nil
}

func (h *ProjectHandler) CreateProject() echo.HandlerFunc {
	return Handle(h.Handler, h.handleCreateProjectLogic, 201, CreateProjectRequest{})
}

type DeleteProjectRequest struct {
	ID int64 `param:"id"`
}

func (r DeleteProjectRequest) Validate() error {
	if r.ID <= 0 {
		return errors.NewBadRequestError("Invalid request", false, []errors.FieldError{
			{Field: "id", Error: "must be a positive integer"},
		}, nil)
	}
	return nil
}

func (h *ProjectHandler) handleDeleteProjectLogic(c echo.Context, req DeleteProjectRequest) (map[string]string, error) {
	err := h.projectServices.DeleteProject(c.Request().Context(), req.ID)
	if err != nil {
		return nil, err
	}

	return map[string]string{
		"message": "project deleted successfully",
	}, nil
}

func (h *ProjectHandler) DeleteProject() echo.HandlerFunc {
	return Handle(h.Handler, h.handleDeleteProjectLogic, 200, DeleteProjectRequest{ID: 0})
}
