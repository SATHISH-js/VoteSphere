package controllers

import (
	"net/http"

	"pulsepoll-backend/models"
	"pulsepoll-backend/services"
	"pulsepoll-backend/utils"

	"github.com/gin-gonic/gin"
)

type AuthController struct {
	authService services.AuthService
}

func NewAuthController(authService services.AuthService) *AuthController {
	return &AuthController{authService: authService}
}

func (ctl *AuthController) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendBadRequest(c, "Invalid input data", err.Error())
		return
	}

	resp, err := ctl.authService.Register(c.Request.Context(), &req)
	if err != nil {
		utils.SendBadRequest(c, "Registration failed", err.Error())
		return
	}

	utils.SendSuccess(c, http.StatusCreated, "User registered successfully", resp)
}

func (ctl *AuthController) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendBadRequest(c, "Invalid login credentials format", err.Error())
		return
	}

	resp, err := ctl.authService.Login(c.Request.Context(), &req)
	if err != nil {
		utils.SendUnauthorized(c, err.Error())
		return
	}

	utils.SendSuccess(c, http.StatusOK, "Login successful", resp)
}

func (ctl *AuthController) Me(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		utils.SendUnauthorized(c, "User not identified")
		return
	}

	user, err := ctl.authService.GetCurrentUser(c.Request.Context(), userID.(string))
	if err != nil {
		utils.SendNotFound(c, err.Error())
		return
	}

	utils.SendSuccess(c, http.StatusOK, "User profile retrieved", user)
}
