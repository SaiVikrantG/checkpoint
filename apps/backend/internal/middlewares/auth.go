package middlewares

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/SaiVikrantG/checkpoint/internal/errors"
	"github.com/SaiVikrantG/checkpoint/internal/server"
	"github.com/clerk/clerk-sdk-go/v2"
	clerkhttp "github.com/clerk/clerk-sdk-go/v2/http"
	"github.com/clerk/clerk-sdk-go/v2/jwt"
	"github.com/rs/zerolog"

	// zerolog "github.com/jackc/pgx-zerolog"

	"github.com/labstack/echo/v4"
)

type AuthMiddleWare struct {
	server *server.Server
}

func NewAuthMiddleWare(s *server.Server) *AuthMiddleWare {
	return &AuthMiddleWare{
		server: s,
	}
}

// TODO: Need to implement authorization and authentixation on my own here
func (auth *AuthMiddleWare) RequireAuth(next echo.HandlerFunc) echo.HandlerFunc {
	// Handle authentication failure
	failureHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		logger := auth.server.Logger

		if l, ok := r.Context().Value(LoggerKey).(*zerolog.Logger); ok {
			logger = l
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)

		response := map[string]string{
			"code":     "UNAUTHORIZED",
			"message":  "Unauthorized",
			"override": "false",
			"status":   "401",
		}

		if err := json.NewEncoder(w).Encode(response); err != nil {
			logger.Error().
				Err(err).
				Str("function", "RequireAuth").
				Dur("duration", time.Since(start)).
				Msg("failed to write JSON response")
		} else {
			logger.Error().
				Str("function", "RequireAuth").
				Dur("duration", time.Since(start)).
				Msg("could not get session claims from context")
		}
	})

	// Configure Clerk authentication with failure handler
	clerkMiddleware := clerkhttp.WithHeaderAuthorization(
		clerkhttp.AuthorizationFailureHandler(failureHandler),
	)

	// Wrap with Echo and return the actual middleware
	wrapped := echo.WrapMiddleware(clerkMiddleware)(func(c echo.Context) error {
		start := time.Now()
		logger := GetLogger(c)

		// Extract session claims from context
		claims, ok := clerk.SessionClaimsFromContext(c.Request().Context())
		if !ok {
			logger.Error().
				Str("function", "RequireAuth").
				Str("request_id", GetRequestID(c)).
				Dur("duration", time.Since(start)).
				Msg("could not get session claims from context")

			return errors.NewUnauthorizedError("Unauthorized", false)
		}

		// Store user information in context
		c.Set("user_id", claims.Subject)
		c.Set("user_role", claims.ActiveOrganizationRole)
		c.Set("permissions", claims.ActiveOrganizationPermissions)

		// Log successful authentication
		logger.Info().
			Str("function", "RequireAuth").
			Str("user_id", claims.Subject).
			Str("request_id", GetRequestID(c)).
			Dur("duration", time.Since(start)).
			Msg("user authenticated successfully")

		return next(c)
	})

	return func(c echo.Context) error {
		// Propagate the request-scoped logger into the stdlib context so the
		// Clerk failure handler (plain net/http, no echo.Context) can reach it.
		logger := GetLogger(c)
		c.SetRequest(c.Request().WithContext(
			context.WithValue(c.Request().Context(), LoggerKey, logger),
		))
		return wrapped(c)
	}
}

// OptionalAuth verifies a Clerk session JWT if the Authorization header is
// present, but never rejects the request. Anonymous requests proceed with
// no "user_id" set in the context. This is what lets public GET routes
// know the caller's identity (for visibility filtering) without requiring
// a session.
func (auth *AuthMiddleWare) OptionalAuth(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		header := c.Request().Header.Get("Authorization")
		token := strings.TrimPrefix(header, "Bearer ")
		if token == "" || token == header {
			return next(c)
		}

		claims, err := jwt.Verify(c.Request().Context(), &jwt.VerifyParams{Token: token})
		if err != nil {
			auth.server.Logger.Debug().
				Err(err).
				Str("function", "OptionalAuth").
				Str("request_id", GetRequestID(c)).
				Msg("optional auth token verification failed, proceeding as anonymous")
			return next(c)
		}

		c.Set("user_id", claims.Subject)
		c.Set("user_role", claims.ActiveOrganizationRole)
		c.Set("permissions", claims.ActiveOrganizationPermissions)

		return next(c)
	}
}
