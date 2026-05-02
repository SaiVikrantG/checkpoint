package database

import (
	// 	"context"
	// 	"fmt"
	// 	"net"
	// 	"net/url"
	// 	"strconv"
	// 	"time"

	"fmt"

	"github.com/SaiVikrantG/checkpoint/internal/config"
	// 	pgxzero "github.com/jackc/pgx-zerolog"
	"github.com/jackc/pgx/v5"
	// 	"github.com/newrelic/go-agent/v3/integrations/nrpgx5"
	"github.com/SaiVikrantG/checkpoint/internal/logger"
)

func buildConnString(dc *config.DatabaseConfig) string {
	return fmt.Sprintf(
		"postgresql://%v:%v@%v:%d/%v?sslmode=%v&pool_max_conns=%d&pool_min_conns=%d&pool_max_conn_lifetime=%d&pool_max_conn_idle_time=%d",
		dc.User,
		dc.Password,
		dc.Host,
		dc.Port,
		dc.Name,
		dc.MaxOpenConns,
		dc.MaxIdleConns,
		dc.ConnMaxLifetime,
		dc.ConnMaxIdleTime,
	)
}

func getPgxConfig(connStr string, logger *logger.LoggerService) (*pgx.ConnConfig, error) {
	config, err := pgx.ParseConfig(connStr)
	if err != nil {
		return nil, logger.
	}

	return config, nil
}

func NewDatabaseConnection(cfg *config.Config, logger *logger.LoggerService) {
	dbConfig := cfg.Database

	connString := buildConnString(&dbConfig)

	pgxConf, err := getPgxConfig(connString, logger)


}
