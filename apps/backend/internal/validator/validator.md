# Validation Component - Technical Blueprint

## Component Overview

The Validation component standardizes input validation across the application. It provides utilities to validate request payloads, bind JSON/form data to domain objects, run validation rules, and convert validation errors into structured HTTP error responses.

**Purpose**: Ensure all incoming data meets requirements before processing, provide clear field-level feedback to clients, and maintain consistent validation behavior across all endpoints.

---

## Core Data Structures

### 1. **Validatable Interface**
Represents any object that can validate itself.

**Structure**:
```
Validatable (Interface):
  - Validate(): error
```

**Contract**: Any type implementing this interface must provide a Validate() method that returns nil if valid, or an error describing validation failures.

**Example**:
```
type CreateUserRequest struct {
  Email string `validate:"required,email"`
  Password string `validate:"required,min=8"`
}

func (req *CreateUserRequest) Validate() error {
  // Custom validation logic
  if err := validate.Struct(req); err != nil {
    return err
  }
  return nil
}
```

**Use Case**: Polymorphic validation - any request DTO can implement this interface.

---

### 2. **Custom Validation Error**
Represents a single field validation failure from custom validation logic.

**Structure**:
```
CustomValidationError:
  - field: String (name of the field that failed)
  - message: String (human-readable error message)
```

**Example**:
```
{
  field: "password",
  message: "must not be a common password"
}
```

**Use Case**: Custom validation rules that aren't covered by standard validators.

---

### 3. **Custom Validation Errors Collection**
A collection of custom validation errors.

**Structure**:
```
CustomValidationErrors (List<CustomValidationError>):
  - Implements error interface
  - Returns "Validation failed" as error message
```

**Example**:
```
[
  {field: "email", message: "must not be a common email"},
  {field: "password", message: "must not be a common password"}
]
```

**Use Case**: Returning multiple custom validation failures at once.

---

## Core Operations

### Operation 1: Bind and Validate Request
**Purpose**: Parse incoming request body and validate it in one atomic operation.

**Inputs**:
- HTTP context/request
- Validatable payload object

**Processing Steps**:
1. Parse request body (JSON, form data, etc.)
2. Bind/deserialize to payload object
3. If binding fails, extract error message and return BadRequest
4. If binding succeeds, call Validate() on payload
5. If validation fails, extract field errors and return BadRequest with error details
6. Return nil if all checks pass

**Output**: Error if binding or validation fails, nil if successful

**Example Pseudocode**:
```
function BindAndValidate(context, payload: Validatable):
  // Step 1-2: Parse and bind
  if err := BindRequest(context, payload):
    // Extract user-friendly message from binding error
    message := ExtractBindingErrorMessage(err)
    return NewBadRequestError(message, false, null, null, null)
  
  // Step 3: Validate structure
  message, fieldErrors := ValidateStructure(payload)
  if fieldErrors != null:
    return NewBadRequestError(message, true, null, fieldErrors, null)
  
  return null
```

---

### Operation 2: Validate Structure
**Purpose**: Run Validate() method on payload and extract structured field errors.

**Inputs**:
- Validatable payload object

**Processing Steps**:
1. Call Validate() on payload
2. Check if error is a ValidationErrors collection
3. If yes, parse each validation error and extract field name and message
4. If no, check if custom validation errors
5. Build array of FieldError objects
6. Return aggregated error message and field errors array

**Output**: Tuple of (error message, array of field errors)

**Example Pseudocode**:
```
function ValidateStructure(payload: Validatable):
  validationErr := payload.Validate()
  
  if validationErr == null:
    return ("", null)
  
  return ExtractValidationErrors(validationErr)
```

---

### Operation 3: Extract Validation Errors
**Purpose**: Parse validation error object(s) and convert to standardized FieldError array.

**Inputs**:
- Validation error object (either ValidationErrors or CustomValidationErrors)

**Processing Steps**:
1. Check if error is CustomValidationErrors
   a. Iterate through custom errors
   b. Add each to FieldError array as-is
