package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port          string
	MongoURI      string
	MongoDatabase string
	RedisURL      string
	JWTSecret     string
	FrontendURL   string
	GinMode       string
	KeepAliveURL  string
}

func LoadConfig() *Config {
	// Try loading from .env file in current dir or parent dir
	if err := godotenv.Load(".env"); err != nil {
		if err := godotenv.Load("../.env"); err != nil {
			log.Println("[INFO] No .env file found, falling back to system environment variables")
		} else {
			log.Println("[INFO] Loaded environment variables from ../.env")
		}
	} else {
		log.Println("[INFO] Loaded environment variables from .env")
	}

	cfg := &Config{
		Port:          getEnv("PORT", "8080"),
		MongoURI:      getEnv("MONGO_URI", "mongodb://localhost:27017"),
		MongoDatabase: getEnv("MONGO_DATABASE", "pulsepoll"),
		RedisURL:      getEnv("REDIS_URL", "redis://localhost:6379"),
		JWTSecret:     getEnv("JWT_SECRET", "pulsepoll-production-secret-key-change-in-prod-32bytes"),
		FrontendURL:   getEnv("FRONTEND_URL", "http://localhost:5173"),
		GinMode:       getEnv("GIN_MODE", "debug"),
		KeepAliveURL:  getEnv("RENDER_EXTERNAL_URL", getEnv("KEEP_ALIVE_URL", getEnv("SELF_URL", ""))),
	}

	return cfg
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
