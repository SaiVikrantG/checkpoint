# Server Component Documentation

## Overview

The Server component serves as the central orchestrator for the application. It initializes and manages all major subsystems including the HTTP server, database connections, cache layer (Redis), background job processing, and monitoring/instrumentation. This component acts as the application's bootstrap and lifecycle manager, coordinating between different layers and ensuring all dependencies are properly initialized, connected, and gracefully shutdown.

---

## Basic Operations

### 1. **Dependency Injection & Initialization**

**Purpose:** Create and wire together all major application subsystems.

**What it does:**
- Receives configuration, logger, and monitoring service instances
- Initializes the database connection pool
- Initializes the Redis cache client
- Sets up the background job processing service
- Integrates monitoring hooks into cache operations
- Performs health checks on all subsystems
- Returns a fully initialized Server instance ready for HTTP requests

**When it's called:** Once at application startup, before the HTTP server starts.

---

### 2. **Database Initialization**

**Purpose:** Establish connection to the persistent data layer.

**What it does:**
- Creates a database connection pool using provided configuration
- Verifies connectivity with a health check
- Returns an error if database cannot be reached
- Makes the database available to all request handlers

**When it's called:** As part of server initialization, early in the startup sequence.

---

### 3. **Redis Cache Initialization**

**Purpose:** Establish connection to the distributed cache layer.

**What it does:**
- Creates a Redis client with configured address
- Integrates monitoring instrumentation (if APM service available)
- Performs a health check (ping) with a 5-second timeout
- Logs a warning if Redis is unavailable but continues startup (non-blocking)
- Makes the Redis client available for caching operations

**When it's called:** As part of server initialization, after database setup.

**Special Behavior:** Failure to connect to Redis does NOT fail server startup - the application continues without caching capabilities but logs the error.

---

### 4. **Job Service Initialization**

**Purpose:** Set up and start the background job/task processing system.

**What it does:**
- Creates a job service instance
- Registers job handlers based on configuration
- Starts the job processor/scheduler
- Makes the job service available for enqueueing background tasks

**When it's called:** As part of server initialization, after Redis setup.

---

### 5. **Monitoring Integration**

**Purpose:** Instrument cache operations for performance visibility.

**What it does:**
- Checks if APM service is available
- If available, adds monitoring hooks to the Redis client
- Ensures all Redis operations are captured in APM metrics
- Provides dashboards for cache hit/miss rates, latency, and errors

**When it's called:** During Redis client initialization, conditional on APM availability.

---

### 6. **HTTP Server Configuration**

**Purpose:** Configure the HTTP server with network settings and timeouts.

**What it does:**
- Sets the listening port from configuration
- Attaches the HTTP request handler/router
- Configures read timeout (max time to read incoming request)
- Configures write timeout (max time to write response)
- Configures idle timeout (max time connection can stay idle)
- Creates the HTTP server instance but does NOT start it yet

**When it's called:** After Server initialization, before calling Start().

**Important:** This is a separate step from initialization to allow for flexible request handler setup.

---

### 7. **HTTP Server Startup**

**Purpose:** Begin listening for and serving HTTP requests.

**What it does:**
- Verifies HTTP server is configured
- Logs startup information (port, environment)
- Starts listening on the configured port
- Blocks and processes incoming HTTP requests
- This is a blocking operation that continues until shutdown is initiated

**When it's called:** After HTTP server is configured, during application run phase.

**Note:** Returns only when server stops (due to shutdown or error).

---

### 8. **Graceful Shutdown**

**Purpose:** Safely shut down all subsystems in the correct order.

**What it does:**
- Stops accepting new HTTP requests
- Waits for in-flight HTTP requests to complete (with timeout)
- Closes database connection pool
- Stops the background job processor
- Logs shutdown messages
- Returns error if any shutdown step fails

**When it's called:** During application termination, when a shutdown signal is received.

**Shutdown Order:** HTTP → Database → Job Service (important for data consistency)

---

## Pseudocode

### Server Initialization Flow