2. Check if error is ValidationErrors (from standard validator)
   a. Iterate through each field error
   b. Extract field name (lowercase)
   c. Based on validation tag, generate appropriate message:
      - "required" → "is required"
      - "min" → "must be at least {param} characters/units"
      - "max" → "must not exceed {param} characters/units"
      - "oneof" → "must be one of: {param}"
      - "email" → "must be a valid email address"
      - "e164" → "must be a valid phone number with country code"
      - "uuid" → "must be a valid UUID"
      - "uuidList" → "must be a comma-separated list of valid UUIDs"
      - "dive" → "some items are invalid"
      - default → "{field}: {tag}:{param}"
   d. Add to FieldError array
3. Return ("Validation failed", FieldError array)

**Output**: Tuple of (error message, array of field errors)

**Example Pseudocode**:
```
function ExtractValidationErrors(err):
  fieldErrors := []
  
  // Handle custom validation errors
  if err is CustomValidationErrors:
    for each customErr in err:
      fieldErrors.append({
        field: customErr.Field,
        error: customErr.Message
      })
    return ("Validation failed", fieldErrors)
  
  // Handle standard validation errors
  if err is ValidationErrors:
    for each validErr in err:
      field := Lowercase(validErr.Field())
      message := GenerateValidationMessage(validErr)
      
      fieldErrors.append({
        field: field,
        error: message
      })
    
    return ("Validation failed", fieldErrors)
  
  return ("Validation failed", null)

function GenerateValidationMessage(validErr):
  switch validErr.Tag():
    case "required":
      return "is required"
    case "min":
      if IsString(validErr.Type()):
        return "must be at least {validErr.Param()} characters"
      else:
        return "must be at least {validErr.Param()}"
    case "max":
      if IsString(validErr.Type()):
        return "must not exceed {validErr.Param()} characters"
      else:
        return "must not exceed {validErr.Param()}"
    case "oneof":
      return "must be one of: {validErr.Param()}"
    case "email":
      return "must be a valid email address"
    case "e164":
      return "must be a valid phone number with country code"
    case "uuid":
      return "must be a valid UUID"
    case "uuidList":
      return "must be a comma-separated list of valid UUIDs"
    case "dive":
      return "some items are invalid"
    default:
      if validErr.Param() is not empty:
        return "{validErr.Tag()}:{validErr.Param()}"
      else:
        return validErr.Tag()
```

---

### Operation 4: Validate UUID Format
**Purpose**: Check if a string is a valid UUID without using full validation framework.

**Inputs**:
- UUID string to validate

**Processing Steps**:
1. Define UUID regex pattern: `^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`
2. Match input string against pattern
3. Return true if matches, false otherwise

**Output**: Boolean indicating if string is valid UUID

**Example Pseudocode**:
```
uuidPattern := "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"

function IsValidUUID(uuidString: string):
  return RegexMatch(uuidPattern, uuidString)
```

**Example UUIDs**:
```
Valid:
- 550e8400-e29b-41d4-a716-446655440000
- 00000000-0000-0000-0000-000000000000
- ffffffff-ffff-ffff-ffff-ffffffffffff

Invalid:
- 550e8400-e29b-41d4-a716  (too short)
- 550e8400-e29b-41d4-a716-44665544000G  (invalid char)
- not-a-uuid
```

---

## Standard Validation Tags & Messages

| Tag | Meaning | Message | Example |
|-----|---------|---------|---------|
| required | Field must not be empty/null | "is required" | email: "" |
| email | Must be valid email format | "must be a valid email address" | email: "invalid" |
| min | Minimum length (string) or value (number) | "must be at least X characters" | password: "short" |
| max | Maximum length (string) or value (number) | "must not exceed X characters" | name: "very long name..." |
| oneof | Must be one of specified values | "must be one of: {options}" | role: "admin, user, guest" |
| e164 | Must be valid phone with country code | "must be a valid phone number with country code" | phone: "1234567" |
| uuid | Must be valid UUID format | "must be a valid UUID" | userId: "not-a-uuid" |
| uuidList | Comma-separated valid UUIDs | "must be a comma-separated list of valid UUIDs" | ids: "uuid1,invalid,uuid2" |
| dive | Validate nested items (arrays) | "some items are invalid" | items[i] validation fails |

