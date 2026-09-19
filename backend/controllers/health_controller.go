package controllers

import (
	"context"
	"net/http"
	"time"

	"pulsepoll-backend/database"
	"pulsepoll-backend/redis"
	"pulsepoll-backend/utils"

	"github.com/gin-gonic/gin"
)

type HealthController struct {
	mongoDB  *database.MongoDB
	redisSvc *redis.RedisService
}

func NewHealthController(mongoDB *database.MongoDB, redisSvc *redis.RedisService) *HealthController {
	return &HealthController{
		mongoDB:  mongoDB,
		redisSvc: redisSvc,
	}
}

func (ctl *HealthController) HealthCheck(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
	defer cancel()

	mongoStatus := "disconnected"
	if ctl.mongoDB != nil && ctl.mongoDB.Client != nil {
		if err := ctl.mongoDB.Client.Ping(ctx, nil); err == nil {
			mongoStatus = "connected"
		}
	}

	redisStatus := "disconnected"
	if ctl.redisSvc != nil && ctl.redisSvc.Client != nil {
		if err := ctl.redisSvc.Client.Ping(ctx).Err(); err == nil {
			redisStatus = "connected"
		}
	}

	allHealthy := mongoStatus == "connected" && (redisStatus == "connected" || ctl.redisSvc == nil)

	statusMsg := "System is operational"
	if !allHealthy {
		statusMsg = "System is degraded"
	}

	statusCode := http.StatusOK
	if mongoStatus != "connected" {
		statusCode = http.StatusServiceUnavailable
	}

	utils.SendSuccess(c, statusCode, statusMsg, gin.H{
		"status":      "ok",
		"service":     "VoteSphere Live Polling Backend",
		"mongodb":     mongoStatus,
		"redis":       redisStatus,
		"environment": gin.Mode(),
		"timestamp":   time.Now().Format(time.RFC3339),
	})
}
