package utils

import (
	"log"
	"net/http"
	"strings"
	"time"
)

// StartKeepAliveWorker starts a background ticker that periodically pings
// the public backend URL to prevent free hosting platforms (such as Render)
// from spinning down due to 15 minutes of inactivity.
func StartKeepAliveWorker(baseURL string, interval time.Duration) {
	if strings.TrimSpace(baseURL) == "" {
		return
	}

	cleanURL := strings.TrimRight(baseURL, "/")
	healthURL := cleanURL + "/api/health"

	log.Printf("[INFO] Keep-Alive Worker active. Pinging %s every %v to maintain continuous 24/7 uptime.", healthURL, interval)

	go func() {
		client := &http.Client{
			Timeout: 20 * time.Second,
		}

		// Initial warm-up ping after 1 minute
		time.Sleep(1 * time.Minute)
		sendPing(client, healthURL)

		ticker := time.NewTicker(interval)
		defer ticker.Stop()

		for range ticker.C {
			sendPing(client, healthURL)
		}
	}()
}

func sendPing(client *http.Client, healthURL string) {
	req, err := http.NewRequest("GET", healthURL, nil)
	if err != nil {
		log.Printf("[WARN] Keep-alive request build failed: %v", err)
		return
	}
	req.Header.Set("User-Agent", "VoteSphere-KeepAlive/1.0")

	resp, err := client.Do(req)
	if err != nil {
		log.Printf("[WARN] Keep-alive ping failed: %v", err)
		return
	}
	defer resp.Body.Close()

	log.Printf("[INFO] Keep-alive ping to %s succeeded (HTTP %d). Inactivity timer reset.", healthURL, resp.StatusCode)
}