---

## Request Binding Errors

### Error Extraction
When request binding fails, extract error message following this pattern:

**Input**: Raw binding error message
```
"code=400, message=Unmarshal type error: expected=string, got=number, field=email, offset=45"
```

**Processing**:
1. Split on commas
2. Find segment containing "message="
3. Extract text after "message="
4. Return as user-friendly error

**Output**: "Unmarshal type error: expected=string, got=number"

**Example Pseudocode**:
```
function ExtractBindingErrorMessage(rawErr: string):
  // Split by comma
  parts := Split(rawErr, ",")
  
  for each part in parts:
    if part contains "message=":
      message := Split(part, "message=")[1]
      return Trim(message)
  
  return "Invalid request format"
```

---

## Integration with HTTP Error Layer

### Validation Error → HTTP Error Flow

```
Incoming Request
    ↓
BindAndValidate(context, payload)
    ↓
Binding fails?
  YES → Extract binding error message
      → NewBadRequestError(message, false, null, null, null)
      → Return 400
  NO ↓
Validate() called
    ↓
Validation fails?
  YES → ExtractValidationErrors(err)
      → NewBadRequestError("Validation failed", true, null, fieldErrors, null)
      → Return 400 with field-level errors
  NO ↓
Return nil (validation passed)
```

---

## Design Patterns

### Pattern 1: Declarative Validation Tags
**Scenario**: Define validation rules alongside struct fields

**Implementation**:
```
type CreateUserRequest struct {
  Email string `validate:"required,email"`
  Password string `validate:"required,min=8,max=128"`
  Age int `validate:"required,min=18,max=150"`
  Role string `validate:"required,oneof=admin user guest"`
}
```

**When bound and validated, generates errors like**:
```
[
  {field: "email", error: "is required"},
  {field: "password", error: "must be at least 8 characters"},
  {field: "age", error: "must be at least 18"}
]
```

---

### Pattern 2: Custom Validation Logic
**Scenario**: Validation rules that can't be expressed with standard tags

**Implementation**:
```
type CreateUserRequest struct {
  Email string
  Password string
  ConfirmPassword string
}

func (req *CreateUserRequest) Validate() error {
  // Standard validation first
  if err := standardValidator.Struct(req); err != nil {
    return err
  }
  
  // Custom logic
  customErrors := CustomValidationErrors{}
  
  if req.Password != req.ConfirmPassword {
    customErrors = append(customErrors, CustomValidationError{
      Field: "confirm_password",
      Message: "passwords do not match"
    })
  }
  
  if ContainsCommonPassword(req.Password) {
    customErrors = append(customErrors, CustomValidationError{
      Field: "password",
      Message: "password is too common"
    })
  }
  
  if len(customErrors) > 0 {
    return customErrors
  }
  
  return nil
}
```

---

### Pattern 3: Nested Object Validation
**Scenario**: Validate complex objects with nested arrays/objects

**Implementation**:
```
type CreateOrderRequest struct {
  Items []OrderItem `validate:"required,dive"`
}

type OrderItem struct {
  ProductID string `validate:"required,uuid"`
  Quantity int `validate:"required,min=1"`
}
```

**When dive tag is used**:
- Each item in Items array is validated
- If any item fails, error message: "some items are invalid"

---

### Pattern 4: Type-Specific Validation Messages
**Scenario**: Different message for string vs number min/max

**Implementation**:
```
// For strings
type User struct {
  Password string `validate:"min=8"`
  // Message: "must be at least 8 characters"
}

// For numbers
type Product struct {
  Price int `validate:"min=0"`
  // Message: "must be at least 0"
}

// Generator logic:
if field is string and tag is min:
  return "must be at least {param} characters"
else if field is number and tag is min:
  return "must be at least {param}"
```

