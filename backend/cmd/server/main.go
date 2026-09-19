package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"pulsepoll-backend/config"
	"pulsepoll-backend/controllers"
	"pulsepoll-backend/database"
	"pulsepoll-backend/redis"
	"pulsepoll-backend/repositories"
	"pulsepoll-backend/routes"
	"pulsepoll-backend/services"
	"pulsepoll-backend/websocket"

	"github.com/gin-gonic/gin"
)

func main() {
	log.Println("[INFO] Initializing PulsePoll Server...")

	// 1. Load Configurations
	cfg := config.LoadConfig()
	gin.SetMode(cfg.GinMode)

	// 2. Connect to MongoDB
	mongoDB, err := database.ConnectMongoDB(cfg.MongoURI, cfg.MongoDatabase)
	if err != nil {
		log.Printf("[WARN] MongoDB connection error: %v. Running in degraded mode until database is accessible.", err)
	} else {
		defer mongoDB.Close()
	}

	// 3. Connect to Redis
	redisSvc, err := redis.ConnectRedis(cfg.RedisURL)
	if err != nil {
		log.Printf("[WARN] Redis connection error: %v. Live updates will use fallback local hub.", err)
	} else {
		defer redisSvc.Close()
	}

	// 4. Initialize WebSocket Hub
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	wsHub := websocket.NewHub(redisSvc)
	go wsHub.Run(ctx)

	// 5. Initialize Repositories (Only if MongoDB is connected, or safe dummy)
	var userRepo repositories.UserRepository
	var pollRepo repositories.PollRepository
	var voteRepo repositories.VoteRepository

	if mongoDB != nil {
		userRepo = repositories.NewUserRepository(mongoDB)
		pollRepo = repositories.NewPollRepository(mongoDB)
		voteRepo = repositories.NewVoteRepository(mongoDB)
	} else {
		log.Println("[INFO] Initializing In-Memory Fallback Repositories (Enables full registration, login, and polling while MongoDB Atlas IP whitelist is pending)...")
		userRepo, pollRepo, voteRepo = repositories.NewInMemoryRepositories()
	}

	// 6. Initialize Services
	authService := services.NewAuthService(userRepo, cfg.JWTSecret)
	pollService := services.NewPollService(pollRepo, voteRepo, redisSvc, cfg.FrontendURL)
	voteService := services.NewVoteService(pollRepo, voteRepo, redisSvc, wsHub)
	analyticsService := services.NewAnalyticsService(pollRepo, voteRepo)

	// 7. Initialize Controllers
	authController := controllers.NewAuthController(authService)
	pollController := controllers.NewPollController(pollService)
	voteController := controllers.NewVoteController(voteService, pollService, cfg.JWTSecret)
	analyticsController := controllers.NewAnalyticsController(analyticsService)
	healthController := controllers.NewHealthController(mongoDB, redisSvc)

	// 8. Setup Router
	router := routes.SetupRouter(&routes.RouterDependencies{
		AuthController:      authController,
		PollController:      pollController,
		VoteController:      voteController,
		AnalyticsController: analyticsController,
		HealthController:    healthController,
		WSHub:               wsHub,
		JWTSecret:           cfg.JWTSecret,
		FrontendURL:         cfg.FrontendURL,
	})

	// 9. Start HTTP Server with Graceful Shutdown
	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		log.Printf("[INFO] PulsePoll Server listening on port %s (http://localhost:%s)", cfg.Port, cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("[FATAL] Server listen failed: %v", err)
		}
	}()

	// Graceful shutdown on signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("[INFO] Shutting down PulsePoll Server...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("[FATAL] Server forced to shutdown: %v", err)
	}

	log.Println("[INFO] PulsePoll Server exited cleanly.")
}
