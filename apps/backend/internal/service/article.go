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

func (s *ArticleService) GetAllArticles(ctx context.Context, page, limit int) (model.PaginatedResponse[model.Article], error) {
	articles, total, err := s.repository.GetAllArticles(ctx, page, limit)
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

func (s *ArticleService) GetArticleByID(ctx context.Context, id int64) (model.Article, error) {
	article, err := s.repository.GetArticleByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return model.Article{}, errors.NewNotFoundError("article not found", true)
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

func (s *ArticleService) UpdateArticle(ctx context.Context, id int64, article *model.Article) (*model.Article, error) {
	existing, err := s.repository.GetArticleByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, errors.NewNotFoundError("article not found", true)
		}
		return nil, err
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

	result, err := s.repository.UpdateArticle(ctx, id, article)
	if err != nil {
		return nil, sqlerr.HandleError(err)
	}
	return result, nil
}

func (s *ArticleService) DeleteArticle(ctx context.Context, id int64) error {
	_, err := s.repository.GetArticleByID(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			return errors.NewNotFoundError("article not found", true)
		}
		return err
	}
	return s.repository.DeleteArticle(ctx, id)
}