---

## Common Validation Scenarios

### Email Validation
**Scenario**: User provides email address

**Validation Rules**:
```
type SignupRequest struct {
  Email string `validate:"required,email"`
}
```

**Error Messages**:
```
Email is empty: "is required"
Email format invalid: "must be a valid email address"
```

---

### Password Validation
**Scenario**: User creates account with password

**Validation Rules**:
```
type CreateUserRequest struct {
  Password string `validate:"required,min=8,max=128"`
}

func (req *CreateUserRequest) Validate() error {
  // Standard length validation
  if err := validator.Struct(req); err != nil {
    return err
  }
  
  // Custom rules
  if !HasNumber(req.Password) {
    return CustomValidationError{
      Field: "password",
      Message: "must contain at least one number"
    }
  }
  
  if !HasSpecialChar(req.Password) {
    return CustomValidationError{
      Field: "password",
      Message: "must contain at least one special character"
    }
  }
  
  return nil
}
```

---

### UUID Validation
**Scenario**: API accepts UUID as path or query parameter

**Standalone Validation**:
```
userID := "550e8400-e29b-41d4-a716-446655440000"

if !IsValidUUID(userID) {
  return errs.NewBadRequestError(
    "Invalid user ID format",
    false,
    nil,
    []errs.FieldError{
      {Field: "user_id", Error: "must be a valid UUID"}
    },
    nil
  )
}
```

**Or in struct**:
```
type GetUserRequest struct {
  UserID string `validate:"required,uuid"`
}
```

---

### List Validation
**Scenario**: API accepts comma-separated UUIDs

**Validation Rules**:
```
type DeleteManyRequest struct {
  IDs string `validate:"required,uuidList"`
}
```

**Custom Processing**:
```
func (req *DeleteManyRequest) Validate() error {
  if err := validator.Struct(req); err != nil {
    return err
  }
  
  ids := strings.Split(req.IDs, ",")
  
  for i, id := range ids {
    if !IsValidUUID(strings.TrimSpace(id)) {
      return CustomValidationError{
        Field: "ids",
        Message: fmt.Sprintf("item %d is not a valid UUID", i+1)
      }
    }
  }
  
  return nil
}
```

---

### Enum/OneOf Validation
**Scenario**: Field must be one of predefined values

**Validation Rules**:
```
type CreateRoleRequest struct {
  Name string `validate:"required,oneof=admin user guest moderator"`
}
```

**Error Message**:
```
Role value is invalid: "must be one of: admin user guest moderator"
```

---

## Best Practices

