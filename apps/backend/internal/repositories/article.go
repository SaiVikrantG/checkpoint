package repositories

import (
	"context"

	db "github.com/SaiVikrantG/checkpoint/internal/database/db"
	"github.com/SaiVikrantG/checkpoint/internal/model"
	"github.com/jackc/pgx/v5/pgtype"
)

type ArticleRepository struct {
	queries *db.Queries
}

func NewArticleRepository(q *db.Queries) *ArticleRepository {
	return &ArticleRepository{queries: q}
}

func (r *ArticleRepository) GetAllArticles(ctx context.Context, page, limit int, createdBy, requestingUserID string) ([]model.Article, int64, error) {
	createdByParam := pgtype.Text{}
	if createdBy != "" {
		createdByParam = pgtype.Text{String: createdBy, Valid: true}
	}
	requestingUserIDParam := pgtype.Text{}
	if requestingUserID != "" {
		requestingUserIDParam = pgtype.Text{String: requestingUserID, Valid: true}
	}

	rows, err := r.queries.GetAllArticles(ctx, db.GetAllArticlesParams{
		Limit:            int32(limit),              //nolint:gosec // bounded by handler validation
		Offset:           int32((page - 1) * limit), //nolint:gosec // bounded by handler validation
		CreatedBy:        createdByParam,
		RequestingUserID: requestingUserIDParam,
	})
	if err != nil {
		return nil, 0, err
	}

	total, err := r.queries.GetArticlesCount(ctx, db.GetArticlesCountParams{
		CreatedBy:        createdByParam,
		RequestingUserID: requestingUserIDParam,
	})
	if err != nil {
		return nil, 0, err
	}

	articles := make([]model.Article, len(rows))
	for i, row := range rows {
		articles[i] = toModelArticleFromListRow(row)
	}

	return articles, total, nil
}

func (r *ArticleRepository) GetArticleByID(ctx context.Context, id int64, requestingUserID string) (model.Article, error) {
	requestingUserIDParam := pgtype.Text{}
	if requestingUserID != "" {
		requestingUserIDParam = pgtype.Text{String: requestingUserID, Valid: true}
	}

	row, err := r.queries.GetArticleByID(ctx, db.GetArticleByIDParams{
		ID:               id,
		RequestingUserID: requestingUserIDParam,
	})
	if err != nil {
		return model.Article{}, err
	}
	return toModelArticleFromRow(row), nil
}

func (r *ArticleRepository) GetArticleBySlug(ctx context.Context, slug, requestingUserID string) (model.Article, error) {
	requestingUserIDParam := pgtype.Text{}
	if requestingUserID != "" {
		requestingUserIDParam = pgtype.Text{String: requestingUserID, Valid: true}
	}

	row, err := r.queries.GetArticleBySlug(ctx, db.GetArticleBySlugParams{
		Slug:             pgtype.Text{String: slug, Valid: true},
		RequestingUserID: requestingUserIDParam,
	})
	if err != nil {
		return model.Article{}, err
	}
	return toModelArticleFromSlugRow(row), nil
}

func (r *ArticleRepository) CreateArticle(ctx context.Context, article *model.Article) (*model.Article, error) {
	var projectID pgtype.Int8
	if article.ProjectID != nil {
		projectID = pgtype.Int8{Int64: *article.ProjectID, Valid: true}
	}

	row, err := r.queries.CreateArticle(ctx, db.CreateArticleParams{
		ProjectID: projectID,
		Title:     article.Title,
		Content:   article.Content,
		Slug:      pgtype.Text{String: derefStr(article.Slug), Valid: article.Slug != nil},
		Tags:      article.Tags,
		Status:    article.Status,
		IsPublic:  pgtype.Bool{Bool: article.IsPublic, Valid: true},
		CreatedBy: article.CreatedBy,
		CreatedAt: pgtype.Timestamp{Time: article.CreatedAt, Valid: true},
	})
	if err != nil {
		return nil, err
	}
	result := toModelArticleFromDB(row)
	return &result, nil
}

func (r *ArticleRepository) UpdateArticle(ctx context.Context, id int64, article *model.Article) (*model.Article, error) {
	var projectID pgtype.Int8
	if article.ProjectID != nil {
		projectID = pgtype.Int8{Int64: *article.ProjectID, Valid: true}
	}

	row, err := r.queries.UpdateArticle(ctx, db.UpdateArticleParams{
		ID:        id,
		Title:     article.Title,
		Content:   article.Content,
		Slug:      pgtype.Text{String: derefStr(article.Slug), Valid: article.Slug != nil},
		Tags:      article.Tags,
		Status:    article.Status,
		IsPublic:  pgtype.Bool{Bool: article.IsPublic, Valid: true},
		ProjectID: projectID,
	})
	if err != nil {
		return nil, err
	}
	result := toModelArticleFromDB(row)
	return &result, nil
}

