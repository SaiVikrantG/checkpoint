package middlewares

import (
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

const (
	RequestIDHeader = "X-Request-ID"
	RequestIDKey    = "request_id"
	StartTimeKey    = "start_time"
)

//This middelware generator(in this case RequestID()) is given to echo basically. At app startup, the middleware generator is called to get the actual middleware
/*
func requestIDMiddleware(next Handler) Handler {
    return func(request Request) Response {
        request.ID = generateID()
        return next(request)  // Continue chain
    }
}

func authMiddleware(next Handler) Handler {
    return func(request Request) Response {
        if !isAuthenticated(request) {
            return errorResponse()
        }
        return next(request)  // Continue chain
    }
}

handler := businessLogic
handler = authMiddleware(handler)
handler = requestIDMiddleware(handler)

response := handler(request)
*/
//Conceptually this is what happens under the hood, once the middleware has been generated and all routes are registered, the chain that is built above executes.

func RequestID() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			requestID := c.Request().Header.Get(RequestIDHeader)
			if requestID == "" {
				requestID = uuid.New().String()
			}
			start := time.Now()

			c.Set(RequestIDKey, requestID)
			c.Set(StartTimeKey, start)
			c.Response().Header().Set(RequestIDHeader, requestID)

			return next(c)
		}
	}
}

func GetRequestID(c echo.Context) string {
	if requestID, ok := c.Get(RequestIDKey).(string); ok {
		return requestID
	}

	return ""
}
