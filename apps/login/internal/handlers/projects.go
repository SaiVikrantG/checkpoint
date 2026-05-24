package handlers

import (
	"strconv"

	"github.com/SaiVikrantG/checkpoint/internal/server"
	"github.com/SaiVikrantG/checkpoint/internal/service"
	"github.com/labstack/echo/v4"
)

type ProjectHandler struct {
	server          *server.Server
	projectServices *service.ProjectService
}

func NewProjectHandler(server *server.Server, services *service.ProjectService) *ProjectHandler {
	return &ProjectHandler{
		server:          server,
		projectServices: services,
	}
}

func (h *ProjectHandler) GetProjectByID(c echo.Context) error {
	projectID := c.Param("id") // Get from URL

	// Convert to int64
	id, err := strconv.ParseInt(projectID, 10, 64)
	if err != nil {
		return echo.NewHTTPError(400, "invalid project id")
	}

	// Call service
	project, err := h.projectServices.GetProjectByID(c.Request().Context(), id)
	if err != nil {
		return err // Global error handler catches it
	}

	// Return response
	return c.JSON(200, project)
}
