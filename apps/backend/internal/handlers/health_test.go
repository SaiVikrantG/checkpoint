package handlers_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/SaiVikrantG/checkpoint/internal/config"
	handler "github.com/SaiVikrantG/checkpoint/internal/handlers"
	"github.com/SaiVikrantG/checkpoint/internal/logger"
	"github.com/SaiVikrantG/checkpoint/internal/server"
	"github.com/labstack/echo/v4"
)

// TestCheckHealth is a deployment-verification smoke test: it boots the same
// Server used in production (real config + real DB pool) and confirms the
// /status handler reports healthy against a live database connection.
func TestCheckHealth(t *testing.T) {
	cfg, err := config.LoadConfig()
	if err != nil {
		t.Fatalf("failed to load config: %v", err)
	}

	loggerService := logger.NewLoggerService(cfg.Observability)
	defer loggerService.ShutDown()
	log, err := logger.NewLoggerWithService(cfg.Observability, loggerService)

	if err != nil {
		t.Fatalf("failed to initialize logger: %v", err)
	}

	srv, err := server.ServerInit(cfg, loggerService, &log)
	if err != nil {
		t.Fatalf("failed to initialize server: %v", err)
	}
	defer srv.Db.CloseDBConnection()

	h := handler.NewHealthHandler(srv)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/status", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if err := h.CheckHealth(c); err != nil {
		t.Fatalf("CheckHealth returned error: %v", err)
	}

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", rec.Code, rec.Body.String())
	}
}
