# Router Component Documentation

## Overview

The Router component is responsible for establishing the application's HTTP routing infrastructure. It acts as the central hub for:
- Mapping incoming HTTP requests to appropriate handlers
- Applying cross-cutting concerns (middlewares) uniformly across endpoints
- Organizing routes into logical groups and versions
- Managing rate limiting and security policies
- Handling errors in a consistent manner

The Router is framework-agnostic in concept but provides a unified entry point for the entire request pipeline.

---

## Core Responsibilities

### 1. **Initialization & Setup**
- Create and configure the routing engine
- Inject dependencies (Server, Handlers, Services)
- Register global middleware stack
- Set up error handling mechanism
- Configure route groups and versioning

### 2. **Middleware Pipeline Management**
- Stack middlewares in execution order
- Configure rate limiting policies
- Set up CORS (Cross-Origin Resource Sharing)
- Enable security headers
- Add request tracking (ID generation, tracing)
- Configure logging and error recovery

### 3. **Route Registration**
- Register system-level routes (health checks, static assets, documentation)
- Register API versioned routes
- Organize routes by domain/feature
- Map HTTP methods to specific handlers

### 4. **Request Processing Pipeline**
- Intercept incoming requests
- Apply middleware transformations
- Route to appropriate handler
- Capture and handle errors
- Return formatted responses

### 5. **Cross-Cutting Concerns**
- Rate limiting enforcement
- CORS policy validation
- Security headers injection
- Request ID tracking and tracing
- Context enrichment
- Logging and monitoring
- Error recovery and panic handling

---

## Architecture & Data Flow

```
Incoming HTTP Request
        ↓
┌───────────────────────────────────────┐
│   Global Middleware Stack             │
├───────────────────────────────────────┤
│ 1. Rate Limiter                       │
│ 2. CORS Handler                       │
│ 3. Security Headers                   │
│ 4. Request ID Generator               │
│ 5. Tracing (NewRelic/APM)            │
│ 6. Context Enhancer                   │
│ 7. Request Logger                     │
│ 8. Panic Recovery                     │
└───────────────────────────────────────┘
        ↓
   Router Matcher
   (Path + Method)
        ↓
┌──────────────────────────┐
│  Route Groups:           │
│  - System Routes         │
│  - API v1 Routes         │
│  - API v2 Routes (etc)   │
└──────────────────────────┘
        ↓
   Handler Function
        ↓
┌──────────────────────────┐
│  Error Handler           │
│  (Global Handler)        │
└──────────────────────────┘
        ↓
   HTTP Response
```

---

## Pseudocode

### Main Router Initialization

```plaintext
FUNCTION CreateRouter(server, handlers, services):
    
    // Step 1: Initialize Middleware Provider
    middlewareStack = InitializeMiddlewareProvider(server)
    
    // Step 2: Create Router Instance
    router = CreateRouterEngine()
    
    // Step 3: Set Global Error Handler
    router.SetErrorHandler(middlewareStack.GlobalErrors.HandleErrors)
    
    // Step 4: Apply Global Middlewares (in order)
    middlewareStack = [
        RateLimiterMiddleware(
            limit = 20 requests per time period,
            onViolation = RecordMetricAndReturnTooManyRequests
        ),
        CORSMiddleware(),
        SecurityHeadersMiddleware(),
        RequestIDMiddleware(),
        TracingMiddleware(NewRelic),
        ContextEnhancerMiddleware(),
        RequestLoggerMiddleware(),
        PanicRecoveryMiddleware()
    ]
    
    FOR EACH middleware IN middlewareStack:
        router.Register(middleware)
    END FOR
    
    // Step 5: Register Routes
    RegisterSystemRoutes(router, handlers)
    RegisterAPIv1Routes(router, handlers, services)
    RegisterAPIv2Routes(router, handlers, services)  // Optional future versions
    
    // Step 6: Return Configured Router
    RETURN router
END FUNCTION


FUNCTION RegisterSystemRoutes(router, handlers):
    
    // Health Check Endpoint
    router.MapRoute(
        method = GET,
        path = "/status",
        handler = handlers.Health.CheckHealth
    )
    
    // Static Files Serving
    router.MapStaticFiles(
        path = "/static",
        directory = "./static"
    )
    
    // API Documentation Endpoint
    router.MapRoute(
        method = GET,
        path = "/docs",
        handler = handlers.OpenAPI.ServeOpenAPIUI
    )
    
END FUNCTION


FUNCTION RegisterAPIv1Routes(router, handlers, services):
    
    // Create API v1 Route Group
    apiV1Group = router.CreateGroup(prefix = "/api/v1")
    
    // Register all v1 endpoints
    // Example structure (pseudo):
    apiV1Group.MapRoute(method = GET,    path = "/users",      handler = handlers.Users.GetAll)
    apiV1Group.MapRoute(method = POST,   path = "/users",      handler = handlers.Users.Create)
    apiV1Group.MapRoute(method = GET,    path = "/users/:id",  handler = handlers.Users.GetByID)
    apiV1Group.MapRoute(method = PUT,    path = "/users/:id",  handler = handlers.Users.Update)
    apiV1Group.MapRoute(method = DELETE, path = "/users/:id",  handler = handlers.Users.Delete)
    
END FUNCTION


FUNCTION RateLimiterMiddleware(limit, onViolation):
    
    FUNCTION OnRequest(request):
        clientIdentifier = GetClientIdentifier(request)  // IP or User ID
        
        IF RateLimitStore.IsExceeded(clientIdentifier, limit):
            
            LogWarning(
                message = "Rate limit exceeded",
                details = {
                    requestID = GetRequestID(request),
                    identifier = clientIdentifier,
                    path = request.Path,
                    method = request.Method,
                    ip = request.RemoteIP
                }
            )
            
            // Record metrics for monitoring
            RecordRateLimitHit(request.Path)
            
            // Invoke violation handler
            RETURN onViolation(status = 429, message = "Rate limit exceeded")
        END IF
        
        RETURN ContinueRequest()
    END FUNCTION
    
END FUNCTION
```

