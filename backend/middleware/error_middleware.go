package middleware

import (
	"log"
	"net/http"
	"pulsepoll-backend/models"

	"github.com/gin-gonic/gin"
)

func ErrorHandlerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("[PANIC RECOVERED] %v", err)
				c.JSON(http.StatusInternalServerError, models.ErrorResponse(
					"Internal server error occurred",
					"Something went wrong on our end. Please try again.",
				))
				c.Abort()
			}
		}()
		c.Next()
	}
}
