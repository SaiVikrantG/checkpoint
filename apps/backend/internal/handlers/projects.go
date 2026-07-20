package handlers

import (
	"math"
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
	requestingUserID, _ := c.Get("user_id").(string)
	project, err := h.projectServices.GetProjectByID(c.Request().Context(), req.ID, requestingUserID)
	if err != nil {
		return model.Project{}, err
	}

	return project, nil
}

type GetAllProjectsRequest struct {
	Page      int    `query:"page"`
	Limit     int    `query:"limit"`
	CreatedBy string `query:"createdBy"`
}

func (r GetAllProjectsRequest) Validate() error {
	if r.Limit > 100 {
		return errors.NewBadRequestError("Invalid request", false, []errors.FieldError{
			{Field: "limit", Error: "must not exceed 100"},
		}, nil)
	}

	effectiveLimit := r.Limit
	if effectiveLimit <= 0 {
		effectiveLimit = 20
	}
	maxPage := math.MaxInt32/effectiveLimit + 1
	if r.Page > maxPage {
		return errors.NewBadRequestError("Invalid request", false, []errors.FieldError{
			{Field: "page", Error: "exceeds maximum allowed page for the given limit"},
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
	requestingUserID, _ := c.Get("user_id").(string)
	return h.projectServices.GetAllProjects(c.Request().Context(), page, limit, req.CreatedBy, requestingUserID)
}

func (h *ProjectHandler) GetAllProjects() echo.HandlerFunc {
	return Handle(h.Handler, h.handleGetAllProjectsLogic, 200, GetAllProjectsRequest{})
}

func (h *ProjectHandler) GetProjectByID() echo.HandlerFunc {
	return Handle(h.Handler, h.handleGetProjectLogic, 200, GetProjectByIDRequest{ID: 0})
}

type CreateProjectRequest struct {
	Name        string   `json:"name" validate:"required,min=1,max=255"`
	Description *string  `json:"description" validate:"omitempty,max=1000"`
	URL         *string  `json:"url" validate:"omitempty"`
	Status      string   `json:"status" validate:"omitempty,oneof=live wip archived"`
	Stack       []string `json:"stack"`
	IsPublic    bool     `json:"isPublic"`
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
	return nil
}

func (h *ProjectHandler) handleCreateProjectLogic(c echo.Context, req CreateProjectRequest) (model.Project, error) {
	userID, _ := c.Get("user_id").(string)
	status := req.Status
	if status == "" {
		status = "wip"
	}
	project := &model.Project{
		Name:        req.Name,
		Description: req.Description,
		URL:         req.URL,
		Status:      status,
		Stack:       req.Stack,
		IsPublic:    req.IsPublic,
		CreatedBy:   userID,
		Base: model.Base{
			BaseWithCreatedAt: model.BaseWithCreatedAt{CreatedAt: time.Now().UTC()},
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
	userID, _ := c.Get("user_id").(string)
	userRole, _ := c.Get("user_role").(string)
	err := h.projectServices.DeleteProject(c.Request().Context(), req.ID, userID, userRole)
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

type UpdateProjectRequest struct {
	ID          int64    `param:"id"`
	Name        *string  `json:"name" validate:"omitempty,min=1,max=255"`
	Description *string  `json:"description" validate:"omitempty,max=1000"`
	URL         *string  `json:"url" validate:"omitempty"`
	Status      *string  `json:"status" validate:"omitempty,oneof=live wip archived"`
	Stack       []string `json:"stack"`
	IsPublic    *bool    `json:"isPublic"`
}

func (r UpdateProjectRequest) Validate() error {
	if r.ID <= 0 {
		return errors.NewBadRequestError("Invalid request", false, []errors.FieldError{
			{Field: "id", Error: "must be a positive integer"},
		}, nil)
	}
	if r.Name != nil && len(*r.Name) > 255 {
		return errors.NewBadRequestError("Invalid request", false, []errors.FieldError{
			{Field: "name", Error: "name must not exceed 255 characters"},
		}, nil)
	}
	if r.Description != nil && len(*r.Description) > 1000 {
		return errors.NewBadRequestError("Invalid request", false, []errors.FieldError{
			{Field: "description", Error: "description must not exceed 1000 characters"},
		}, nil)
	}
	return nil
}

func (h *ProjectHandler) handleUpdateProjectLogic(c echo.Context, req UpdateProjectRequest) (model.Project, error) {
	userID, _ := c.Get("user_id").(string)
	userRole, _ := c.Get("user_role").(string)
	project := &model.Project{
		Name:        derefStr(req.Name),
		Description: req.Description,
		URL:         req.URL,
		Status:      derefStr(req.Status),
		Stack:       req.Stack,
		IsPublic:    derefBool(req.IsPublic),
	}

	updatedProject, err := h.projectServices.UpdateProject(c.Request().Context(), req.ID, project, userID, userRole)
	if err != nil {
		return model.Project{}, err
	}

	return *updatedProject, nil
}

func (h *ProjectHandler) UpdateProject() echo.HandlerFunc {
	return Handle(h.Handler, h.handleUpdateProjectLogic, 200, UpdateProjectRequest{ID: 0})
}

func derefStr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func derefBool(b *bool) bool {
	if b == nil {
		return false
	}
	return *b
}
