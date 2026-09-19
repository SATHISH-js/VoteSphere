package redis

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"pulsepoll-backend/models"

	"github.com/redis/go-redis/v9"
)

func ChannelPollUpdates(pollID string) string {
	return fmt.Sprintf("poll:%s:updates", pollID)
}

func (r *RedisService) PublishPollUpdate(ctx context.Context, pollID string, payload *models.PollResultsResponse) error {
	channel := ChannelPollUpdates(pollID)
	data, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	err = r.Client.Publish(ctx, channel, string(data)).Err()
	if err != nil {
		log.Printf("[WARN] Failed to publish update to Redis channel %s: %v", channel, err)
		return err
	}

	return nil
}

func (r *RedisService) SubscribePollUpdates(ctx context.Context, pollID string) *redis.PubSub {
	channel := ChannelPollUpdates(pollID)
	return r.Client.Subscribe(ctx, channel)
}

func (r *RedisService) SubscribePattern(ctx context.Context, pattern string) *redis.PubSub {
	return r.Client.PSubscribe(ctx, pattern)
}
