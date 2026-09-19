package controllers

import (
	"net/http"

	"pulsepoll-backend/services"
	"pulsepoll-backend/utils"

	"github.com/gin-gonic/gin"
)

type AnalyticsController struct {
	analyticsService services.AnalyticsService
}

func NewAnalyticsController(analyticsService services.AnalyticsService) *AnalyticsController {
	return &AnalyticsController{analyticsService: analyticsService}
}

func (ctl *AnalyticsController) GetAnalytics(c *gin.Context) {
	pollID := c.Param("id")

	analytics, err := ctl.analyticsService.GetPollAnalytics(c.Request.Context(), pollID)
	if err != nil {
		utils.SendNotFound(c, "Poll analytics not found")
		return
	}

	utils.SendSuccess(c, http.StatusOK, "Analytics retrieved", analytics)
}
