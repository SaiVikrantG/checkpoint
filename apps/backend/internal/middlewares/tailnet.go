package middlewares

import (
	"time"

	"github.com/SaiVikrantG/checkpoint/internal/errors"
	"github.com/SaiVikrantG/checkpoint/internal/server"
	"github.com/labstack/echo/v4"
)

// TailnetAuthMiddleWare authenticates requests on the /tailnet/* route group
// by reading a user id supplied via the X-Checkpoint-User-ID header. It does
// NOT verify a Clerk session.
//
// The trust boundary for this route group is the network path, not the token:
// Caddy refuses /tailnet/* on the public listener, and the backend's port is
// bound only to the VPS's tailnet interface. Anything that reaches this
// middleware therefore came over tailnet. Inside that boundary we trust the
// header verbatim — the same model as a personal CLI calling its own backend
// over a private link.
const tailnetUserIDHeader = "X-Checkpoint-User-ID"

type TailnetAuthMiddleWare struct {
	server *server.Server
}

func NewTailnetAuthMiddleWare(s *server.Server) *TailnetAuthMiddleWare {
	return &TailnetAuthMiddleWare{server: s}
}

func (t *TailnetAuthMiddleWare) RequireTailnetUser(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		start := time.Now()
		logger := GetLogger(c)

		userID := c.Request().Header.Get(tailnetUserIDHeader)
		if userID == "" {
			logger.Warn().
				Str("function", "RequireTailnetUser").
				Str("request_id", GetRequestID(c)).
				Dur("duration", time.Since(start)).
				Msg("missing X-Checkpoint-User-ID header on tailnet route")
			return errors.NewUnauthorizedError("missing tailnet user id", false)
		}

		c.Set("user_id", userID)
		c.Set("user_role", "user")

		logger.Info().
			Str("function", "RequireTailnetUser").
			Str("user_id", userID).
			Str("request_id", GetRequestID(c)).
			Dur("duration", time.Since(start)).
			Msg("tailnet request authenticated")

		return next(c)
	}
}
