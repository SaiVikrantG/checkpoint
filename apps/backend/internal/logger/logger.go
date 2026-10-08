package logger

import (
	"fmt"
	"io"
	"os"
	"time"

	"github.com/SaiVikrantG/checkpoint/internal/build"
	"github.com/SaiVikrantG/checkpoint/internal/config"
	"github.com/newrelic/go-agent/v3/integrations/logcontext-v2/zerologWriter"
	"github.com/newrelic/go-agent/v3/newrelic"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/pkgerrors"
)

// LoggerService manages New Relic integration and logger creation
// TODO: Swap this out with grafana
type LoggerService struct {
	nrApp *newrelic.Application
}

func NewLoggerService(cfg *config.ObservabilityConfig) *LoggerService {
	service := &LoggerService{}

	if cfg.NewRelic.LicenseKey == "" {
		fmt.Println("New relic license key not provided, skipping initialization")
		return service
	}

	var configOptions []newrelic.ConfigOption
	configOptions = append(configOptions,
		newrelic.ConfigAppName(cfg.ServiceName),
		newrelic.ConfigLicense(cfg.NewRelic.LicenseKey),
		newrelic.ConfigAppLogForwardingEnabled(cfg.NewRelic.AppLogForwardingEnabled),
		newrelic.ConfigDistributedTracerEnabled(cfg.NewRelic.DistributedTracingEnabled),
	)

	if cfg.NewRelic.DebugLogging {
		configOptions = append(configOptions, newrelic.ConfigDebugLogger(os.Stdout))
	}

	app, err := newrelic.NewApplication(configOptions...)
	if err != nil {
		fmt.Printf("Failed to initialize New relic: %v\n", err)
		return service
	}

	service.nrApp = app
	fmt.Printf("New relic initialized for this app: %s\n", cfg.ServiceName)
	return service
}

func (ls *LoggerService) ShutDown() {
	if ls.nrApp != nil {
		ls.nrApp.Shutdown(10 * time.Second)
	}
}

func (ls *LoggerService) GetApplication() *newrelic.Application {
	return ls.nrApp
}

func NewLoggerWithService(cfg *config.ObservabilityConfig, loggerService *LoggerService) (zerolog.Logger, error) {
	var logLevel zerolog.Level
	level := cfg.GetLogLevel()

	switch level {
	case "debug":
		logLevel = zerolog.DebugLevel
	case "info":
		logLevel = zerolog.InfoLevel
	case "error":
		logLevel = zerolog.ErrorLevel
	case "warn":
		logLevel = zerolog.WarnLevel
	default:
		logLevel = zerolog.InfoLevel
	}

	zerolog.TimeFieldFormat = "2006-01-02 15:04:05"
	zerolog.ErrorStackMarshaler = pkgerrors.MarshalStack

	var writer io.Writer

	var baseWriter io.Writer
	if cfg.IsProduction() && cfg.Logging.Format == "json" {
		baseWriter = os.Stdout

		if loggerService != nil && loggerService.nrApp != nil {
			nrWriter := zerologWriter.New(baseWriter, loggerService.nrApp)
			writer = nrWriter
		} else {
			writer = baseWriter
		}
	} else {
		consoleWriter := zerolog.ConsoleWriter{Out: os.Stdout, TimeFormat: "2026-01-02 15:04:45"}
		writer = consoleWriter
	}

	hostname, err := os.Hostname()
	if err != nil {
		return zerolog.Logger{}, fmt.Errorf("Failed to get hostname: %w", err)
	}

	logger := zerolog.New(writer).
		Level(logLevel).
		With().
		Timestamp().
		Str("service", cfg.ServiceName).
		Str("environment", cfg.Environment).
		Str("git_sha", build.GitSHA).
		Str("hostname", hostname).
		Logger()

	if !cfg.IsProduction() {
		logger = logger.With().Stack().Logger()
	}

	return logger, nil
}

func (loggerService *LoggerService) NewPgxLogger(level zerolog.Level) zerolog.Logger {
	writer := zerolog.ConsoleWriter{
		Out:        os.Stdout,
		TimeFormat: "2006-01-02 15:04:05",
		FormatFieldValue: func(i any) string {
			switch v := i.(type) {
			case string:
				if len(v) > 200 {
					return v[:200] + "..."
				}
				return v
			default:
				return fmt.Sprintf("%v", v)
			}
		},
	}

	return zerolog.New(writer).
		Level(level).
		With().
		Timestamp().
		Str("component", "database").
		Logger()
}

func (loggerService *LoggerService) GetPgxTraceLogLevel(globalLevel zerolog.Level) int {
	switch globalLevel {
	case zerolog.DebugLevel:
		return 6
	case zerolog.InfoLevel:
		return 4
	case zerolog.WarnLevel:
		return 3
	case zerolog.ErrorLevel:
		return 2
	default:
		return 0
	}
}

func WithTraceContext(logger zerolog.Logger, txn *newrelic.Transaction) zerolog.Logger {
	if txn == nil {
		return logger
	}

	// Get trace metadata from transaction
	metadata := txn.GetTraceMetadata()

	return logger.With().
		Str("trace.id", metadata.TraceID).
		Str("span.id", metadata.SpanID).
		Logger()
}