```
Function InitializeServer(config, logger, monitoringService):
    Input:
        - config: application configuration object
        - logger: logging service instance
        - monitoringService: APM/monitoring service instance
    
    Output: Server instance with all subsystems initialized, or error
    
    Steps:
        1. Initialize Database Subsystem
            a. Call database.New() with config, logger, monitoring service
            b. If database initialization fails:
                - Return error (database is required)
            c. Store database instance in server
        
        2. Initialize Redis Cache Subsystem
            a. Create Redis client with config.Redis.Address
            b. Add monitoring hook if available:
                - Check if monitoring service exists and has active application
                - If yes, attach New Relic Redis hook
            c. Test Redis connectivity:
                - Create 5-second timeout context
                - Send Ping command to Redis
                - If Ping fails:
                    - Log error message (do NOT fail startup)
                    - Continue without Redis (graceful degradation)
            d. Store Redis client in server
        
        3. Initialize Job Service Subsystem
            a. Create job service instance with logger and config
            b. Register job handlers:
                - Call jobService.InitHandlers() with config and logger
                - This loads job definitions and handlers
            c. Start job processor:
                - Call jobService.Start()
                - This begins processing queued jobs
                - If job service fails to start:
                    - Return error (job service is required for background tasks)
            d. Store job service in server
        
        4. Assemble Server Instance
            a. Create Server struct with:
                - Configuration
                - Logger
                - Logger Service (monitoring)
                - Database instance
                - Redis client
                - Job service
            b. Note: HTTP server is NOT created yet
        
        5. Return Server Instance

End Function
```

### HTTP Server Configuration Flow

```
Function ConfigureHTTPServer(server, requestHandler):
    Input:
        - server: initialized Server instance
        - requestHandler: HTTP request multiplexer/router
    
    Steps:
        1. Extract HTTP settings from server configuration
            a. Get listening port
            b. Get read timeout
            c. Get write timeout
            d. Get idle timeout
        
        2. Create HTTP server configuration
            a. Set listening address (":port")
            b. Attach request handler
            c. Convert timeout values from config (usually in seconds) to Duration
        
        3. Create HTTP Server instance
            a. Instantiate http.Server with configuration
            b. Store in server.httpServer field
            c. Do NOT start listening yet

End Function
```

### HTTP Server Startup Flow

```
Function StartHTTPServer(server):
    Input: server instance with configured HTTP server
    
    Output: Blocks until server stops; returns error if startup fails
    
    Steps:
        1. Validate HTTP server is configured
            a. If httpServer is nil:
                - Return error "HTTP server not initialized"
        
        2. Log startup information
            a. Log port number
            b. Log environment (local/staging/production)
            c. Log info-level message
        
        3. Start listening and serving
            a. Call httpServer.ListenAndServe()
            b. This blocks and processes requests indefinitely
            c. Returns only when:
                - Shutdown signal is received, or
                - A fatal error occurs

End Function
```

### Graceful Shutdown Flow

```
Function ShutdownServer(server, shutdownContext):
    Input:
        - server: running Server instance
        - shutdownContext: context with timeout for shutdown operations
    
    Output: error if any shutdown step fails, nil if successful
    
    Steps:
        1. Stop HTTP Server
            a. Call httpServer.Shutdown(context)
            b. This stops accepting new connections
            c. Waits for in-flight requests to complete (with timeout)
            d. If shutdown fails:
                - Return error with context
        
        2. Close Database Connections
            a. Call db.Close()
            b. This closes the connection pool
            c. Waits for queries to complete or timeout
            d. If close fails:
                - Return error with context
        
        3. Stop Job Service
            a. Check if Job service exists
            b. If yes, call jobService.Stop()
            c. This stops processing queued jobs
            d. Waits for active jobs to complete
        
        4. Return success (nil)

End Function
```

### Timeout Configuration Explanation

```
ReadTimeout:  Maximum time allowed to read the complete HTTP request from client
              - Prevents slow-client attacks (sending request very slowly)
              - Includes time to receive headers and body

WriteTimeout: Maximum time allowed to send the complete HTTP response to client
              - Prevents slow-client attacks (client reads response very slowly)
              - If response takes longer, connection is forcefully closed

IdleTimeout:  Maximum time a keep-alive connection can be idle (waiting for next request)
              - Prevents resource exhaustion from idle connections
              - Connection is closed if no request arrives within this time

Example with 30-second timeouts:
- Client sends first byte at 0s, completes request at 25s ✓ (within 30s)
- Client sends first byte at 0s, completes request at 35s ✗ (exceeds 30s, rejected)
```