---

## Basic Operations Required

### Operation 1: Initialize Router
**Purpose**: Set up the routing infrastructure with all configurations  
**Inputs**: Server instance, Handler collection, Service dependencies  
**Outputs**: Configured Router engine ready to accept requests  
**Error Cases**: Invalid configuration, missing dependencies, middleware initialization failure

### Operation 2: Register Middleware
**Purpose**: Add cross-cutting concerns to the request pipeline  
**Inputs**: Middleware instance, execution order  
**Outputs**: Middleware registered in pipeline  
**Error Cases**: Incompatible middleware, circular dependencies, invalid configuration

### Operation 3: Register Routes
**Purpose**: Map HTTP endpoints to handler functions  
**Inputs**: HTTP method, path pattern, handler function  
**Outputs**: Route registered in routing table  
**Error Cases**: Duplicate routes, invalid patterns, handler not found

### Operation 4: Handle Incoming Request
**Purpose**: Process HTTP request through middleware chain and route to handler  
**Inputs**: HTTP request object  
**Outputs**: HTTP response  
**Error Cases**: Route not found, middleware rejection, handler exception, rate limit exceeded

### Operation 5: Apply Rate Limiting
**Purpose**: Enforce request limits per client  
**Inputs**: Client identifier, rate limit threshold  
**Outputs**: Request approval or rejection  
**Error Cases**: Store unavailable, misconfigured limits

### Operation 6: Record Metrics & Logging
**Purpose**: Track usage patterns and debug information  
**Inputs**: Event data (rate limits, requests, errors)  
**Outputs**: Metrics recorded, logs written  
**Error Cases**: Logger/metrics service unavailable

---

## Third-Party Components & Dependencies

### 1. **Echo Framework** (HTTP Router Engine)
- **Purpose**: Core HTTP routing and request handling engine
- **Responsibilities**:
  - HTTP method and path matching
  - Middleware pipeline management
  - Request/response handling
  - Error handling hooks
- **Imports**: `github.com/labstack/echo/v4`
- **Key Functions Used**:
  - `echo.New()` - Create router instance
  - `router.Use()` - Register global middleware
  - `router.GET/POST/PUT/DELETE()` - Register routes
  - `router.Group()` - Create route groups
  - `router.Static()` - Serve static files
  - `echo.NewHTTPError()` - Create HTTP errors

### 2. **Echo Middleware Package** (Built-in Middleware)
- **Purpose**: Provides common middleware implementations
- **Used Middlewares**:
  - `RateLimiterWithConfig` - Request rate limiting with memory store
  - Additional available: CORS, Logger, Recover, etc.
- **Imports**: `github.com/labstack/echo/v4/middleware`
- **Configuration Pattern**: Middleware + Config struct

### 3. **Golang Rate Limiting** (golang.org/x/time)
- **Purpose**: Token bucket algorithm for rate limiting
- **Responsibilities**:
  - Define rate limit values
  - Enforce burst handling
- **Imports**: `golang.org/x/time/rate`
- **Key Types**:
  - `rate.Limit` - Defines limit as requests per time period

