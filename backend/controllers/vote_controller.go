package controllers

import (
	"net/http"
	"strings"

	"pulsepoll-backend/models"
	"pulsepoll-backend/services"
	"pulsepoll-backend/utils"

	"github.com/gin-gonic/gin"
)

type VoteController struct {
	voteService services.VoteService
	pollService services.PollService
	jwtSecret   string
}

func NewVoteController(voteService services.VoteService, pollService services.PollService, jwtSecret string) *VoteController {
	return &VoteController{
		voteService: voteService,
		pollService: pollService,
		jwtSecret:   jwtSecret,
	}
}

func (ctl *VoteController) GetPublicPoll(c *gin.Context) {
	idOrSlug := c.Param("id")

	poll, err := ctl.pollService.GetPollByIDOrSlug(c.Request.Context(), idOrSlug)
	if err != nil {
		utils.SendNotFound(c, "Poll not found")
		return
	}

	utils.SendSuccess(c, http.StatusOK, "Poll retrieved", poll)
}

func (ctl *VoteController) CastVote(c *gin.Context) {
	idOrSlug := c.Param("id")

	var req models.CastVoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendBadRequest(c, "Invalid voting payload", err.Error())
		return
	}

	// Auto-detect logged-in user from Bearer token if present
	if req.UserID == "" && ctl.jwtSecret != "" {
		authHeader := c.GetHeader("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			tokenString := strings.TrimPrefix(authHeader, "Bearer ")
			claims, err := utils.ValidateToken(tokenString, ctl.jwtSecret)
			if err == nil && claims != nil {
				req.UserID = claims.UserID
			}
		}
	}

	clientIP := c.ClientIP()
	results, err := ctl.voteService.CastVote(c.Request.Context(), idOrSlug, &req, clientIP)
	if err != nil {
		utils.SendBadRequest(c, err.Error(), err.Error())
		return
	}

	utils.SendSuccess(c, http.StatusOK, "Vote submitted successfully", results)
}

func (ctl *VoteController) GetResults(c *gin.Context) {
	idOrSlug := c.Param("id")

	results, err := ctl.voteService.GetPollResults(c.Request.Context(), idOrSlug)
	if err != nil {
		utils.SendNotFound(c, "Results not found")
		return
	}

	utils.SendSuccess(c, http.StatusOK, "Poll results retrieved", results)
}
