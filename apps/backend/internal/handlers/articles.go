package handlers

import (
	"time"

	"github.com/SaiVikrantG/checkpoint/internal/errors"
	"github.com/SaiVikrantG/checkpoint/internal/model"
	"github.com/SaiVikrantG/checkpoint/internal/server"
	"github.com/SaiVikrantG/checkpoint/internal/service"
	"github.com/labstack/echo/v4"
)

type ArticleHandler struct {
	Handler
	articleServices *service.ArticleService
}

func NewArticleHandler(server *server.Server, services *service.ArticleService) *ArticleHandler {
	return &ArticleHandler{
		Handler:         NewHandler(server),
		articleServices: services,
	}
}

// GetAllArticles

type GetAllArticlesRequest struct {
	Page      int    `query:"page"`
	Limit     int    `query:"limit"`
	CreatedBy string `query:"createdBy"`
}

func (r GetAllArticlesRequest) Validate() error {
	if r.Limit > 100 {
		return errors.NewBadRequestError("Invalid request", false, []errors.FieldError{
			{Field: "limit", Error: "must not exceed 100"},
		}, nil)
	}
	return nil
}

func (h *ArticleHandler) handleGetAllArticlesLogic(c echo.Context, req GetAllArticlesRequest) (model.PaginatedResponse[model.Article], error) {
	page := req.Page
	if page <= 0 {
		page = 1
	}
	limit := req.Limit
	if limit <= 0 {
		limit = 20
	}
	return h.articleServices.GetAllArticles(c.Request().Context(), page, limit, req.CreatedBy)
}

func (h *ArticleHandler) GetAllArticles() echo.HandlerFunc {
	return Handle(h.Handler, h.handleGetAllArticlesLogic, 200, GetAllArticlesRequest{})
}

// GetArticleByID

type GetArticleByIDRequest struct {
	ID int64 `param:"id"`
}

func (r GetArticleByIDRequest) Validate() error {
	if r.ID <= 0 {
		return errors.NewBadRequestError("Invalid request", false, []errors.FieldError{
			{Field: "id", Error: "must be a positive integer"},
		}, nil)
	}
	return nil
}

func (h *ArticleHandler) handleGetArticleByIDLogic(c echo.Context, req GetArticleByIDRequest) (model.Article, error) {
	return h.articleServices.GetArticleByID(c.Request().Context(), req.ID)
}

func (h *ArticleHandler) GetArticleByID() echo.HandlerFunc {
	return Handle(h.Handler, h.handleGetArticleByIDLogic, 200, GetArticleByIDRequest{})
}

// CreateArticle

type CreateArticleRequest struct {
	ProjectID *int64   `json:"projectId"`
	Title     string   `json:"title" validate:"required,min=1,max=255"`
	Content   string   `json:"content" validate:"required"`
	Slug      *string  `json:"slug" validate:"omitempty,max=255"`
	Tags      []string `json:"tags"`
	Status    string   `json:"status" validate:"omitempty,oneof=draft published archived"`
	IsPublic  bool     `json:"isPublic"`
}

func (r CreateArticleRequest) Validate() error {
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
	return nil
}

func (h *ArticleHandler) handleCreateArticleLogic(c echo.Context, req CreateArticleRequest) (model.Article, error) {
	userID, _ := c.Get("user_id").(string)
	status := req.Status
	if status == "" {
		status = "draft"
	}
	article := &model.Article{
		ProjectID: req.ProjectID,
		Title:     req.Title,
		Content:   req.Content,
		Slug:      req.Slug,
		Tags:      req.Tags,
		Status:    status,
		IsPublic:  req.IsPublic,
		CreatedBy: userID,
		Base: model.Base{
			BaseWithCreatedAt: model.BaseWithCreatedAt{CreatedAt: time.Now()},
		},
	}

	created, err := h.articleServices.CreateArticle(c.Request().Context(), article)
	if err != nil {
		return model.Article{}, err
	}
	return *created, nil
}

func (h *ArticleHandler) CreateArticle() echo.HandlerFunc {
	return Handle(h.Handler, h.handleCreateArticleLogic, 201, CreateArticleRequest{})
}

// UpdateArticle

type UpdateArticleRequest struct {
	ID        int64    `param:"id"`
	ProjectID *int64   `json:"projectId"`
	Title     *string  `json:"title" validate:"omitempty,min=1,max=255"`
	Content   *string  `json:"content" validate:"omitempty"`
	Slug      *string  `json:"slug" validate:"omitempty,max=255"`
	Tags      []string `json:"tags"`
	Status    *string  `json:"status" validate:"omitempty,oneof=draft published archived"`
	IsPublic  *bool    `json:"isPublic"`
}

func (r UpdateArticleRequest) Validate() error {
	if r.ID <= 0 {
		return errors.NewBadRequestError("Invalid request", false, []errors.FieldError{
			{Field: "id", Error: "must be a positive integer"},
		}, nil)
	}
	return nil
}

func (h *ArticleHandler) handleUpdateArticleLogic(c echo.Context, req UpdateArticleRequest) (model.Article, error) {
	userID, _ := c.Get("user_id").(string)
	userRole, _ := c.Get("user_role").(string)
	article := &model.Article{
		ProjectID: req.ProjectID,
		Title:     derefStr(req.Title),
		Content:   derefStr(req.Content),
		Slug:      req.Slug,
		Tags:      req.Tags,
		Status:    derefStr(req.Status),
		IsPublic:  derefBool(req.IsPublic),
	}

	updated, err := h.articleServices.UpdateArticle(c.Request().Context(), req.ID, article, userID, userRole)
	if err != nil {
		return model.Article{}, err
	}
	return *updated, nil
}

func (h *ArticleHandler) UpdateArticle() echo.HandlerFunc {
	return Handle(h.Handler, h.handleUpdateArticleLogic, 200, UpdateArticleRequest{})
}

// DeleteArticle

type DeleteArticleRequest struct {
	ID int64 `param:"id"`
}

func (r DeleteArticleRequest) Validate() error {
	if r.ID <= 0 {
		return errors.NewBadRequestError("Invalid request", false, []errors.FieldError{
			{Field: "id", Error: "must be a positive integer"},
		}, nil)
	}
	return nil
}

func (h *ArticleHandler) handleDeleteArticleLogic(c echo.Context, req DeleteArticleRequest) (map[string]string, error) {
	userID, _ := c.Get("user_id").(string)
	userRole, _ := c.Get("user_role").(string)
	if err := h.articleServices.DeleteArticle(c.Request().Context(), req.ID, userID, userRole); err != nil {
		return nil, err
	}
	return map[string]string{"message": "article deleted successfully"}, nil
}

func (h *ArticleHandler) DeleteArticle() echo.HandlerFunc {
	return Handle(h.Handler, h.handleDeleteArticleLogic, 200, DeleteArticleRequest{})
}
