package services

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"pulsepoll-backend/models"
	"pulsepoll-backend/redis"
	"pulsepoll-backend/repositories"
	"pulsepoll-backend/utils"
	"pulsepoll-backend/validators"

	"github.com/google/uuid"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type PollService interface {
	CreatePoll(ctx context.Context, creatorID string, req *models.CreatePollRequest) (*models.PollResponse, error)
	GetPollByIDOrSlug(ctx context.Context, idOrSlug string) (*models.PollResponse, error)
	GetUserPolls(ctx context.Context, creatorID string) ([]models.PollResponse, error)
	ClosePoll(ctx context.Context, pollID, creatorID string) error
	DeletePoll(ctx context.Context, pollID, creatorID string) error
	GetDashboardStats(ctx context.Context, creatorID string) (map[string]interface{}, error)
}

type pollService struct {
	pollRepo    repositories.PollRepository
	voteRepo    repositories.VoteRepository
	redisSvc    *redis.RedisService
	frontendURL string
}

func NewPollService(
	pollRepo repositories.PollRepository,
	voteRepo repositories.VoteRepository,
	redisSvc *redis.RedisService,
	frontendURL string,
) PollService {
	return &pollService{
		pollRepo:    pollRepo,
		voteRepo:    voteRepo,
		redisSvc:    redisSvc,
		frontendURL: frontendURL,
	}
}

func (s *pollService) CreatePoll(ctx context.Context, creatorID string, req *models.CreatePollRequest) (*models.PollResponse, error) {
	if s.pollRepo == nil {
		return nil, errors.New("database is not connected. Please ensure your MongoDB Atlas password is set in .env")
	}

	if err := validators.ValidateCreatePollRequest(req); err != nil {
		return nil, err
	}

	creatorObjID, err := primitive.ObjectIDFromHex(creatorID)
	if err != nil {
		return nil, errors.New("invalid creator ID")
	}

	expiresAt, err := validators.ParseDuration(req.Duration)
	if err != nil {
		return nil, err
	}

	options := make([]models.PollOption, 0, len(req.Options))
	for _, optText := range req.Options {
		options = append(options, models.PollOption{
			ID:   uuid.New().String()[:8],
			Text: strings.TrimSpace(optText),
		})
	}

	slug := utils.GenerateSecureSlug(8)

	poll := &models.Poll{
		CreatorID: creatorObjID,
		Slug:      slug,
		Question:  strings.TrimSpace(req.Question),
		Options:   options,
		Settings:  req.Settings,
		Status:    "active",
		ExpiresAt: expiresAt,
	}

	if err := s.pollRepo.Create(ctx, poll); err != nil {
		return nil, fmt.Errorf("failed to create poll: %w", err)
	}

	// Initialize Redis counters for high-speed live counting
	if s.redisSvc != nil && s.redisSvc.Client != nil {
		_ = s.redisSvc.InitializePollCounters(ctx, poll.ID.Hex(), options)
	}

	return s.toPollResponse(poll, 0, 0), nil
}

func (s *pollService) GetPollByIDOrSlug(ctx context.Context, idOrSlug string) (*models.PollResponse, error) {
	if s.pollRepo == nil {
		return nil, errors.New("database is not connected. Please ensure your MongoDB Atlas password is set in .env")
	}

	poll, err := s.pollRepo.FindByIDOrSlug(ctx, idOrSlug)
	if err != nil {
		return nil, err
	}
	if poll == nil {
		return nil, errors.New("poll not found")
	}

	// Check if poll has expired
	if poll.Status == "active" && poll.ExpiresAt != nil && time.Now().After(*poll.ExpiresAt) {
		poll.Status = "closed"
		_ = s.pollRepo.UpdateStatus(ctx, poll.ID, "closed")
	}

	var totalVotes int64 = 0
	var activeViewers int64 = 0

	if s.redisSvc != nil && s.redisSvc.Client != nil {
		if res, err := s.redisSvc.GetPollResultsFromRedis(ctx, poll); err == nil {
			totalVotes = res.TotalVotes
			activeViewers = res.ActiveViewers
		}
	} else if s.voteRepo != nil {
		totalVotes, _ = s.voteRepo.CountByPollID(ctx, poll.ID)
	}

	return s.toPollResponse(poll, totalVotes, activeViewers), nil
}

