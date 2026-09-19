package services

import (
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	"pulsepoll-backend/models"
	"pulsepoll-backend/redis"
	"pulsepoll-backend/repositories"
	"pulsepoll-backend/websocket"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type VoteService interface {
	CastVote(ctx context.Context, pollIDOrSlug string, req *models.CastVoteRequest, clientIP string) (*models.PollResultsResponse, error)
	GetPollResults(ctx context.Context, pollIDOrSlug string) (*models.PollResultsResponse, error)
}

type voteService struct {
	pollRepo repositories.PollRepository
	voteRepo repositories.VoteRepository
	redisSvc *redis.RedisService
	wsHub    *websocket.Hub
}

func NewVoteService(
	pollRepo repositories.PollRepository,
	voteRepo repositories.VoteRepository,
	redisSvc *redis.RedisService,
	wsHub *websocket.Hub,
) VoteService {
	return &voteService{
		pollRepo: pollRepo,
		voteRepo: voteRepo,
		redisSvc: redisSvc,
		wsHub:    wsHub,
	}
}

func (s *voteService) CastVote(ctx context.Context, pollIDOrSlug string, req *models.CastVoteRequest, clientIP string) (*models.PollResultsResponse, error) {
	// 1. Fetch Poll
	poll, err := s.pollRepo.FindByIDOrSlug(ctx, pollIDOrSlug)
	if err != nil || poll == nil {
		return nil, errors.New("poll not found")
	}

	// 2. Verify Poll is Active & Not Expired
	if poll.Status != "active" {
		return nil, errors.New("this poll is closed and no longer accepting votes")
	}
	if poll.ExpiresAt != nil && time.Now().After(*poll.ExpiresAt) {
		poll.Status = "closed"
		_ = s.pollRepo.UpdateStatus(ctx, poll.ID, "closed")
		return nil, errors.New("this poll has expired and is no longer accepting votes")
	}

	// 3. Validate Options
	validOptionIDs := make(map[string]bool)
	for _, opt := range poll.Options {
		validOptionIDs[opt.ID] = true
	}

	if len(req.OptionIDs) == 0 {
		return nil, errors.New("at least one option must be selected")
	}

	if !poll.Settings.MultipleChoice && len(req.OptionIDs) > 1 {
		return nil, errors.New("multiple selections are not allowed for this poll")
	}

	for _, optID := range req.OptionIDs {
		if !validOptionIDs[optID] {
			return nil, fmt.Errorf("invalid option ID: %s", optID)
		}
	}

	pollIDStr := poll.ID.Hex()
	voterHash := req.VoterHash

	// 4. Duplicate Voting Protection based on poll.Settings.VoterProtection
	var existingVote *models.Vote
	var userObjID *primitive.ObjectID

	if poll.Settings.VoterProtection == "require_account" {
		if req.UserID == "" {
			return nil, errors.New("this poll requires a verified account to vote. Please log in to submit your vote")
		}
		uid, err := primitive.ObjectIDFromHex(req.UserID)
		if err != nil {
			return nil, errors.New("invalid user credentials")
		}
		userObjID = &uid
		existingVote, err = s.voteRepo.FindByPollIDAndUserID(ctx, poll.ID, uid)
		if err != nil {
			return nil, errors.New("error checking voting eligibility")
		}
	} else if poll.Settings.VoterProtection == "strict_ip" {
		if clientIP != "" {
			existingVote, err = s.voteRepo.FindByPollIDAndIPHash(ctx, poll.ID, clientIP)
			if err != nil {
				return nil, errors.New("error checking voting eligibility")
			}
		}
		if existingVote == nil {
			existingVote, err = s.voteRepo.FindByPollIDAndVoterHash(ctx, poll.ID, voterHash)
			if err != nil {
				return nil, errors.New("error checking voting eligibility")
			}
		}
	} else {
		// Default: smart_fingerprint (hardware fingerprint + persistent token)
		existingVote, err = s.voteRepo.FindByPollIDAndVoterHash(ctx, poll.ID, voterHash)
		if err != nil {
			return nil, errors.New("error checking voting eligibility")
		}
		// If no match by token, check if client IP already voted
		if existingVote == nil && clientIP != "" && !poll.Settings.AllowVoteChanges {
			ipVote, _ := s.voteRepo.FindByPollIDAndIPHash(ctx, poll.ID, clientIP)
			if ipVote != nil {
				existingVote = ipVote
			}
		}
	}

	isChange := existingVote != nil
	if isChange && !poll.Settings.AllowVoteChanges {
		return nil, errors.New("you have already submitted a vote for this poll")
	}

	// 5. Update/Store in MongoDB
	if isChange {
		existingVote.OptionIDs = req.OptionIDs
		existingVote.UpdatedAt = time.Now()
		if err := s.voteRepo.Update(ctx, existingVote); err != nil {
			return nil, fmt.Errorf("failed to update vote: %w", err)
		}
	} else {
		newVote := &models.Vote{
			PollID:    poll.ID,
			OptionIDs: req.OptionIDs,
			VoterHash: voterHash,
			IPHash:    clientIP,
			UserID:    userObjID,
			CreatedAt: time.Now(),
		}
		if err := s.voteRepo.Create(ctx, newVote); err != nil {
			return nil, fmt.Errorf("failed to record vote: %w", err)
		}
	}

	// 6. Redis Real-Time Counters Execution
	if s.redisSvc != nil && s.redisSvc.Client != nil {
		// Record voter in Redis Set
		_, _ = s.redisSvc.RecordVoterHash(ctx, pollIDStr, voterHash)

		// Increment Redis counters for each selected option
		for _, optID := range req.OptionIDs {
			_, _, _ = s.redisSvc.IncrementVote(ctx, pollIDStr, optID)
		}
	}

	// 7. Calculate Updated Results from Redis (with MongoDB fallback)
	results, err := s.calculateResults(ctx, poll)
	if err != nil {
		return nil, err
	}

	// 8. Publish Live Event to Redis Pub/Sub
	if s.redisSvc != nil && s.redisSvc.Client != nil {
		if err := s.redisSvc.PublishPollUpdate(ctx, pollIDStr, results); err != nil {
			log.Printf("[WARN] Error publishing to Redis channel: %v", err)
		}
	}

	// 9. Also relay directly to local WebSocket Hub
	if s.wsHub != nil {
		s.wsHub.BroadcastLocal(pollIDStr, "poll-results-updated", results)
	}

	return results, nil
}

func (s *voteService) GetPollResults(ctx context.Context, pollIDOrSlug string) (*models.PollResultsResponse, error) {
	poll, err := s.pollRepo.FindByIDOrSlug(ctx, pollIDOrSlug)
	if err != nil || poll == nil {
		return nil, errors.New("poll not found")
	}

	return s.calculateResults(ctx, poll)
}

func (s *voteService) calculateResults(ctx context.Context, poll *models.Poll) (*models.PollResultsResponse, error) {
	// Primary: Retrieve fast counts from Redis
	if s.redisSvc != nil && s.redisSvc.Client != nil {
		results, err := s.redisSvc.GetPollResultsFromRedis(ctx, poll)
		if err == nil && results.TotalVotes > 0 {
			return results, nil
		}
	}

	// Secondary / Fallback: Retrieve aggregated tallies from MongoDB
	counts, err := s.voteRepo.AggregateOptionVotes(ctx, poll.ID)
	if err != nil {
		return nil, err
	}

	var totalVotes int64 = 0
	for _, count := range counts {
		totalVotes += count
	}

	resultsList := make([]models.OptionResult, 0, len(poll.Options))
	for _, opt := range poll.Options {
		votes := counts[opt.ID]
		var percentage float64 = 0
		if totalVotes > 0 {
			percentage = (float64(votes) / float64(totalVotes)) * 100.0
			percentage = float64(int(percentage*10+0.5)) / 10.0
		}
		resultsList = append(resultsList, models.OptionResult{
			OptionID:   opt.ID,
			OptionText: opt.Text,
			Votes:      votes,
			Percentage: percentage,
		})
	}

	return &models.PollResultsResponse{
		PollID:      poll.ID.Hex(),
		Question:    poll.Question,
		Status:      poll.Status,
		Results:     resultsList,
		TotalVotes:  totalVotes,
		LastUpdated: time.Now(),
	}, nil
}
