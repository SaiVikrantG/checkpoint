package handlers

import (
	"time"

	"github.com/SaiVikrantG/checkpoint/internal/errors"
	"github.com/SaiVikrantG/checkpoint/internal/model"
	"github.com/SaiVikrantG/checkpoint/internal/server"
	"github.com/SaiVikrantG/checkpoint/internal/service"
	"github.com/labstack/echo/v4"
)

type DevlogHandler struct {
	Handler
	devlogServices *service.DevlogService
}

func NewDevlogHandler(server *server.Server, services *service.DevlogService) *DevlogHandler {
	return &DevlogHandler{
		Handler:        NewHandler(server),
		devlogServices: services,
	}
}

// GetAllDevlogs

type GetAllDevlogsRequest struct {
	Page  int `query:"page"`
	Limit int `query:"limit"`
}

func (r GetAllDevlogsRequest) Validate() error {
	if r.Limit > 100 {
		return errors.NewBadRequestError("Invalid request", false, []errors.FieldError{
			{Field: "limit", Error: "must not exceed 100"},
		}, nil)
	}
	return nil
}

func (h *DevlogHandler) handleGetAllDevlogsLogic(c echo.Context, req GetAllDevlogsRequest) (model.PaginatedResponse[model.Devlog], error) {
	page := req.Page
	if page <= 0 {
		page = 1
	}
	limit := req.Limit
	if limit <= 0 {
		limit = 20
	}
	return h.devlogServices.GetAllDevlogs(c.Request().Context(), page, limit)
}

func (h *DevlogHandler) GetAllDevlogs() echo.HandlerFunc {
	return Handle(h.Handler, h.handleGetAllDevlogsLogic, 200, GetAllDevlogsRequest{})
}

// GetDevlogsByProjectID

type GetDevlogsByProjectIDRequest struct {
	ProjectID int64 `param:"projectId"`
	Page      int   `query:"page"`
	Limit     int   `query:"limit"`
}

func (r GetDevlogsByProjectIDRequest) Validate() error {
	if r.ProjectID <= 0 {
		return errors.NewBadRequestError("Invalid request", false, []errors.FieldError{
			{Field: "projectId", Error: "must be a positive integer"},
		}, nil)
	}
	if r.Limit > 100 {
		return errors.NewBadRequestError("Invalid request", false, []errors.FieldError{
			{Field: "limit", Error: "must not exceed 100"},
		}, nil)
	}
	return nil
}

func (h *DevlogHandler) handleGetDevlogsByProjectIDLogic(c echo.Context, req GetDevlogsByProjectIDRequest) (model.PaginatedResponse[model.Devlog], error) {
	page := req.Page
	if page <= 0 {
		page = 1
	}
	limit := req.Limit
	if limit <= 0 {
		limit = 20
	}
	return h.devlogServices.GetDevlogsByProjectID(c.Request().Context(), req.ProjectID, page, limit)
}

func (h *DevlogHandler) GetDevlogsByProjectID() echo.HandlerFunc {
	return Handle(h.Handler, h.handleGetDevlogsByProjectIDLogic, 200, GetDevlogsByProjectIDRequest{})
}

// GetDevlogByID

type GetDevlogByIDRequest struct {
	ID int64 `param:"id"`
}

func (r GetDevlogByIDRequest) Validate() error {
	if r.ID <= 0 {
		return errors.NewBadRequestError("Invalid request", false, []errors.FieldError{
			{Field: "id", Error: "must be a positive integer"},
		}, nil)
	}
	return nil
}

func (h *DevlogHandler) handleGetDevlogByIDLogic(c echo.Context, req GetDevlogByIDRequest) (model.Devlog, error) {
	return h.devlogServices.GetDevlogByID(c.Request().Context(), req.ID)
}

func (h *DevlogHandler) GetDevlogByID() echo.HandlerFunc {
	return Handle(h.Handler, h.handleGetDevlogByIDLogic, 200, GetDevlogByIDRequest{})
}

// CreateDevlog

