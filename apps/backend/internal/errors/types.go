package errors

// represents validation errors at the field/input level
type FieldError struct {
	Field string `json:"field"`
	Error string `json:"error"`
}

// represents a recommended action for the client to take in response to an error
type ActionType string

type Action struct {
	Type    ActionType `json:"type"`
	Message string     `json:"msg"`
	Value   string     `json:"value"`
}

// error container that wraps all information for an HTTP error
type HTTPError struct {
	Code     string       `json:"code"`
	Message  string       `json:"message"`
	Status   int          `json:"status_code"`
	Override bool         `json:"override"`
	Errors   []FieldError `json:"errors"`
	Actn     *Action      `json:"action"`
}

func (e *HTTPError) Error() string {
	return e.Message
}
