package utils

import (
	"net/http"
	"pulsepoll-backend/models"

	"github.com/gin-gonic/gin"
)

func SendSuccess(c *gin.Context, statusCode int, message string, data interface{}) {
	c.JSON(statusCode, models.SuccessResponse(message, data))
}

func SendError(c *gin.Context, statusCode int, message string, errDetail string) {
	c.JSON(statusCode, models.ErrorResponse(message, errDetail))
}

func SendBadRequest(c *gin.Context, message string, errDetail string) {
	SendError(c, http.StatusBadRequest, message, errDetail)
}

func SendUnauthorized(c *gin.Context, message string) {
	SendError(c, http.StatusUnauthorized, message, "Authentication required or credentials invalid")
}

func SendNotFound(c *gin.Context, message string) {
	SendError(c, http.StatusNotFound, message, "The requested resource was not found")
}

func SendInternalError(c *gin.Context, message string) {
	SendError(c, http.StatusInternalServerError, message, "An unexpected server error occurred")
}
