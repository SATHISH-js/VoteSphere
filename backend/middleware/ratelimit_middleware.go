package middleware

import (
	"net/http"
	"sync"
	"time"

	"pulsepoll-backend/models"

	"github.com/gin-gonic/gin"
)

type rateLimiterEntry struct {
	count       int
	windowStart time.Time
}

type IPRateLimiter struct {
	mu      sync.Mutex
	entries map[string]*rateLimiterEntry
	limit   int
	window  time.Duration
}

func NewIPRateLimiter(limit int, window time.Duration) *IPRateLimiter {
	rl := &IPRateLimiter{
		entries: make(map[string]*rateLimiterEntry),
		limit:   limit,
		window:  window,
	}

	// Periodic cleanup of expired entries
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		for range ticker.C {
			rl.mu.Lock()
			now := time.Now()
			for ip, entry := range rl.entries {
				if now.Sub(entry.windowStart) > rl.window*2 {
					delete(rl.entries, ip)
				}
			}
			rl.mu.Unlock()
		}
	}()

	return rl
}

func (rl *IPRateLimiter) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		clientIP := c.ClientIP()
		now := time.Now()

		rl.mu.Lock()
		entry, exists := rl.entries[clientIP]
		if !exists || now.Sub(entry.windowStart) > rl.window {
			rl.entries[clientIP] = &rateLimiterEntry{
				count:       1,
				windowStart: now,
			}
			rl.mu.Unlock()
			c.Next()
			return
		}

		if entry.count >= rl.limit {
			rl.mu.Unlock()
			c.JSON(http.StatusTooManyRequests, models.ErrorResponse(
				"Too many requests",
				"Rate limit exceeded. Please wait a moment before trying again.",
			))
			c.Abort()
			return
		}

		entry.count++
		rl.mu.Unlock()
		c.Next()
	}
}
