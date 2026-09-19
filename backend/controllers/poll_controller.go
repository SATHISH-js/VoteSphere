package controllers

import (
	"net/http"

	"pulsepoll-backend/models"
	"pulsepoll-backend/services"
	"pulsepoll-backend/utils"

	"github.com/gin-gonic/gin"
)

type PollController struct {
	pollService services.PollService
}

func NewPollController(pollService services.PollService) *PollController {
	return &PollController{pollService: pollService}
}

func (ctl *PollController) CreatePoll(c *gin.Context) {
	userID, _ := c.Get("userID")

	var req models.CreatePollRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendBadRequest(c, "Invalid poll payload", err.Error())
		return
	}

	poll, err := ctl.pollService.CreatePoll(c.Request.Context(), userID.(string), &req)
	if err != nil {
		utils.SendBadRequest(c, "Failed to create poll", err.Error())
		return
	}

	utils.SendSuccess(c, http.StatusCreated, "Poll created successfully", poll)
}

func (ctl *PollController) GetUserPolls(c *gin.Context) {
	userID, _ := c.Get("userID")

	polls, err := ctl.pollService.GetUserPolls(c.Request.Context(), userID.(string))
	if err != nil {
		utils.SendInternalError(c, "Failed to retrieve polls")
		return
	}

	utils.SendSuccess(c, http.StatusOK, "User polls retrieved", polls)
}

func (ctl *PollController) GetPoll(c *gin.Context) {
	idOrSlug := c.Param("id")

	poll, err := ctl.pollService.GetPollByIDOrSlug(c.Request.Context(), idOrSlug)
	if err != nil {
		utils.SendNotFound(c, "Poll not found")
		return
	}

	utils.SendSuccess(c, http.StatusOK, "Poll retrieved", poll)
}

func (ctl *PollController) ClosePoll(c *gin.Context) {
	userID, _ := c.Get("userID")
	pollID := c.Param("id")

	err := ctl.pollService.ClosePoll(c.Request.Context(), pollID, userID.(string))
	if err != nil {
		utils.SendBadRequest(c, "Failed to close poll", err.Error())
		return
	}

	utils.SendSuccess(c, http.StatusOK, "Poll closed successfully", gin.H{"status": "closed"})
}

func (ctl *PollController) DeletePoll(c *gin.Context) {
	userID, _ := c.Get("userID")
	pollID := c.Param("id")

	err := ctl.pollService.DeletePoll(c.Request.Context(), pollID, userID.(string))
	if err != nil {
		utils.SendBadRequest(c, "Failed to delete poll", err.Error())
		return
	}

	utils.SendSuccess(c, http.StatusOK, "Poll deleted successfully", nil)
}

func (ctl *PollController) GetDashboardStats(c *gin.Context) {
	userID, _ := c.Get("userID")

	stats, err := ctl.pollService.GetDashboardStats(c.Request.Context(), userID.(string))
	if err != nil {
		utils.SendInternalError(c, "Failed to retrieve dashboard statistics")
		return
	}

	utils.SendSuccess(c, http.StatusOK, "Dashboard statistics retrieved", stats)
}