type CreateDevlogRequest struct {
	ProjectID int64  `json:"projectId" validate:"required"`
	Title     string `json:"title" validate:"required,min=1,max=255"`
	Content   string `json:"content" validate:"required"`
	IsPublic  bool   `json:"isPublic"`
	UserID    string `json:"userId" validate:"required"`
}

func (r CreateDevlogRequest) Validate() error {
	if r.ProjectID <= 0 {
		return errors.NewBadRequestError("Invalid request", false, []errors.FieldError{
			{Field: "projectId", Error: "projectId is required and must be a positive integer"},
		}, nil)
	}
	if r.Title == "" {
		return errors.NewBadRequestError("Invalid request", false, []errors.FieldError{
			{Field: "title", Error: "title is required"},
		}, nil)
	}
	if r.Content == "" {
		return errors.NewBadRequestError("Invalid request", false, []errors.FieldError{
			{Field: "content", Error: "content is required"},
		}, nil)
	}
	if r.UserID == "" {
		return errors.NewBadRequestError("Invalid request", false, []errors.FieldError{
			{Field: "userId", Error: "userId is required"},
		}, nil)
	}
	return nil
}

func (h *DevlogHandler) handleCreateDevlogLogic(c echo.Context, req CreateDevlogRequest) (model.Devlog, error) {
	devlog := &model.Devlog{
		ProjectID: req.ProjectID,
		Title:     req.Title,
		Content:   req.Content,
		IsPublic:  req.IsPublic,
		CreatedBy: req.UserID,
		Base: model.Base{
			BaseWithCreatedAt: model.BaseWithCreatedAt{CreatedAt: time.Now()},
		},
	}

	created, err := h.devlogServices.CreateDevlog(c.Request().Context(), devlog)
	if err != nil {
		return model.Devlog{}, err
	}
	return *created, nil
}

func (h *DevlogHandler) CreateDevlog() echo.HandlerFunc {
	return Handle(h.Handler, h.handleCreateDevlogLogic, 201, CreateDevlogRequest{})
}

// UpdateDevlog

type UpdateDevlogRequest struct {
	ID       int64   `param:"id"`
	Title    *string `json:"title" validate:"omitempty,min=1,max=255"`
	Content  *string `json:"content" validate:"omitempty"`
	IsPublic *bool   `json:"isPublic"`
}

func (r UpdateDevlogRequest) Validate() error {
	if r.ID <= 0 {
		return errors.NewBadRequestError("Invalid request", false, []errors.FieldError{
			{Field: "id", Error: "must be a positive integer"},
		}, nil)
	}
	return nil
}

func (h *DevlogHandler) handleUpdateDevlogLogic(c echo.Context, req UpdateDevlogRequest) (model.Devlog, error) {
	devlog := &model.Devlog{
		Title:    derefStr(req.Title),
		Content:  derefStr(req.Content),
		IsPublic: derefBool(req.IsPublic),
	}

	updated, err := h.devlogServices.UpdateDevlog(c.Request().Context(), req.ID, devlog)
	if err != nil {
		return model.Devlog{}, err
	}
	return *updated, nil
}

func (h *DevlogHandler) UpdateDevlog() echo.HandlerFunc {
	return Handle(h.Handler, h.handleUpdateDevlogLogic, 200, UpdateDevlogRequest{})
}

// DeleteDevlog

type DeleteDevlogRequest struct {
	ID int64 `param:"id"`
}

func (r DeleteDevlogRequest) Validate() error {
	if r.ID <= 0 {
		return errors.NewBadRequestError("Invalid request", false, []errors.FieldError{
			{Field: "id", Error: "must be a positive integer"},
		}, nil)
	}
	return nil
}

func (h *DevlogHandler) handleDeleteDevlogLogic(c echo.Context, req DeleteDevlogRequest) (map[string]string, error) {
	if err := h.devlogServices.DeleteDevlog(c.Request().Context(), req.ID); err != nil {
		return nil, err
	}
	return map[string]string{"message": "devlog deleted successfully"}, nil
}

func (h *DevlogHandler) DeleteDevlog() echo.HandlerFunc {
	return Handle(h.Handler, h.handleDeleteDevlogLogic, 200, DeleteDevlogRequest{})
}