---

## Third-Party Dependencies & Components

### **1. HTTP Server Framework**
- **Package Name:** `net/http` (Go standard library)
- **Purpose:** Implements HTTP/1.1 server functionality
- **Benefit:** Production-ready, battle-tested HTTP server with TLS support
- **Responsibility:** 
  - Listen for incoming HTTP connections
  - Parse HTTP requests
  - Route to handler
  - Serialize responses back to client
- **Key Components Used:**
  - `http.Server` - HTTP server instance
  - `http.Handler` - Interface for request handlers
  - `http.ListenAndServe()` - Start listening (legacy)
  - `server.ListenAndServe()` - Modern method on Server struct
  - `server.Shutdown()` - Graceful shutdown

---

### **2. Configuration Management**
- **Package Name:** `github.com/sriniously/go-boilerplate/internal/config`
- **Purpose:** Centralized configuration from environment/files
- **Benefit:** Externalizes settings, enables environment-specific configuration
- **Responsibility:** Provides all server, database, Redis, and job configuration
- **Key Fields Used:**
  - `config.Server.Port` - HTTP listening port
  - `config.Server.ReadTimeout` - HTTP read timeout in seconds
  - `config.Server.WriteTimeout` - HTTP write timeout in seconds
  - `config.Server.IdleTimeout` - HTTP idle timeout in seconds
  - `config.Redis.Address` - Redis connection address
  - `config.Primary.Env` - Environment type (local/staging/production)

---

### **3. Database Component**
- **Package Name:** `github.com/sriniously/go-boilerplate/internal/database`
- **Purpose:** Database connection pool and operations
- **Benefit:** Persistent data layer with connection pooling and tracing
- **Responsibility:** 
  - Manages database connections
  - Executes queries
  - Provides data access to handlers
- **Key Functions/Methods Used:**
  - `database.New()` - Initialize database component
  - `db.Close()` - Gracefully close database connections

---

### **4. Redis Cache Client**
- **Package Name:** `github.com/redis/go-redis/v9`
- **Package Version:** `v9`
- **Purpose:** Redis client for distributed caching and sessions
- **Benefit:** High-performance in-memory cache, reduces database load
- **Responsibility:**
  - Connect to Redis server
  - Execute cache operations (GET, SET, DEL, etc.)
  - Handle serialization/deserialization
  - Provide pub/sub capabilities
- **Key Components/Methods Used:**
  - `redis.NewClient()` - Create Redis client instance
  - `redis.Options` - Configuration struct with server address
  - `client.Ping()` - Health check connectivity
  - `client.AddHook()` - Add middleware/hooks for monitoring
- **Connection Details:**
  - Address from `config.Redis.Address`
  - Includes host and port (e.g., "localhost:6379")

---

### **5. Redis APM Integration**
- **Package Name:** `github.com/newrelic/go-agent/v3/integrations/nrredis-v9`
- **Package Version:** `v3`
- **Purpose:** New Relic instrumentation for Redis operations
- **Benefit:** Visibility into Redis performance, cache hit/miss rates, latency
- **Responsibility:**
  - Intercept Redis commands
  - Measure operation timing
  - Record command details
  - Send metrics to New Relic APM
- **Key Functions/Methods Used:**
  - `nrredis.NewHook()` - Create Redis hook for monitoring
  - `client.AddHook()` - Attach hook to Redis client
- **Integration Point:** Called during Redis initialization if APM service is active
- **Note:** Only active in non-local environments

---

### **6. Job Service Component**
- **Package Name:** `github.com/sriniously/go-boilerplate/internal/lib/job`
- **Purpose:** Background job/task processing and scheduling
- **Benefit:** Enables asynchronous task execution, decouples heavy operations from HTTP requests
- **Responsibility:**
  - Queue background tasks
  - Process queued jobs (worker pattern)
  - Execute job handlers
  - Manage retries and error handling
  - Schedule recurring jobs