1. **Fail Fast**: Return on first binding error (don't accumulate)
2. **Standardize Tags**: Use consistent tag names across codebase
3. **Type-Aware Messages**: Different messages for string length vs numeric range
4. **Humanize Field Names**: Convert camelCase to human-readable (use humanize function)
5. **Custom Before Standard**: Run custom Validate() which can call standard validator
6. **Preserve Order**: Return field errors in same order as fields in struct
7. **Use dive for Nested**: Always use `dive` tag for nested object arrays
8. **Lowercase Fields**: Convert field names to lowercase in errors for consistency
9. **Polymorphic Validation**: Use Validatable interface for all request objects
10. **UUID Validation Standalone**: Use IsValidUUID() for path params before binding

---

## Error Response Examples

### Example 1: Binding Error
```json
{
  "code": "BAD_REQUEST",
  "message": "code=400, message=Unmarshal type error: expected=string, got=number",
  "status": 400,
  "override": false,
  "errors": [],
  "action": null
}
```

---

### Example 2: Multiple Field Validation Errors
```json
{
  "code": "BAD_REQUEST",
  "message": "Validation failed",
  "status": 400,
  "override": true,
  "errors": [
    {
      "field": "email",
      "error": "is required"
    },
    {
      "field": "password",
      "error": "must be at least 8 characters"
    },
    {
      "field": "age",
      "error": "must be at least 18"
    }
  ],
  "action": null
}
```

---

### Example 3: Custom Validation Error
```json
{
  "code": "BAD_REQUEST",
  "message": "Validation failed",
  "status": 400,
  "override": true,
  "errors": [
    {
      "field": "password",
      "error": "must not be a common password"
    },
    {
      "field": "confirm_password",
      "error": "passwords do not match"
    }
  ],
  "action": null
}
```

---

### Example 4: Invalid UUID
```json
{
  "code": "BAD_REQUEST",
  "message": "Validation failed",
  "status": 400,
  "override": true,
  "errors": [
    {
      "field": "user_id",
      "error": "must be a valid UUID"
    }
  ],
  "action": null
}
```

---

## Integration Touchpoints

### Where This Component Fits

| Layer | Integration Point | Example |
|-------|-------------------|---------|
| **HTTP Handlers** | Entry point, calls BindAndValidate() | POST /users endpoint validates CreateUserRequest |
| **Request DTOs** | Implement Validatable interface | CreateUserRequest, UpdateOrderRequest |
| **Middleware** | Validation error boundaries | Global error handler converts validation errors |
| **Utility Functions** | IsValidUUID() for path validation | Parse UUID from path param before querying DB |

**Typical Handler Flow**:
```
HTTP Handler
    ↓
var request CreateUserRequest
    ↓
err := BindAndValidate(context, &request)
    ↓
err != nil?
  YES → log error
      → return (error is already HTTPError, serialize to JSON)
  NO ↓
Pass validated request to service layer
    ↓
Service processes request
    ↓
Return result to client
```

---

## Common Implementation Checklist

- [ ] Define Validatable interface with Validate() method
- [ ] Create CustomValidationError struct
- [ ] Create CustomValidationErrors collection type
- [ ] Implement BindAndValidate() function
- [ ] Implement ValidateStructure() function
- [ ] Implement ExtractValidationErrors() function
- [ ] Implement validation message generation for all standard tags
- [ ] Implement IsValidUUID() with regex pattern
- [ ] Handle type-aware message generation (string vs numeric)
- [ ] Add binding error message extraction
- [ ] Create base request DTO with standard Validate()
- [ ] Document all validation tags used in project
- [ ] Add examples for each validation scenario
- [ ] Test nested object validation (dive tag)
- [ ] Test custom validation error handling

---

## Extension Points

### Adding New Validation Tags
To add support for custom validation tag (e.g., "strongPassword"):

```
1. Register with validator library
2. Update GenerateValidationMessage():
   case "strongPassword":
     return "must be a strong password (min 1 uppercase, 1 number, 1 special char)"

3. Use in struct:
   type CreateUserRequest struct {
     Password string `validate:"required,strongPassword"`
   }
```

### Custom Type Validation
To validate custom types (e.g., Phone):

```
type Phone string

func (p Phone) Validate() error {
  if !isValidPhoneFormat(string(p)) {
    return CustomValidationError{
      Field: "phone",
      Message: "must be a valid phone number"
    }
  }
  return nil
}

// In request DTO:
type ContactRequest struct {
  Phone Phone `validate:"required"`
}
```

### Localized Error Messages
To support multiple languages:

```
function GenerateValidationMessage(validErr, locale: string):
  messages := GetMessageMap(locale)
  
  switch validErr.Tag():
    case "required":
      return messages["required"]  // "is required" in English, "est requis" in French
    case "email":
      return messages["email"]
    // ...
```

---

## Summary

The Validation component provides:
- ✅ Request binding and validation in single operation
- ✅ Declarative validation rules via tags
- ✅ Custom validation logic support
- ✅ Field-level error extraction
- ✅ Type-aware error messages
- ✅ Nested object validation
- ✅ UUID format validation
- ✅ Standard HTTP error integration
- ✅ Polymorphic validation interface
- ✅ Comprehensive error reporting

This blueprint enables consistent, user-friendly validation across all endpoints while maintaining clean separation between binding errors and validation failures.