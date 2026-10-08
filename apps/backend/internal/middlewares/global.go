package middlewares

import (
	"net/http"
	"time"

	errs "github.com/SaiVikrantG/checkpoint/internal/errors"
	"github.com/SaiVikrantG/checkpoint/internal/server"
	"github.com/SaiVikrantG/checkpoint/internal/sqlerr"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/pkg/errors"
	"github.com/rs/zerolog"
)

//CHECK: How does this work?

type GlobalMiddlewares struct {
	server *server.Server
}

func NewGlobalMiddlewares(s *server.Server) *GlobalMiddlewares {
	return &GlobalMiddlewares{
		server: s,
	}
}

func (global *GlobalMiddlewares) CORS() echo.MiddlewareFunc {
	return middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: global.server.Config.Server.CORSAllowedOrigins,
	})
}

func (global *GlobalMiddlewares) RequestLogger() echo.MiddlewareFunc {
	return middleware.RequestLoggerWithConfig(middleware.RequestLoggerConfig{
		LogURI:     true,
		LogStatus:  true,
		LogError:   true,
		LogLatency: true,
		LogHost:    true,
		LogMethod:  true,
		LogURIPath: true,
		LogValuesFunc: func(c echo.Context, v middleware.RequestLoggerValues) error {
			statusCode := v.Status

			// note that the status code is not set yet as it gets picked up by the global err handler
			// see here: https://github.com/labstack/echo/issues/2310#issuecomment-1288196898
			if v.Error != nil {
				return nil
			}

			// Get enhanced logger from context
			logger := GetLogger(c)

			var e *zerolog.Event

			switch {
			case statusCode >= 500:
				e = logger.Error()
			case statusCode >= 400:
				e = logger.Warn()
			default:
				e = logger.Info()
			}

			// Add user context if available
			if userID := GetUserID(c); userID != "" {
				e = e.Str("user_id", userID)
			}

			e.
				Dur("latency", v.Latency).
				Int("status", statusCode).
				Str("uri", v.URI).
				Str("host", v.Host).
				Str("user_agent", c.Request().UserAgent()).
				Msg("API")

			return nil
		},
	})
}

func (global *GlobalMiddlewares) Recover() echo.MiddlewareFunc {
	return middleware.Recover()
}

func (global *GlobalMiddlewares) Secure() echo.MiddlewareFunc {
	return middleware.Secure()
}

func (global *GlobalMiddlewares) GlobalErrorHandler(err error, c echo.Context) {
	// First try to handle database errors and convert them to appropriate HTTP errors
	originalErr := err

	// Try to handle known database errors
	// Only do this for errors that haven't already been converted to HTTPError
	var httpErr *errs.HTTPError
	if !errors.As(err, &httpErr) {
		var echoErr *echo.HTTPError
		if errors.As(err, &echoErr) {
			if echoErr.Code == http.StatusNotFound {
				err = errs.NewNotFoundError("Route not found", false)
			}
		} else {
			// Here we call our sqlerr handler which will convert database errors
			// to appropriate application errors
			err = sqlerr.HandleError(err)
		}
	}

	// Now process the possibly converted error
	var echoErr *echo.HTTPError
	var status int
	var code string
	var message string
	var fieldErrors []errs.FieldError
	var action *errs.Action

	switch {
	case errors.As(err, &httpErr):
		status = httpErr.Status
		code = httpErr.Code
		message = httpErr.Message
		fieldErrors = httpErr.Errors
		action = httpErr.Actn

	case errors.As(err, &echoErr):
		status = echoErr.Code
		if msg, ok := echoErr.Message.(string); ok {
			message = msg
		} else {
			message = http.StatusText(echoErr.Code)
		}

	default:
		status = http.StatusInternalServerError
		message = http.StatusText(http.StatusInternalServerError)
	}

	var e *zerolog.Event
	// Log the original error to help with debugging
	// Use enhanced logger from context which already includes request_id, method, path, ip, user context, and trace context
	logger := *GetLogger(c)

	switch {
	case status >= 500:
		e = logger.Error().Stack()
	case status >= 400:
		e = logger.Warn()
	default:
		e = logger.Info()
	}

	var latency time.Duration
	if start, ok := c.Get(StartTimeKey).(time.Time); ok {
		latency = time.Since(start)
	} else {
		logger.Warn().Msg("start_time missing from context, latency will be reported as 0")
	}

	e.
		Err(originalErr).
		Int("status", status).
		Str("error_code", code).
		Dur("latency", latency).
		Str("uri", c.Request().RequestURI).
		Str("host", c.Request().Host).
		Str("user_agent", c.Request().UserAgent()).
		Msg(message)

	if !c.Response().Committed {
		_ = c.JSON(status, errs.HTTPError{
			Code:     code,
			Message:  message,
			Status:   status,
			Override: httpErr != nil && httpErr.Override,
			Errors:   fieldErrors,
			Actn:     action,
		})
	}
}
