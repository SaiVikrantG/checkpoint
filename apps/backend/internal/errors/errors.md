# Error Handling Component - Technical Blueprint

## Component Overview

The Error Handling component is a standardized, structured approach to managing and communicating errors across all layers of the application. It encapsulates HTTP errors with rich metadata, field-level validation errors, and actionable guidance for clients.

**Purpose**: Provide a consistent, predictable error response format that enables client applications to handle errors gracefully and display meaningful feedback to end users.

---

## Core Data Structures

### 1. **Field Error**
Represents validation errors at the field/input level.

**Structure**:
```
FieldError:
  - field: String (name of the field with error)
  - error: String (error message for that field)
```

**Example**:
```
{
  "field": "email",
  "error": "Email format is invalid"
}
```

**Use Case**: When validating form inputs, database constraints, or API request bodies.

---

### 2. **Action**
Represents a recommended action for the client to take in response to an error.

**Structure**:
```
Action:
  - type: Enum (currently supports: "redirect")
  - message: String (user-facing description of the action)
  - value: String (the target or parameter for the action)
```

**Example**:
```
{
  "type": "redirect",
  "message": "Please log in to continue",
  "value": "/login"
}
```

**Use Case**: Guide users on recovery steps (e.g., "redirect to login page" when session expires).

---

### 3. **HTTP Error**
The primary error container. Wraps all error information into a single, standardized response.

**Structure**:
```
HTTPError:
  - code: String (machine-readable error identifier, e.g., "UNAUTHORIZED", "VALIDATION_FAILED")
  - message: String (human-readable error message)
  - status: Integer (HTTP status code, e.g., 401, 400, 404, 500)
  - override: Boolean (flag to override default client behavior, if applicable)
  - errors: Array<FieldError> (field-level validation errors, optional)
  - action: Action (recommended action for client, optional)
```

**Example**:
```
{
  "code": "INVALID_CREDENTIALS",
  "message": "Email or password is incorrect",
  "status": 401,
  "override": false,
  "errors": [],
  "action": {
    "type": "redirect",
    "message": "Return to login",
    "value": "/login"
  }
}
```

---

## Core Operations

### Operation 1: Create HTTP Error
**Purpose**: Instantiate a standardized HTTP error with predefined status codes and formatted codes.

**Inputs**:
- Error type/status code
- Custom message
- Optional: custom code, field errors, action
- Optional: override flag

**Processing Steps**:
1. Determine the HTTP status code based on error type
2. Generate a machine-readable code (format: UPPERCASE_WITH_UNDERSCORES)
3. Allow override of generated code if custom code provided
4. Attach optional field errors and action guidance
5. Return fully constructed HTTPError object

**Output**: HTTPError object ready for serialization

**Example Pseudocode**:
```
function CreateHTTPError(type, message, customCode?, fieldErrors?, action?):
  statusCode := MapErrorTypeToHTTPStatus(type)
  code := FormatAsUppercaseWithUnderscores(GetStatusText(statusCode))
  
  if customCode is provided:
    code := customCode
  
  return HTTPError {
    code: code,
    message: message,
    status: statusCode,
    override: false,
    errors: fieldErrors or [],
    action: action or null
  }
```

---

### Operation 2: Mutate Error Message
**Purpose**: Create a new error with the same metadata but updated message (immutable pattern).

**Inputs**:
- Existing HTTPError
- New message string

**Processing Steps**:
1. Clone all fields from the original error
2. Replace the message field
3. Return a new HTTPError instance

**Output**: New HTTPError with updated message, all other fields unchanged

**Example Pseudocode**:
```
function WithMessage(error: HTTPError, newMessage: string):
  return HTTPError {
    code: error.code,
    message: newMessage,
    status: error.status,
    override: error.override,
    errors: error.errors,
    action: error.action
  }
```

---

### Operation 3: Format Code String
**Purpose**: Convert human-readable strings to machine-readable code format.

**Inputs**:
- String to format (e.g., "Bad Request", "Unauthorized")

**Processing Steps**:
1. Convert all characters to uppercase
2. Replace spaces with underscores
3. Return formatted string

**Output**: Formatted code string (e.g., "BAD_REQUEST", "UNAUTHORIZED")

**Example Pseudocode**:
```
function FormatCode(input: string):
  uppercase := ToUppercase(input)
  return Replace(uppercase, " ", "_")
```

---

### Operation 4: Error Type Checking
**Purpose**: Determine if an error is of a specific type without type assertions.

**Inputs**:
- Error object
- Target error type

**Processing Steps**:
1. Check if the error object is an instance of HTTPError type
2. Return boolean result

**Output**: Boolean indicating if error matches type