- **Key Components/Methods Used:**
  - `job.NewJobService()` - Create job service instance
  - `jobService.InitHandlers()` - Register job handlers/definitions
  - `jobService.Start()` - Begin processing queued jobs
  - `jobService.Stop()` - Gracefully stop job processor
- **Dependencies:** Uses Redis for job queue storage (if available)

---

### **7. Logging Framework**
- **Package Name:** `github.com/rs/zerolog`
- **Purpose:** Structured, performant logging
- **Benefit:** JSON logs, filtering by level, integration with log aggregation services
- **Responsibility:**
  - Format and output log messages
  - Track log level configuration
  - Provide logger instance to all components
- **Key Components Used:**
  - `zerolog.Logger` - Logger instance
  - `logger.Info()` - Log info-level messages
  - `logger.Error()` - Log error-level messages
  - `logger.Str()` - Add string field to log
  - `logger.Err()` - Add error field to log

---

### **8. Logger Service (Custom)**
- **Package Name:** `github.com/sriniously/go-boilerplate/internal/logger`
- **Alias:** `loggerPkg`
- **Purpose:** Custom logging service wrapper with monitoring integration
- **Benefit:** Centralized logger configuration, APM integration hooks
- **Responsibility:**
  - Initialize and manage Zerolog instance
  - Provide New Relic application instance
  - Track if monitoring is active
- **Key Methods/Fields Used:**
  - `loggerService.GetApplication()` - Get New Relic application for integration checks

---

### **9. New Relic Go Agent**
- **Package Name:** `github.com/newrelic/go-agent/v3`
- **Package Version:** `v3`
- **Purpose:** Application Performance Monitoring (APM) agent
- **Benefit:** 
  - Real-time performance monitoring
  - Error tracking and alerting
  - Database and cache instrumentation
  - Distributed tracing
- **Responsibility:**
  - Collect application metrics
  - Track transactions (HTTP requests, background jobs)
  - Monitor external service calls
  - Report data to New Relic cloud service
- **Integration Points:**
  - Database query tracing (via `nrpgx5`)
  - Redis command tracing (via `nrredis-v9`)
  - HTTP request tracking (automatic)
  - Background job tracking (if configured)
- **Note:** Only active in non-local environments (production/staging)

---

### **10. Context Package (Go Standard Library)**
- **Package Name:** `context` (Go standard library)
- **Purpose:** Context management and cancellation signaling
- **Benefit:** Request scoping, timeout handling, graceful cancellation
- **Responsibility:**
  - Provide timeout context for operations
  - Signal cancellation to goroutines
  - Carry request-scoped values
- **Key Functions/Methods Used:**
  - `context.WithTimeout()` - Create context with deadline
  - `ctx.Err()` - Check if context was cancelled
  - Passed to server shutdown for timeout control

---

## Interaction Diagram

```
Application Bootstrap
       |
       v
[Initialize Server Component]
       |
       +---> [Database Init]
       |     |
       |     +---> Create connection pool
       |     |
       |     +---> Verify connectivity
       |     |
       |     +---> Return or error
       |
       +---> [Redis Init]
       |     |
       |     +---> Create Redis client
       |     |
       |     +---> Add APM hook (if available)
       |     |
       |     +---> Health check (Ping)
       |     |
       |     +---> Log warning if fails (non-blocking)
       |
       +---> [Job Service Init]
       |     |
       |     +---> Create job service
       |     |
       |     +---> Load job handlers
       |     |
       |     +---> Start job processor
       |
       +---> [Assemble Server]
       |     |
       |     +---> Store all components
       |
       v
[Server Instance Ready]
       |
       +---> [Configure HTTP Server]
       |     |
       |     +---> Set port, timeouts, handler
       |
       +---> [Start HTTP Server]
       |     |
       |     +---> Listen and serve (blocking)
       |     |
       |     +---> Handle incoming requests
       |
       v
[Application Running - Request Processing]
       |
       +---> HTTP Handler receives request
       |     |
       |     +---> Access server.DB for data
       |     |
       |     +---> Access server.Redis for cache
       |     |
       |     +---> Enqueue jobs to server.Job
       |     |
       |     +---> Send response
       |
       v
[Graceful Shutdown Initiated]
       |
       +---> [Shutdown Sequence]
       |     |
       |     +---> Stop accepting new HTTP requests
       |     |
       |     +---> Wait for in-flight requests (with timeout)
       |     |
       |     +---> Close database pool
       |     |
       |     +---> Stop job processor
       |
       v
[All Systems Closed - Application Exits]
```

