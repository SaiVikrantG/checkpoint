package service

import (
	"context"
	"math"

	"github.com/SaiVikrantG/checkpoint/internal/errors"
	"github.com/SaiVikrantG/checkpoint/internal/model"
	"github.com/SaiVikrantG/checkpoint/internal/repositories"
	"github.com/SaiVikrantG/checkpoint/internal/server"
	"github.com/SaiVikrantG/checkpoint/internal/sqlerr"
	"github.com/jackc/pgx/v5"
)

type ArticleService struct {
	server     *server.Server
	repository *repositories.ArticleRepository
}

func NewArticleService(server *server.Server, articleRepo *repositories.ArticleRepository) *ArticleService {
	return &ArticleService{
		server:     server,
		repository: articleRepo,
	}
}

func (s *ArticleService) GetAllArticles(ctx context.Context, page, limit int, createdBy, requestingUserID string) (model.PaginatedResponse[model.Article], error) {
	articles, total, err := s.repository.GetAllArticles(ctx, page, limit, createdBy, requestingUserID)
	if err != nil {
		return model.PaginatedResponse[model.Article]{}, err
	}

	totalPages := int(math.Ceil(float64(total) / float64(limit)))

	return model.PaginatedResponse[model.Article]{
		Data:       articles,
		Page:       page,
		Limit:      limit,
		Total:      int(total),
		TotalPages: totalPages,
	}, nil
}

func (s *ArticleService) GetArticleByID(ctx context.Context, id int64, requestingUserID string) (model.Article, error) {
	article, err := s.repository.GetArticleByID(ctx, id, requestingUserID)
	if err != nil {
		if err == pgx.ErrNoRows {
			notFoundErr := errors.NewNotFoundError("article not found", true)
			notFoundErr.Code = sqlerr.NotFoundCode("articles")
			return model.Article{}, notFoundErr
		}
		return model.Article{}, err
	}
	return article, nil
}

func (s *ArticleService) GetArticleBySlug(ctx context.Context, slug, requestingUserID string) (model.Article, error) {
	article, err := s.repository.GetArticleBySlug(ctx, slug, requestingUserID)
	if err != nil {
		if err == pgx.ErrNoRows {
			notFoundErr := errors.NewNotFoundError("article not found", true)
			notFoundErr.Code = sqlerr.NotFoundCode("articles")
			return model.Article{}, notFoundErr
		}
		return model.Article{}, err
	}
	return article, nil
}

func (s *ArticleService) CreateArticle(ctx context.Context, article *model.Article) (*model.Article, error) {
	result, err := s.repository.CreateArticle(ctx, article)
	if err != nil {
		return nil, sqlerr.HandleError(err)
	}
	return result, nil
}

func (s *ArticleService) UpdateArticle(ctx context.Context, id int64, article *model.Article, userID, userRole string) (*model.Article, error) {
	existing, err := s.repository.GetArticleByID(ctx, id, userID)
	if err != nil {
		if err == pgx.ErrNoRows {
			notFoundErr := errors.NewNotFoundError("article not found", true)
			notFoundErr.Code = sqlerr.NotFoundCode("articles")
			return nil, notFoundErr
		}
		return nil, err
	}
	if !canModify(existing.CreatedBy, userID, userRole) {
		forbiddenErr := errors.NewForbiddenError("you do not have permission to update this article", true)
		forbiddenErr.Code = sqlerr.ForbiddenCode("articles")
		return nil, forbiddenErr
	}

	if article.Title == "" {
		article.Title = existing.Title
	}
	if article.Content == "" {
		article.Content = existing.Content
	}
	if article.Slug == nil {
		article.Slug = existing.Slug
	}
	if article.Tags == nil {
		article.Tags = existing.Tags
	}
	if article.Status == "" {
		article.Status = existing.Status
	}

	result, err := s.repository.UpdateArticle(ctx, id, article)
	if err != nil {
		return nil, sqlerr.HandleError(err)
	}
	return result, nil
}

func (s *ArticleService) DeleteArticle(ctx context.Context, id int64, userID, userRole string) error {
	existing, err := s.repository.GetArticleByID(ctx, id, userID)
	if err != nil {
		if err == pgx.ErrNoRows {
			notFoundErr := errors.NewNotFoundError("article not found", true)
			notFoundErr.Code = sqlerr.NotFoundCode("articles")
			return notFoundErr
		}
		return err
	}
	if !canModify(existing.CreatedBy, userID, userRole) {
		forbiddenErr := errors.NewForbiddenError("you do not have permission to delete this article", true)
		forbiddenErr.Code = sqlerr.ForbiddenCode("articles")
		return forbiddenErr
	}
	return s.repository.DeleteArticle(ctx, id)
}
