package redis

import (
	"context"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

type RedisService struct {
	Client *redis.Client
}

func ConnectRedis(redisURL string) (*RedisService, error) {
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Printf("[WARN] Failed to parse Redis URL (%s): %v. Attempting default localhost:6379", redisURL, err)
		opts = &redis.Options{
			Addr: "localhost:6379",
		}
	}

	client := redis.NewClient(opts)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		log.Printf("[WARN] Redis ping failed: %v. Check if Redis server is running.", err)
		return &RedisService{Client: client}, err
	}

	log.Println("[INFO] Connected successfully to Redis.")
	return &RedisService{Client: client}, nil
}

func (r *RedisService) Close() {
	if r.Client != nil {
		_ = r.Client.Close()
		log.Println("[INFO] Redis connection closed.")
	}
}
