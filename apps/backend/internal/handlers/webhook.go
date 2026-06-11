package handlers

import (
	"encoding/json"
	"io"

	"github.com/SaiVikrantG/checkpoint/internal/errors"
	"github.com/SaiVikrantG/checkpoint/internal/server"
	"github.com/SaiVikrantG/checkpoint/internal/service"
	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
	svix "github.com/svix/svix-webhooks/go"
)

type WebhookHandler struct {
	Handler
	authService *service.AuthService
}

func NewWebhookHandler(s *server.Server, authService *service.AuthService) *WebhookHandler {
	return &WebhookHandler{
		Handler:     NewHandler(s),
		authService: authService,
	}
}

var webhookValidator = validator.New()

type webhookEvent struct {
	Type string          `json:"type" validate:"required"`
	Data json.RawMessage `json:"data" validate:"required"`
}

func (e webhookEvent) Validate() error {
	return webhookValidator.Struct(e)
}

type webhookUserData struct {
	ID string `json:"id" validate:"required"`
}

func (u webhookUserData) Validate() error {
	return webhookValidator.Struct(u)
}

func (h *WebhookHandler) HandleClerkWebhook() echo.HandlerFunc {
	return func(c echo.Context) error {
		body, err := io.ReadAll(c.Request().Body)
		if err != nil {
			h.server.Logger.Error().Err(err).Msg("failed to read webhook body")
			return errors.NewBadRequestError("invalid request body", false, nil, nil)
		}

		wh, err := svix.NewWebhook(h.server.Config.Auth.WebhookSecret)
		if err != nil {
			h.server.Logger.Error().Err(err).Msg("failed to create svix webhook verifier")
			return errors.NewInternalServerError()
		}

		err = wh.Verify(body, c.Request().Header)
		if err != nil {
			h.server.Logger.Error().Err(err).Msg("webhook signature verification failed")
			return errors.NewUnauthorizedError("invalid webhook signature", false)
		}

		var event webhookEvent
		if err := json.Unmarshal(body, &event); err != nil {
			h.server.Logger.Error().Err(err).Msg("failed to parse webhook event")
			return errors.NewBadRequestError("invalid event payload", false, nil, nil)
		}

		if err := event.Validate(); err != nil {
			h.server.Logger.Error().Err(err).Msg("webhook event validation failed")
			return errors.NewBadRequestError("missing required event fields", false, nil, nil)
		}

		if event.Type == "user.created" {
			var userData webhookUserData
			if err := json.Unmarshal(event.Data, &userData); err != nil {
				h.server.Logger.Error().Err(err).Str("event_type", event.Type).Msg("failed to parse user data")
				return errors.NewBadRequestError("invalid user data in event", false, nil, nil)
			}

			if err := userData.Validate(); err != nil {
				h.server.Logger.Error().Err(err).Str("event_type", event.Type).Msg("user data validation failed")
				return errors.NewBadRequestError("missing required user fields", false, nil, nil)
			}

			if err := h.authService.AssignDefaultRole(c.Request().Context(), userData.ID); err != nil {
				if err == service.ErrUserNotFound {
					h.server.Logger.Warn().Str("user_id", userData.ID).Msg("user not found, may have been deleted")
					return c.JSON(200, map[string]string{"status": "ok", "message": "user not found, skipped"})
				}
				h.server.Logger.Error().Err(err).Str("user_id", userData.ID).Msg("failed to assign default role")
				return errors.NewInternalServerError()
			}

			h.server.Logger.Info().Str("user_id", userData.ID).Msg("assigned default role to new user")
		}

		return c.JSON(200, map[string]string{"status": "ok"})
	}
}