### 4. **Internal Middleware Layer** (Custom Middleware)
- **Purpose**: Application-specific cross-cutting concerns
- **Imported From**: `github.com/sriniously/go-boilerplate/internal/middleware`
- **Components**:
  - **Global Middlewares**: CORS, Security, Error Handling, Logging, Recovery
  - **Tracing**: NewRelic integration and tracing enhancement
  - **Context Enhancer**: Enriches request context with custom data
  - **Request ID Generator**: Unique request tracking
  - **Rate Limiter Recorder**: Metrics collection for rate limit events

### 5. **Internal Handler Layer** (Route Handlers)
- **Purpose**: Business logic for each route
- **Imported From**: `github.com/sriniously/go-boilerplate/internal/handler`
- **Structure**: Organized handler groups (Health, OpenAPI, Users, etc.)
- **Dependency**: Injected into router at initialization

### 6. **Internal Service Layer** (Business Logic)
- **Purpose**: Core application services and business rules
- **Imported From**: `github.com/sriniously/go-boilerplate/internal/service`
- **Relationship**: Services are used by handlers to process requests
- **Dependency**: Injected into router for handler availability

### 7. **Internal Server** (Configuration & Logger)
- **Purpose**: Application server configuration and logging
- **Imported From**: `github.com/sriniously/go-boilerplate/internal/server`
- **Provides**:
  - Logger instance for middleware logging
  - Server configuration details
  - Shared context and utilities
- **Dependency**: Required for middleware initialization and logging

### 8. **HTTP Package** (Standard Library)
- **Purpose**: HTTP constants and types
- **Used For**:
  - `http.StatusTooManyRequests` constant (status code 429)
- **Imports**: `net/http`

---

## Configuration & Dependencies Matrix

| Component | Purpose | Injected | Initialized By |
|-----------|---------|----------|-----------------|
| Server | Config, Logger, utilities | Yes | External |
| Handlers | Route business logic | Yes | External |
| Services | Business logic layer | Yes | External |
| Middlewares | Cross-cutting concerns | Created | Router |
| Echo Engine | HTTP routing | Created | Router |
| Rate Limiter Store | Request tracking | Created | Middleware |

---

## Request Lifecycle Stages

### Stage 1: Request Arrives
- HTTP server receives request

### Stage 2: Global Middleware Chain
- Rate Limiter: Check if client exceeded limit
  - If exceeded: Return 429 error, record metric, stop processing
  - If allowed: Continue to next middleware
- CORS: Validate origin and add headers
- Security: Apply security headers
- Request ID: Generate/attach unique request ID
- Tracing: Start APM trace
- Context Enhancer: Add custom context data
- Request Logger: Log incoming request details
- Recovery: Prepare panic recovery

### Stage 3: Route Matching
- Match request path and method against registered routes
- If no match: Return 404 error

### Stage 4: Handler Execution
- Call matched handler function
- Handler processes request using services
- Handler returns response

### Stage 5: Error Handling
- If any stage throws error: Use global error handler
- Format error response consistently
- Log error with request context

### Stage 6: Response Sent
- Return HTTP response to client

---

## Extension Points

### Adding New Routes
```plaintext
1. Create handler in handler package
2. Register route in RegisterAPIv1Routes (or new version group)
3. Specify HTTP method, path pattern, and handler
4. Optionally add route-specific middleware
```

### Adding New Middleware
```plaintext
1. Create middleware in middleware package
2. Call router.Use() to register globally
3. Or apply to specific route groups for selective use
```

### Adding New API Versions
```plaintext
1. Create new function: RegisterAPIv2Routes()
2. Create new route group with "/api/v2" prefix
3. Register all v2 endpoints
4. Call registration function from NewRouter()
```

---

## Key Characteristics

| Aspect | Details |
|--------|---------|
| **Pattern** | Middleware Pipeline + Route Mapper |
| **Configuration** | Centralized in NewRouter function |
| **Error Handling** | Global error handler delegates to middleware |
| **Observability** | Request ID, Tracing, Logging per request |
| **Security** | Rate limiting, CORS, Security headers |
| **Scalability** | Middleware allows feature addition without core changes |
| **Testability** | Dependencies injected (mockable) |

---

## Summary

The Router component orchestrates HTTP request handling by:
1. **Configuring** a middleware stack for cross-cutting concerns
2. **Registering** routes and mapping them to handlers
3. **Processing** incoming requests through the middleware pipeline
4. **Matching** requests to appropriate handlers via path/method
5. **Managing** errors consistently across all routes
6. **Tracking** requests for observability and security

It acts as the entry point to the entire application, making it critical for request routing, security, and observability.