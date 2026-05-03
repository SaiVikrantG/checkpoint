package server

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/SaiVikrantG/checkpoint/internal/config"
	"github.com/SaiVikrantG/checkpoint/internal/database"
	"github.com/SaiVikrantG/checkpoint/internal/logger"
	"github.com/rs/zerolog"
)

type Server struct {
	logger        *zerolog.Logger
	db            *database.Database
	config        *config.Config
	loggerService *logger.LoggerService
	httpServer    *http.Server
}

func ServerInit(cfg *config.Config, loggerService *logger.LoggerService, logger *zerolog.Logger) (*Server, error) {
	db, err := database.NewDatabaseConnection(cfg, logger, loggerService)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize db instance")
	}

	//redis cache system initialization(not doing that right now)

	//job service system initialization(not doing that right now)

	server := &Server{
		logger:        logger,
		db:            db,
		config:        cfg,
		loggerService: loggerService,
	}

	return server, nil
}

func (server *Server) ConfigureHTTPServer(handler http.Handler) {
	server.httpServer = &http.Server{
		Addr:         ":" + server.config.Server.Port,
		Handler:      handler,
		ReadTimeout:  time.Duration(server.httpServer.ReadTimeout) * time.Second,
		WriteTimeout: time.Duration(server.httpServer.WriteTimeout) * time.Second,
		IdleTimeout:  time.Duration(server.httpServer.IdleTimeout) * time.Second,
	}
}

func (s *Server) StartServer() error {
	if s.httpServer == nil {
		return fmt.Errorf("server instance is not initialized")
	}

	s.logger.Info().
		Str("port", s.config.Server.Port).
		Str("env", s.config.Primary.Env).
		Msg("Starting server")

	return s.httpServer.ListenAndServe()
}

func (server *Server) ShutDown(ctx context.Context) error {
	err := server.httpServer.Shutdown(ctx)
	if err != nil {
		return fmt.Errorf("failed to shut down server: %w", err)
	}

	err = server.db.CloseDBConnection()
	if err != nil {
		return fmt.Errorf("failed to close db connection: %w", err)
	}

	// check for job queues as well, not required right now

	return nil
}
