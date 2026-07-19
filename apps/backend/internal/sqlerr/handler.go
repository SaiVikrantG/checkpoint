package sqlerr

import (
	"database/sql"
	"errors"
	"fmt"
	"regexp"
	"strings"

	errs "github.com/SaiVikrantG/checkpoint/internal/errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"golang.org/x/text/cases"
	"golang.org/x/text/language"
)

// ErrCode reports the error code for a given error.
// If the error is nil or is not of type *Error it reports sqlerr.Other.
func ErrCode(err error) Code {
	var pgerr *Error
	if errors.As(err, &pgerr) {
		return pgerr.Code
	}
	return Other
}

// ConvertPgError converts a pgconn.PgError to our custom Error type
func ConvertPgError(src *pgconn.PgError) *Error {
	return &Error{
		Code:           MapCode(src.Code),
		Severity:       MapSeverity(src.Severity),
		DatabaseCode:   src.Code,
		Message:        src.Message,
		SchemaName:     src.SchemaName,
		TableName:      src.TableName,
		ColumnName:     src.ColumnName,
		DataTypeName:   src.DataTypeName,
		ConstraintName: src.ConstraintName,
		driverErr:      src,
	}
}

// BuildErrorCode formats a stable, machine-readable error code from an entity name and an action.
func BuildErrorCode(entityName, action string) string {
	if entityName == "" {
		entityName = "RECORD"
	}

	domain := strings.ToUpper(entityName)
	// Singularize the entity name
	if strings.HasSuffix(domain, "S") && len(domain) > 1 {
		domain = domain[:len(domain)-1]
	}

	return fmt.Sprintf("%s_%s", domain, action)
}

// NotFoundCode returns the stable error code for a "not found" outcome on the given entity.
func NotFoundCode(entityName string) string {
	return BuildErrorCode(entityName, "NOT_FOUND")
}

// ForbiddenCode returns the stable error code for a "forbidden" outcome on the given entity.
func ForbiddenCode(entityName string) string {
	return BuildErrorCode(entityName, "FORBIDDEN")
}

// generateErrorCode creates a consistent error code for a database constraint violation.
// For ForeignKeyViolation, the code names the referenced entity that is actually missing
// (e.g. PROJECT_NOT_FOUND for a devlog referencing a nonexistent project), not the table
// holding the bad reference.
func generateErrorCode(sqlErr *Error) string {
	switch sqlErr.Code {
	case ForeignKeyViolation:
		if referenced := getEntityNameFromConstraint(sqlErr.ConstraintName); referenced != "" {
			return BuildErrorCode(referenced, "NOT_FOUND")
		}
		return BuildErrorCode(sqlErr.TableName, "NOT_FOUND")
	case UniqueViolation:
		return BuildErrorCode(sqlErr.TableName, "ALREADY_EXISTS")
	case NotNullViolation:
		return BuildErrorCode(sqlErr.TableName, "REQUIRED")
	case CheckViolation:
		return BuildErrorCode(sqlErr.TableName, "INVALID")
	default:
		return BuildErrorCode(sqlErr.TableName, "ERROR")
	}
}

// formatUserFriendlyMessage generates a user-friendly error message
func formatUserFriendlyMessage(sqlErr *Error) string {
	entityName := getEntityName(sqlErr.TableName, sqlErr.ColumnName)

	switch sqlErr.Code {
	case ForeignKeyViolation:
		if name := getEntityNameFromConstraint(sqlErr.ConstraintName); name != "" {
			entityName = name
		}
		return fmt.Sprintf("The referenced %s does not exist", entityName)
	case UniqueViolation:
		return fmt.Sprintf("A %s with this identifier already exists", entityName)
	case NotNullViolation:
		fieldName := humanizeText(sqlErr.ColumnName)
		if fieldName == "" {
			fieldName = "field"
		}
		return fmt.Sprintf("The %s is required", fieldName)
	case CheckViolation:
		fieldName := humanizeText(sqlErr.ColumnName)
		if fieldName != "" {
			return fmt.Sprintf("The %s value does not meet required conditions", fieldName)
		}
		return "One or more values do not meet required conditions"
	default:
		return "An error occurred while processing your request"
	}
}