**Example Pseudocode**:
```
function IsHTTPError(error, targetType):
  return error is instance of targetType
```

---

## Predefined Error Constructors

### Unauthorized Error (401)
**When to Use**: Authentication failed, missing credentials, invalid token

```
NewUnauthorizedError(message, override):
  return HTTPError {
    code: "UNAUTHORIZED",
    message: message,
    status: 401,
    override: override,
    errors: [],
    action: null
  }
```

---

### Forbidden Error (403)
**When to Use**: Authenticated but lacks permission, insufficient privileges

```
NewForbiddenError(message, override):
  return HTTPError {
    code: "FORBIDDEN",
    message: message,
    status: 403,
    override: override,
    errors: [],
    action: null
  }
```

---

### Bad Request Error (400)
**When to Use**: Invalid input, validation failures, malformed requests

```
NewBadRequestError(message, override, customCode?, fieldErrors?, action?):
  code := "BAD_REQUEST"
  
  if customCode is provided:
    code := customCode
  
  return HTTPError {
    code: code,
    message: message,
    status: 400,
    override: override,
    errors: fieldErrors or [],
    action: action or null
  }
```

---

### Not Found Error (404)
**When to Use**: Resource doesn't exist, endpoint not found

```
NewNotFoundError(message, override, customCode?):
  code := "NOT_FOUND"
  
  if customCode is provided:
    code := customCode
  
  return HTTPError {
    code: code,
    message: message,
    status: 404,
    override: override,
    errors: [],
    action: null
  }
```

---

### Internal Server Error (500)
**When to Use**: Unexpected server-side failures, unhandled exceptions

```
NewInternalServerError():
  return HTTPError {
    code: "INTERNAL_SERVER_ERROR",
    message: "Internal Server Error",
    status: 500,
    override: false,
    errors: [],
    action: null
  }
```

---

### Validation Error
**When to Use**: When validation logic fails with an error object

```
ValidationError(validationError):
  return NewBadRequestError(
    message: "Validation failed: " + validationError.message,
    override: false,
    customCode: null,
    fieldErrors: null,
    action: null
  )
```

---

## Response Flow

### Typical Error Response Lifecycle

```
1. Error Occurs
   ↓
2. Determine Error Type (401, 400, 404, 500, etc.)
   ↓
3. Create HTTPError via Constructor
   ↓
4. (Optional) Enrich with Field Errors
   ↓
5. (Optional) Add Action Guidance
   ↓
6. (Optional) Override Message with Context
   ↓
7. Serialize to JSON
   ↓
8. Return to Client with Appropriate HTTP Status
```

---

## Client-Side Consumption Pattern

**Expected Client Behavior**:

1. **Parse Response**: Deserialize JSON to HTTPError object
2. **Check Status Code**: Route handling by `status` field
3. **Display Message**: Show `message` to end user
4. **Field Validation**: If `errors` array present, display field-specific errors
5. **Execute Action**: If `action` present, perform recommended action (e.g., redirect)
6. **Respect Override**: If `override` is true, bypass default client error handling

---

## Design Patterns

### Pattern 1: Rich Validation Errors
**Scenario**: Form submission with multiple validation failures

**Implementation**:
```
fieldErrors := [
  {field: "email", error: "Email must be valid"},
  {field: "password", error: "Password must be at least 8 characters"}
]

error := NewBadRequestError(
  message: "Form validation failed",
  override: false,
  fieldErrors: fieldErrors,
  action: null
)
```

---

### Pattern 2: Guided Recovery
**Scenario**: User session expired during operation

**Implementation**:
```
action := Action{
  type: "redirect",
  message: "Your session has expired. Please log in again.",
  value: "/auth/login"
}

error := NewUnauthorizedError(
  message: "Session expired",
  override: true
)
error.Action = action
```

---

### Pattern 3: Custom Error Codes
**Scenario**: Business-specific error that maps to standard HTTP status

**Implementation**:
```
error := NewBadRequestError(
  message: "User already exists with this email",
  override: false,
  customCode: "EMAIL_ALREADY_REGISTERED",
  fieldErrors: null,
  action: null
)
```

---

## Integration Touchpoints

### Where This Component Fits

| Layer | Integration Point | Example |
|-------|-------------------|---------|
| **API Handlers/Controllers** | Catch errors, wrap in HTTPError, return to client | Route handler catches validation error, returns 400 HTTPError |
| **Service Layer** | Generate domain-specific errors, return as HTTPError | Business logic detects duplicate email, returns custom BAD_REQUEST error |
| **Repository/Data Layer** | Map database errors to HTTPError | Database query fails, wrapped as INTERNAL_SERVER_ERROR |
| **Middleware** | Authentication, authorization checks | Auth middleware returns 401 Unauthorized if token invalid |
| **Validation Layer** | Catch validation failures | Input validator catches format error, wraps in 400 Bad Request |