---

## Summary Table: Operations & Responsibility

| Operation | Responsibility | Triggered By | Frequency | Blocking |
|-----------|-----------------|--------------|-----------|----------|
| **Dependency Injection** | Initialize all subsystems | Application startup | Once | Yes |
| **Database Init** | Create database pool | Server init | Once | Yes (must succeed) |
| **Redis Init** | Create cache client | Server init | Once | No (failure allowed) |
| **Job Service Init** | Start job processor | Server init | Once | Yes |
| **HTTP Config** | Configure server | Before Start() | Once | No |
| **HTTP Startup** | Listen for requests | Start() call | Once | Yes (blocking) |
| **Request Handling** | Process HTTP requests | Incoming connection | Continuous | Per-request |
| **Graceful Shutdown** | Stop all systems | Shutdown signal | Once | Yes |

---

## Startup Sequence Guarantees

1. **Database MUST connect** - Startup fails if database unavailable
2. **Redis CAN fail** - Startup continues if Redis unavailable (graceful degradation)
3. **Job Service MUST start** - Startup fails if job service fails to initialize
4. **All dependencies ready BEFORE HTTP** - HTTP server only starts after all subsystems initialized
5. **Subsystem order matters** - Database → Redis → Jobs → HTTP

---

## Shutdown Sequence Order

The shutdown order is critical for data consistency:

1. **HTTP Server First** - Stop accepting new requests, wait for in-flight requests
2. **Database Second** - Flush in-flight queries, close connections
3. **Job Service Last** - Complete or persist any remaining jobs

This order prevents:
- New requests starting after server begins shutdown
- Database closing while queries are executing
- Jobs losing connection to resources they depend on

---

## Configuration Structure

```
Server Configuration (from config):
├── Server
│   ├── Port (HTTP listening port)
│   ├── ReadTimeout (seconds)
│   ├── WriteTimeout (seconds)
│   └── IdleTimeout (seconds)
├── Database
│   ├── Host
│   ├── Port
│   ├── User
│   ├── Password
│   ├── Name
│   └── SSLMode
├── Redis
│   └── Address (host:port)
├── Job (job service config)
│   └── ... (job-specific settings)
└── Primary
    └── Env (local/staging/production)
```

---

## Key Design Principles

1. **Dependency Injection:** All subsystems passed in at initialization
2. **Graceful Degradation:** Non-critical failures (Redis) don't crash startup
3. **Orchestration:** Server acts as central coordinator for all components
4. **Separation of Concerns:** Each subsystem handles its own lifecycle
5. **Timeout Configuration:** Prevents slow-client attacks and resource exhaustion
6. **Proper Shutdown Order:** Ensures data consistency and no resource leaks
7. **Health Checking:** Verifies subsystem connectivity before returning
8. **Observability:** APM hooks integrated for monitoring all subsystems

---

## Technology-Agnostic Applicability

This documentation applies to any web application server architecture and can be adapted for:
- Different HTTP frameworks (though Go's `net/http` is used here)
- Different cache backends (Redis, Memcached, etc.)
- Different job queue systems (RabbitMQ, Kafka, etc.)
- Different database systems (PostgreSQL, MySQL, MongoDB, etc.)
- Different APM solutions (Datadog, New Relic, Elastic, etc.)

The core concepts remain consistent:
- Initialization of subsystems in dependency order
- Health checking of critical systems
- Non-blocking failures for optional systems
- Graceful shutdown in reverse dependency order
- Centralized configuration management
- Monitoring integration