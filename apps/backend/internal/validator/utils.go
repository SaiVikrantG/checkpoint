package validator

import (
	"fmt"
	"reflect"
	"strings"

	"github.com/SaiVikrantG/checkpoint/internal/errors"
	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
)

type Validatable interface {
	Validate() error
}

type CustomValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

type CustomValidationErrors []CustomValidationError

func (c CustomValidationErrors) Error() string {
	return "Validation failed"
}

func extractValidationErrors(err error) (string, []errors.FieldError) {
	var fieldErrors []errors.FieldError
	validationErrors, ok := err.(validator.ValidationErrors)
	if !ok {
		customValidationErrors := err.(CustomValidationErrors)
		for _, err := range customValidationErrors {
			fieldErrors = append(fieldErrors, errors.FieldError{
				Field: err.Field,
				Error: err.Message,
			})
		}
	}

	for _, err := range validationErrors {
		field := strings.ToLower(err.Field())
		var msg string

		switch err.Tag() {
		case "required":
			msg = "is required"
		case "min":
			if err.Type().Kind() == reflect.String {
				msg = fmt.Sprintf("must be at least %s characters", err.Param())
			} else {
				msg = fmt.Sprintf("must be at least %s", err.Param())
			}
		case "max":
			if err.Type().Kind() == reflect.String {
				msg = fmt.Sprintf("must not exceed %s characters", err.Param())
			} else {
				msg = fmt.Sprintf("must not exceed %s", err.Param())
			}
		case "oneof":
			msg = fmt.Sprintf("must be one of: %s", err.Param())
		case "email":
			msg = "must be a valid email address"
		case "e164":
			msg = "must be a valid phone number with country code"
		case "uuid":
			msg = "must be a valid UUID"
		case "uuidList":
			msg = "must be a comma-separated list of valid UUIDs"
		case "dive":
			msg = "some items are invalid"
		default:
			if err.Param() != "" {
				msg = fmt.Sprintf("%s: %s:%s", field, err.Tag(), err.Param())
			} else {
				msg = fmt.Sprintf("%s: %s", field, err.Tag())
			}
		}

		fieldErrors = append(fieldErrors, errors.FieldError{
			Field: strings.ToLower(err.Field()),
			Error: msg,
		})
	}

	return "Validation failed", fieldErrors
}

func validateStruct(v Validatable) (string, []errors.FieldError) {
	if err := v.Validate(); err != nil {
		return extractValidationErrors(err)
	}

	return "", nil
}

func BindAndValidate(c echo.Context, payload Validatable) error {
	if err := c.Bind(payload); err != nil {
		//CHECK: Need to format the error message here properly
		return errors.NewBadRequestError(err.Error(), false, nil, nil)
	}

	if msg, fieldErrors := validateStruct(payload); fieldErrors != nil {
		return errors.NewBadRequestError(msg, true, fieldErrors, nil)
	}

	return nil
}
