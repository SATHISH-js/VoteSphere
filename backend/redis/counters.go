package redis

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"pulsepoll-backend/models"
)

// Redis Key Helpers
func KeyPollTotalVotes(pollID string) string {
	return fmt.Sprintf("poll:%s:total_votes", pollID)
}

func KeyPollOptionVotes(pollID, optionID string) string {
	return fmt.Sprintf("poll:%s:votes:%s", pollID, optionID)
}

func KeyPollVoters(pollID string) string {
	return fmt.Sprintf("poll:%s:voters", pollID)
}

func KeyPollActiveUsers(pollID string) string {
	return fmt.Sprintf("poll:%s:active_users", pollID)
}

// InitializePollCounters ensures Redis keys exist for options
func (r *RedisService) InitializePollCounters(ctx context.Context, pollID string, options []models.PollOption) error {
	pipe := r.Client.Pipeline()
	totalKey := KeyPollTotalVotes(pollID)
	pipe.SetNX(ctx, totalKey, 0, 0)

	for _, opt := range options {
		optKey := KeyPollOptionVotes(pollID, opt.ID)
		pipe.SetNX(ctx, optKey, 0, 0)
	}

	_, err := pipe.Exec(ctx)
	return err
}

// IncrementVote atomic update to option and total
func (r *RedisService) IncrementVote(ctx context.Context, pollID, optionID string) (int64, int64, error) {
	optKey := KeyPollOptionVotes(pollID, optionID)
	totalKey := KeyPollTotalVotes(pollID)

	pipe := r.Client.Pipeline()
	optCmd := pipe.Incr(ctx, optKey)
	totalCmd := pipe.Incr(ctx, totalKey)

	_, err := pipe.Exec(ctx)
	if err != nil {
		return 0, 0, err
	}

	return optCmd.Val(), totalCmd.Val(), nil
}

// RecordVoterHash saves the voter hash to a Redis set and returns true if new, false if duplicate
func (r *RedisService) RecordVoterHash(ctx context.Context, pollID, voterHash string) (bool, error) {
	key := KeyPollVoters(pollID)
	added, err := r.Client.SAdd(ctx, key, voterHash).Result()
	if err != nil {
		return false, err
	}
	return added > 0, nil
}

// HasVoted checks if voter hash already voted
func (r *RedisService) HasVoted(ctx context.Context, pollID, voterHash string) (bool, error) {
	key := KeyPollVoters(pollID)
	return r.Client.SIsMember(ctx, key, voterHash).Result()
}

// GetPollResultsFromRedis retrieves high-speed tallies directly from Redis
func (r *RedisService) GetPollResultsFromRedis(ctx context.Context, poll *models.Poll) (*models.PollResultsResponse, error) {
	pollID := poll.ID.Hex()
	pipe := r.Client.Pipeline()

	totalCmd := pipe.Get(ctx, KeyPollTotalVotes(pollID))
	optCmds := make(map[string]interface{})

	for _, opt := range poll.Options {
		optCmds[opt.ID] = pipe.Get(ctx, KeyPollOptionVotes(pollID, opt.ID))
	}

	// Also fetch active viewers
	viewersCmd := pipe.SCard(ctx, KeyPollActiveUsers(pollID))

	_, _ = pipe.Exec(ctx) // Non-fatal if keys don't exist yet

	var totalVotes int64 = 0
	if totalStr, err := totalCmd.Result(); err == nil {
		totalVotes, _ = strconv.ParseInt(totalStr, 10, 64)
	}

	var activeViewers int64 = 0
	if viewers, err := viewersCmd.Result(); err == nil {
		activeViewers = viewers
	}

	results := make([]models.OptionResult, 0, len(poll.Options))
	for _, opt := range poll.Options {
		var votes int64 = 0
		if cmd, ok := optCmds[opt.ID].(interface{ Result() (string, error) }); ok {
			if val, err := cmd.Result(); err == nil {
				votes, _ = strconv.ParseInt(val, 10, 64)
			}
		}

		var percentage float64 = 0
		if totalVotes > 0 {
			percentage = (float64(votes) / float64(totalVotes)) * 100.0
			// Round to 1 decimal place
			percentage = float64(int(percentage*10+0.5)) / 10.0
		}

		results = append(results, models.OptionResult{
			OptionID:   opt.ID,
			OptionText: opt.Text,
			Votes:      votes,
			Percentage: percentage,
		})
	}

	return &models.PollResultsResponse{
		PollID:        pollID,
		Question:      poll.Question,
		Status:        poll.Status,
		Results:       results,
		TotalVotes:    totalVotes,
		ActiveViewers: activeViewers,
		LastUpdated:   time.Now(),
	}, nil
}

// Viewer Presence Management
func (r *RedisService) AddActiveViewer(ctx context.Context, pollID, clientID string) (int64, error) {
	key := KeyPollActiveUsers(pollID)
	r.Client.SAdd(ctx, key, clientID)
	r.Client.Expire(ctx, key, 2*time.Hour)
	return r.Client.SCard(ctx, key).Result()
}

func (r *RedisService) RemoveActiveViewer(ctx context.Context, pollID, clientID string) (int64, error) {
	key := KeyPollActiveUsers(pollID)
	r.Client.SRem(ctx, key, clientID)
	return r.Client.SCard(ctx, key).Result()
}
