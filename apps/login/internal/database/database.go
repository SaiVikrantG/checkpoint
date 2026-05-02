package database

import (
	// 	"context"
	// 	"fmt"
	// 	"net"
	"context"
	"net/url"

	// 	"strconv"
	"time"

	"fmt"
	"net"
	"strconv"

	"github.com/SaiVikrantG/checkpoint/internal/config"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/tracelog"
	"github.com/rs/zerolog"

	pgxzero "github.com/jackc/pgx-zerolog"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/SaiVikrantG/checkpoint/internal/logger"
	"github.com/newrelic/go-agent/v3/integrations/nrpgx5"
)

const DatabasePingTimeout = 10

type Database struct {
	Pool   *pgxpool.Pool
	logger *zerolog.Logger
}

// multiTracer allows chaining multiple tracers
type multiTracer struct {
	tracers []any
}

// TraceQueryStart implements pgx tracer interface
func (mt *multiTracer) TraceQueryStart(ctx context.Context, conn *pgx.Conn, data pgx.TraceQueryStartData) context.Context {
	for _, tracer := range mt.tracers {
		if t, ok := tracer.(interface {
			TraceQueryStart(context.Context, *pgx.Conn, pgx.TraceQueryStartData) context.Context
		}); ok {
			ctx = t.TraceQueryStart(ctx, conn, data)
		}
	}
	return ctx
}

// TraceQueryEnd implements pgx tracer interface
func (mt *multiTracer) TraceQueryEnd(ctx context.Context, conn *pgx.Conn, data pgx.TraceQueryEndData) {
	for _, tracer := range mt.tracers {
		if t, ok := tracer.(interface {
			TraceQueryEnd(context.Context, *pgx.Conn, pgx.TraceQueryEndData)
		}); ok {
			t.TraceQueryEnd(ctx, conn, data)
		}
	}
}

func buildConnString(dc *config.DatabaseConfig) string {
	hostPort := net.JoinHostPort(dc.Host, strconv.Itoa(dc.Port))
	encodedPassword := url.QueryEscape(dc.Password)
	dsn := fmt.Sprintf(
		"postgres://%s:%s@%s/%s?sslmode=%s",
		hostPort,
		dc.Name,
		encodedPassword,
		dc.Name,
		dc.SSLMode,
	)

	return dsn
}

func NewDatabaseConnection(cfg *config.Config, logger *zerolog.Logger, loggerService *logger.LoggerService) (*Database, error) {
	dbConfig := cfg.Database

	connString := buildConnString(&dbConfig)

	// can use pgx parse config, but pgx parseConfig is very basic, doesnt use a connection pool and has to create a new connection everytime. pgxpool is built on top of pgx and has connection pooling, hence using pgxpool. pgxpool is built on top of pgx
	pgxConf, err := pgxpool.ParseConfig(connString)
	if err != nil {
		return nil, fmt.Errorf("cant parse pgx pool config: %w", err)
	}

	if loggerService != nil && loggerService.GetApplication() != nil {
		pgxConf.ConnConfig.Tracer = nrpgx5.NewTracer()
	}

	if cfg.Primary.Env == "local" {
		globalLevel := logger.GetLevel()
		//CHECK: Initialized NewPgxLogger as a struct method with LoggerService, instead of calling NewPgxLogger as a method from logger config, so let's see if that creates any problem.
		pgxLogger := loggerService.NewPgxLogger(globalLevel)
		if pgxConf.ConnConfig.Tracer != nil {
			localTracer := &tracelog.TraceLog{
				Logger:   pgxzero.NewLogger(pgxLogger),
				LogLevel: tracelog.LogLevel(loggerService.GetPgxTraceLogLevel(globalLevel)),
			}

			pgxConf.ConnConfig.Tracer = &multiTracer{
				tracers: []any{pgxConf.ConnConfig.Tracer, localTracer},
			}
		} else {
			pgxConf.ConnConfig.Tracer = &tracelog.TraceLog{
				Logger: pgxzero.NewLogger(pgxLogger),
				// CHECK: check here when we are calling get pgx tracelevel as a struct method instead of a normal method
				LogLevel: tracelog.LogLevel(loggerService.GetPgxTraceLogLevel(globalLevel)),
			}
		}
	}

	pool, err := pgxpool.NewWithConfig(context.Background(), pgxConf)
	if err != nil {
		return nil, fmt.Errorf("failed to create pgx pool: %w", err)
	}

	database := &Database{
		Pool:   pool,
		logger: logger,
	}

	ctx, cancel := context.WithTimeout(context.Background(), DatabasePingTimeout*time.Second)
	defer cancel()
	if err = pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	logger.Info().Msg("connected to the database")

	return database, nil
}

func (db *Database) CloseDBConnection() error {
	db.logger.Info().Msg("closing database connection pool")
	db.Pool.Close()
	db.logger.Info().Msg("database connections pool closed")

	return nil
}