func (r *ArticleRepository) DeleteArticle(ctx context.Context, id int64) error {
	return r.queries.DeleteArticle(ctx, id)
}

func (r *ArticleRepository) IncrementViews(ctx context.Context, id int64) error {
	return r.queries.IncrementArticleViews(ctx, id)
}

func toModelArticleFromRow(a db.GetArticleByIDRow) model.Article {
	var projectID *int64
	if a.ProjectID.Valid {
		projectID = &a.ProjectID.Int64
	}

	return model.Article{
		Base: model.Base{
			BaseWithId:        model.BaseWithId{ID: a.ID},
			BaseWithCreatedAt: model.BaseWithCreatedAt{CreatedAt: timeFromPg(a.CreatedAt)},
			BaseWithUpdatedAt: model.BaseWithUpdatedAt{UpdatedAt: timeFromPg(a.UpdatedAt)},
		},
		ProjectID: projectID,
		Title:     a.Title,
		Content:   a.Content,
		Slug:      textToPtr(a.Slug),
		Tags:      a.Tags,
		Views:     a.Views,
		Status:    a.Status,
		IsPublic:  a.IsPublic.Bool,
		CreatedBy: a.CreatedBy,
		UpdatedBy: textToPtr(a.UpdatedBy),
	}
}

func toModelArticleFromListRow(a db.GetAllArticlesRow) model.Article {
	var projectID *int64
	if a.ProjectID.Valid {
		projectID = &a.ProjectID.Int64
	}

	return model.Article{
		Base: model.Base{
			BaseWithId:        model.BaseWithId{ID: a.ID},
			BaseWithCreatedAt: model.BaseWithCreatedAt{CreatedAt: timeFromPg(a.CreatedAt)},
			BaseWithUpdatedAt: model.BaseWithUpdatedAt{UpdatedAt: timeFromPg(a.UpdatedAt)},
		},
		ProjectID:   projectID,
		ProjectName: textToPtr(a.ProjectName),
		Title:       a.Title,
		Content:     a.Content,
		Slug:        textToPtr(a.Slug),
		Tags:        a.Tags,
		Views:       a.Views,
		Status:      a.Status,
		IsPublic:    a.IsPublic.Bool,
		CreatedBy:   a.CreatedBy,
		UpdatedBy:   textToPtr(a.UpdatedBy),
	}
}

func toModelArticleFromSlugRow(a db.GetArticleBySlugRow) model.Article {
	var projectID *int64
	if a.ProjectID.Valid {
		projectID = &a.ProjectID.Int64
	}

	return model.Article{
		Base: model.Base{
			BaseWithId:        model.BaseWithId{ID: a.ID},
			BaseWithCreatedAt: model.BaseWithCreatedAt{CreatedAt: timeFromPg(a.CreatedAt)},
			BaseWithUpdatedAt: model.BaseWithUpdatedAt{UpdatedAt: timeFromPg(a.UpdatedAt)},
		},
		ProjectID:   projectID,
		ProjectName: textToPtr(a.ProjectName),
		Title:       a.Title,
		Content:     a.Content,
		Slug:        textToPtr(a.Slug),
		Tags:        a.Tags,
		Views:       a.Views,
		Status:      a.Status,
		IsPublic:    a.IsPublic.Bool,
		CreatedBy:   a.CreatedBy,
		UpdatedBy:   textToPtr(a.UpdatedBy),
	}
}

func toModelArticleFromDB(a db.Article) model.Article {
	var projectID *int64
	if a.ProjectID.Valid {
		projectID = &a.ProjectID.Int64
	}

	return model.Article{
		Base: model.Base{
			BaseWithId:        model.BaseWithId{ID: a.ID},
			BaseWithCreatedAt: model.BaseWithCreatedAt{CreatedAt: timeFromPg(a.CreatedAt)},
			BaseWithUpdatedAt: model.BaseWithUpdatedAt{UpdatedAt: timeFromPg(a.UpdatedAt)},
		},
		ProjectID: projectID,
		Title:     a.Title,
		Content:   a.Content,
		Slug:      textToPtr(a.Slug),
		Tags:      a.Tags,
		Views:     a.Views,
		Status:    a.Status,
		IsPublic:  a.IsPublic.Bool,
		CreatedBy: a.CreatedBy,
		UpdatedBy: textToPtr(a.UpdatedBy),
	}
}