---

## Technology-Agnostic Considerations

### Serialization
- All structures must be serializable to JSON
- Ensure field names match expected client format
- Preserve order and structure during round-trip

### HTTP Status Codes
Use standard HTTP semantics:
- **2xx**: Success
- **400**: Client error (bad request, validation)
- **401**: Authentication required
- **403**: Permission denied
- **404**: Not found
- **5xx**: Server error

### Field Naming
- Use camelCase for JSON keys
- Keep names concise but descriptive
- Maintain consistency across all error responses

### Immutability
- When modifying errors, create new instances rather than mutating originals
- Preserves error chain and enables debugging

---

## Best Practices

1. **Always provide context**: Messages should explain what went wrong and why, not just "error"
2. **Use appropriate status codes**: Don't return 500 for validation errors; use 400
3. **Include field errors**: For validation failures, list each field and its specific issue
4. **Guide recovery**: When possible, add Action guidance to help users recover
5. **Don't expose internals**: Hide implementation details; provide safe, user-friendly messages
6. **Consistent format**: All errors should follow the HTTPError structure
7. **Override flag usage**: Only set override=true when client must change behavior
8. **Avoid error chaining in messages**: Don't concatenate multiple error messages; synthesize one clear message

---

## Common Implementation Checklist

- [ ] Define HTTPError structure with code, message, status, override, errors, action fields
- [ ] Create FieldError struct for field-level validation issues
- [ ] Create Action struct for guiding client recovery
- [ ] Implement type checking method (Is/As for error wrapping)
- [ ] Implement message mutation method (WithMessage)
- [ ] Implement code formatting utility (MakeUpperCaseWithUnderscores)
- [ ] Create constructors for common error types (401, 403, 400, 404, 500)
- [ ] Create validation error wrapper
- [ ] Add JSON serialization tags to all structs
- [ ] Document expected client consumption patterns
- [ ] Add examples for each error type to reduce client confusion

---

## Example Error Responses

### Example 1: Simple Unauthorized
```json
{
  "code": "UNAUTHORIZED",
  "message": "Invalid authentication token",
  "status": 401,
  "override": false,
  "errors": [],
  "action": null
}
```

### Example 2: Validation with Field Errors
```json
{
  "code": "INVALID_REQUEST",
  "message": "Please fix the errors below",
  "status": 400,
  "override": false,
  "errors": [
    {
      "field": "email",
      "error": "Email is required"
    },
    {
      "field": "age",
      "error": "Age must be at least 18"
    }
  ],
  "action": null
}
```

### Example 3: Not Found with Action
```json
{
  "code": "RESOURCE_NOT_FOUND",
  "message": "The user you're looking for doesn't exist",
  "status": 404,
  "override": true,
  "errors": [],
  "action": {
    "type": "redirect",
    "message": "Return to user list",
    "value": "/users"
  }
}
```

### Example 4: Forbidden with Context
```json
{
  "code": "INSUFFICIENT_PERMISSIONS",
  "message": "You don't have permission to delete this resource",
  "status": 403,
  "override": false,
  "errors": [],
  "action": null
}
```

---

## Extension Points

### Adding New Error Types
To add a new error type, follow this pattern:

```
function NewCustomError(message, override, customCode?, fieldErrors?, action?):
  code := "CUSTOM_ERROR_CODE"
  
  if customCode is provided:
    code := customCode
  
  return HTTPError {
    code: code,
    message: message,
    status: [appropriate HTTP status],
    override: override,
    errors: fieldErrors or [],
    action: action or null
  }
```

### Adding New Action Types
To add a new action type:

1. Extend ActionType enum with new value (e.g., "redirect", "retry", "modal")
2. Document the new action type in the Action struct definition
3. Update client to handle new action type
4. Add examples in documentation

### Custom Code Formatting
If different formatting is needed (e.g., kebab-case instead of UPPER_CASE):

```
function FormatCode(input: string, format: Enum):
  if format == "UPPERCASE_UNDERSCORE":
    return FormatAsUppercaseWithUnderscores(input)
  else if format == "KEBAB_CASE":
    return FormatAsKebabCase(input)
  else:
    return input
```

---

## Summary

The Error Handling component provides:
- ✅ Standardized error response structure
- ✅ Support for field-level validation errors
- ✅ Actionable guidance for client recovery
- ✅ Consistent HTTP status code mapping
- ✅ Machine-readable error codes
- ✅ Human-readable error messages
- ✅ Type-safe error operations
- ✅ Immutable error mutations

This blueprint can be adapted to any language, framework, or platform while maintaining the same core principles and structure.