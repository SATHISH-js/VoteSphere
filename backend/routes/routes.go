package routes

import (
	"strings"
	"time"

	"pulsepoll-backend/controllers"
	"pulsepoll-backend/middleware"
	"pulsepoll-backend/websocket"

	"github.com/gin-gonic/gin"
)

type RouterDependencies struct {
	AuthController      *controllers.AuthController
	PollController      *controllers.PollController
	VoteController      *controllers.VoteController
	AnalyticsController *controllers.AnalyticsController
	HealthController    *controllers.HealthController
	WSHub               *websocket.Hub
	JWTSecret           string
	FrontendURL         string
}

func SetupRouter(deps *RouterDependencies) *gin.Engine {
	r := gin.New()

	// Global Middlewares
	r.Use(gin.Logger())
	r.Use(middleware.ErrorHandlerMiddleware())
	r.Use(middleware.CORSMiddleware(deps.FrontendURL))

	// URL Path Normalizer Middleware
	// Fixes double slashes '//', duplicate '/api/api', and routes called without '/api'
	r.Use(func(c *gin.Context) {
		p := c.Request.URL.Path
		for strings.Contains(p, "//") {
			p = strings.ReplaceAll(p, "//", "/")
		}
		if strings.HasPrefix(p, "/api/api/") {
			p = strings.TrimPrefix(p, "/api")
		}
		if strings.HasPrefix(p, "/auth/") || strings.HasPrefix(p, "/public/") || strings.HasPrefix(p, "/polls") {
			p = "/api" + p
		}
		if p == "/health" {
			p = "/api/health"
		}
		c.Request.URL.Path = p
		c.Next()
	})

	// Rate limiters for auth and voting
	authRateLimiter := middleware.NewIPRateLimiter(20, 1*time.Minute)
	voteRateLimiter := middleware.NewIPRateLimiter(60, 1*time.Minute)

	// Health Check
	r.GET("/api/health", deps.HealthController.HealthCheck)

	// WebSocket Endpoint
	r.GET("/ws/polls/:id", func(c *gin.Context) {
		pollID := c.Param("id")
		deps.WSHub.ServeWS(c.Writer, c.Request, pollID)
	})

	api := r.Group("/api")
	{
		// AUTH ROUTES
		auth := api.Group("/auth")
		{
			auth.POST("/register", authRateLimiter.Middleware(), deps.AuthController.Register)
			auth.POST("/login", authRateLimiter.Middleware(), deps.AuthController.Login)
			auth.GET("/me", middleware.AuthMiddleware(deps.JWTSecret), deps.AuthController.Me)
		}

		// PUBLIC POLL & VOTING ROUTES (No login required)
		public := api.Group("/public")
		{
			public.GET("/polls/:id", deps.VoteController.GetPublicPoll)
			public.POST("/polls/:id/vote", voteRateLimiter.Middleware(), deps.VoteController.CastVote)
			public.GET("/polls/:id/results", deps.VoteController.GetResults)
		}

		// PROTECTED POLL MANAGEMENT ROUTES (Requires login)
		polls := api.Group("/polls", middleware.AuthMiddleware(deps.JWTSecret))
		{
			polls.GET("/stats", deps.PollController.GetDashboardStats)
			polls.POST("", deps.PollController.CreatePoll)
			polls.GET("", deps.PollController.GetUserPolls)
			polls.GET("/:id", deps.PollController.GetPoll)
			polls.POST("/:id/close", deps.PollController.ClosePoll)
			polls.DELETE("/:id", deps.PollController.DeletePoll)
			polls.GET("/:id/results", deps.VoteController.GetResults)
			polls.GET("/:id/analytics", deps.AnalyticsController.GetAnalytics)
		}
	}

	return r
}