func (s *pollService) GetUserPolls(ctx context.Context, creatorID string) ([]models.PollResponse, error) {
	if s.pollRepo == nil {
		return []models.PollResponse{}, nil
	}

	creatorObjID, err := primitive.ObjectIDFromHex(creatorID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	polls, err := s.pollRepo.FindByCreatorID(ctx, creatorObjID)
	if err != nil {
		return nil, err
	}

	responses := make([]models.PollResponse, 0, len(polls))
	for _, p := range polls {
		var votes int64 = 0
		if s.redisSvc != nil && s.redisSvc.Client != nil {
			if res, err := s.redisSvc.GetPollResultsFromRedis(ctx, &p); err == nil {
				votes = res.TotalVotes
			}
		} else {
			votes, _ = s.voteRepo.CountByPollID(ctx, p.ID)
		}
		responses = append(responses, *s.toPollResponse(&p, votes, 0))
	}

	return responses, nil
}

func (s *pollService) ClosePoll(ctx context.Context, pollID, creatorID string) error {
	pID, err := primitive.ObjectIDFromHex(pollID)
	if err != nil {
		return errors.New("invalid poll ID")
	}
	cID, err := primitive.ObjectIDFromHex(creatorID)
	if err != nil {
		return errors.New("invalid creator ID")
	}

	poll, err := s.pollRepo.FindByID(ctx, pID)
	if err != nil || poll == nil {
		return errors.New("poll not found")
	}

	if poll.CreatorID != cID {
		return errors.New("permission denied: you cannot close this poll")
	}

	return s.pollRepo.UpdateStatus(ctx, pID, "closed")
}

func (s *pollService) DeletePoll(ctx context.Context, pollID, creatorID string) error {
	pID, err := primitive.ObjectIDFromHex(pollID)
	if err != nil {
		return errors.New("invalid poll ID")
	}
	cID, err := primitive.ObjectIDFromHex(creatorID)
	if err != nil {
		return errors.New("invalid creator ID")
	}

	if err := s.pollRepo.Delete(ctx, pID, cID); err != nil {
		return err
	}

	// Clean up associated votes
	_ = s.voteRepo.DeleteByPollID(ctx, pID)

	return nil
}

func (s *pollService) GetDashboardStats(ctx context.Context, creatorID string) (map[string]interface{}, error) {
	cID, err := primitive.ObjectIDFromHex(creatorID)
	if err != nil {
		return nil, errors.New("invalid creator ID")
	}

	totalPolls, err := s.pollRepo.CountByCreatorID(ctx, cID)
	if err != nil {
		return nil, err
	}

	activePolls, err := s.pollRepo.CountActiveByCreatorID(ctx, cID)
	if err != nil {
		return nil, err
	}

	polls, err := s.pollRepo.FindByCreatorID(ctx, cID)
	if err != nil {
		return nil, err
	}

	pollIDs := make([]primitive.ObjectID, 0, len(polls))
	for _, p := range polls {
		pollIDs = append(pollIDs, p.ID)
	}

	totalVotes, _ := s.voteRepo.CountTotalVotesByCreator(ctx, pollIDs)
	uniqueRespondents, _ := s.voteRepo.CountUniqueRespondentsByCreator(ctx, pollIDs)

	return map[string]interface{}{
		"totalPolls":        totalPolls,
		"activePolls":       activePolls,
		"totalVotes":        totalVotes,
		"uniqueRespondents": uniqueRespondents,
	}, nil
}

func (s *pollService) toPollResponse(p *models.Poll, totalVotes, activeViewers int64) *models.PollResponse {
	publicURL := fmt.Sprintf("%s/poll/%s", strings.TrimRight(s.frontendURL, "/"), p.Slug)
	return &models.PollResponse{
		ID:            p.ID.Hex(),
		CreatorID:     p.CreatorID.Hex(),
		Slug:          p.Slug,
		Question:      p.Question,
		Options:       p.Options,
		Settings:      p.Settings,
		Status:        p.Status,
		ExpiresAt:     p.ExpiresAt,
		CreatedAt:     p.CreatedAt,
		UpdatedAt:     p.UpdatedAt,
		TotalVotes:    totalVotes,
		ActiveViewers: activeViewers,
		PublicURL:     publicURL,
	}
}
