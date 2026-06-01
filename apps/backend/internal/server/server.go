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
	Logger        *zerolog.Logger
	Db            *database.Database
	Config        *config.Config
	LoggerService *logger.LoggerService
	HttpServer    *http.Server
}

func ServerInit(cfg *config.Config, loggerService *logger.LoggerService, logger *zerolog.Logger) (*Server, error) {
	db, err := database.NewDatabaseConnection(cfg, logger, loggerService)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize db instance")
	}

	//redis cache system initialization(not doing that right now)

	//job service system initialization(not doing that right now)

	server := &Server{
		Logger:        logger,
		Db:            db,
		Config:        cfg,
		LoggerService: loggerService,
	}

	return server, nil
}

func (server *Server) ConfigureHTTPServer(handler http.Handler) {
	server.HttpServer = &http.Server{
		Addr:         ":" + server.Config.Server.Port,
		Handler:      handler,
		ReadTimeout:  time.Duration(server.Config.Server.ReadTimeout) * time.Second,
		WriteTimeout: time.Duration(server.Config.Server.WriteTimeout) * time.Second,
		IdleTimeout:  time.Duration(server.Config.Server.IdleTimeout) * time.Second,
	}
}

func (s *Server) StartServer() error {
	if s.HttpServer == nil {
		return fmt.Errorf("server instance is not initialized")
	}

	s.Logger.Info().
		Str("port", s.Config.Server.Port).
		Str("env", s.Config.Primary.Env).
		Msg("Starting server")

	return s.HttpServer.ListenAndServe()
}

func (server *Server) ShutDown(ctx context.Context) error {
	err := server.HttpServer.Shutdown(ctx)
	if err != nil {
		return fmt.Errorf("failed to shut down server: %w", err)
	}

	err = server.Db.CloseDBConnection()
	if err != nil {
		return fmt.Errorf("failed to close db connection: %w", err)
	}

	// check for job queues as well, not required right now

	return nil
}
