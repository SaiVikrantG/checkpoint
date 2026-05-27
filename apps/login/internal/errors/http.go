package errors

import "net/http"

func NewUnauthorizedError(message string, override bool) *HTTPError {
	return &HTTPError{
		Code:     http.StatusText(http.StatusUnauthorized),
		Message:  message,
		Override: override,
		Status:   http.StatusUnauthorized,
	}
}

func NewForbiddenError(message string, override bool) *HTTPError {
	return &HTTPError{
		Code:     http.StatusText(http.StatusForbidden),
		Message:  message,
		Override: override,
		Status:   http.StatusForbidden,
	}
}

func NewBadRequestError(message string, override bool, errors []FieldError, action *Action) *HTTPError {
	return &HTTPError{
		Code:     http.StatusText(http.StatusBadRequest),
		Message:  message,
		Override: override,
		Errors:   errors,
		Actn:     action,
		Status:   http.StatusBadRequest,
	}
}

func NewNotFoundError(message string, override bool) *HTTPError {
	return &HTTPError{
		Code:     http.StatusText(http.StatusNotFound),
		Message:  message,
		Override: override,
		Status:   http.StatusNotFound,
	}
}

func NewInternalServerError() *HTTPError {
	return &HTTPError{
		Code:     http.StatusText(http.StatusInternalServerError),
		Message:  http.StatusText(http.StatusInternalServerError),
		Override: false,
		Status:   http.StatusInternalServerError,
	}
}

func ValidationError(err error) *HTTPError {
	return NewBadRequestError("Validation failed: "+err.Error(), false, nil, nil)
}