// getEntityName extracts entity name from database information with consistent rules
func getEntityName(tableName, columnName string) string {
	// First priority: column name (e.g. "project_id" → "project")
	if columnName != "" && strings.HasSuffix(strings.ToLower(columnName), "_id") {
		return humanizeText(strings.TrimSuffix(strings.ToLower(columnName), "_id"))
	}

	// Fall back to the table name (e.g. "devlogs" → "devlog")
	if tableName != "" {
		return humanizeText(strings.ToLower(strings.TrimSuffix(tableName, "s")))
	}
	return "record"
}

func getEntityNameFromConstraint(constraintName string) string {
	if constraintName == "" {
		return ""
	}
	// Strip _fkey suffix, then find the _id segment
	name := strings.TrimSuffix(strings.ToLower(constraintName), "_fkey")
	if idx := strings.LastIndex(name, "_id"); idx > 0 {
		// extract the word before _id
		prefix := name[:idx]
		if last := strings.LastIndex(prefix, "_"); last >= 0 {
			return humanizeText(prefix[last+1:])
		}
		return humanizeText(prefix)
	}
	return ""
}

// humanizeText converts snake_case to human-readable text
func humanizeText(text string) string {
	if text == "" {
		return ""
	}
	return cases.Title(language.English).String(strings.ReplaceAll(text, "_", " "))
}

// extractColumnForUniqueViolation gets field name from unique constraint
func extractColumnForUniqueViolation(constraintName string) string {
	if constraintName == "" {
		return ""
	}

	// Try standard naming convention first (unique_table_column)
	if strings.HasPrefix(constraintName, "unique_") {
		parts := strings.Split(constraintName, "_")
		if len(parts) >= 3 {
			return parts[len(parts)-1]
		}
	}

	// Try alternate convention (table_column_key)
	re := regexp.MustCompile(`_([^_]+)_(?:key|ukey)$`)
	matches := re.FindStringSubmatch(constraintName)
	if len(matches) > 1 {
		return matches[1]
	}

	return ""
}

// HandleError processes a database error into an appropriate application error
func HandleError(err error) error {
	// If it's already a custom HTTP error, just return it
	var httpErr *errs.HTTPError
	if errors.As(err, &httpErr) {
		return err
	}

	// Handle pgx specific errors
	var pgerr *pgconn.PgError
	if errors.As(err, &pgerr) {
		sqlErr := ConvertPgError(pgerr)

		// Generate an appropriate error code and message
		errorCode := generateErrorCode(sqlErr)
		userMessage := formatUserFriendlyMessage(sqlErr)

		switch sqlErr.Code {
		case ForeignKeyViolation:
			httpErr := errs.NewBadRequestError(userMessage, false, nil, nil)
			httpErr.Code = errorCode
			return httpErr

		case UniqueViolation:
			columnName := extractColumnForUniqueViolation(sqlErr.ConstraintName)
			if columnName != "" {
				userMessage = strings.ReplaceAll(userMessage, "identifier", humanizeText(columnName))
			}
			httpErr := errs.NewBadRequestError(userMessage, true, nil, nil)
			httpErr.Code = errorCode
			return httpErr

		case NotNullViolation:
			fieldErrors := []errs.FieldError{
				{
					Field: strings.ToLower(sqlErr.ColumnName),
					Error: "is required",
				},
			}
			httpErr := errs.NewBadRequestError(userMessage, true, fieldErrors, nil)
			httpErr.Code = errorCode
			return httpErr

		case CheckViolation:
			httpErr := errs.NewBadRequestError(userMessage, true, nil, nil)
			httpErr.Code = errorCode
			return httpErr

		default:
			return errs.NewInternalServerError()
		}
	}

	// Handle common pgx errors
	switch {
	case errors.Is(err, pgx.ErrNoRows), errors.Is(err, sql.ErrNoRows):
		errMsg := err.Error()
		tablePrefix := "table:"
		if strings.Contains(errMsg, tablePrefix) {
			table := strings.Split(strings.Split(errMsg, tablePrefix)[1], ":")[0]
			entityName := getEntityName(table, "")
			httpErr := errs.NewNotFoundError(fmt.Sprintf("%s not found", entityName), true)
			httpErr.Code = NotFoundCode(table)
			return httpErr
		}
		return errs.NewNotFoundError("Resource not found", false)
	}

	return errs.NewInternalServerError()
}
