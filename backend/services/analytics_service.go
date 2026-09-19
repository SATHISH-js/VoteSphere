package services

import (
	"context"
	"errors"

	"pulsepoll-backend/models"
	"pulsepoll-backend/repositories"
)

type AnalyticsService interface {
	GetPollAnalytics(ctx context.Context, pollIDOrSlug string) (*models.PollAnalyticsResponse, error)
}

type analyticsService struct {
	pollRepo repositories.PollRepository
	voteRepo repositories.VoteRepository
}

func NewAnalyticsService(pollRepo repositories.PollRepository, voteRepo repositories.VoteRepository) AnalyticsService {
	return &analyticsService{
		pollRepo: pollRepo,
		voteRepo: voteRepo,
	}
}

func (s *analyticsService) GetPollAnalytics(ctx context.Context, pollIDOrSlug string) (*models.PollAnalyticsResponse, error) {
	poll, err := s.pollRepo.FindByIDOrSlug(ctx, pollIDOrSlug)
	if err != nil || poll == nil {
		return nil, errors.New("poll not found")
	}

	// 1. Total votes and option distribution
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

	// 2. Timeline points
	timeline, _ := s.voteRepo.GetVotingTimeline(ctx, poll.ID)

	// 3. Peak voting period
	var peakPeriod string = "N/A"
	var peakCount int64 = 0
	for _, pt := range timeline {
		if pt.Votes > peakCount {
			peakCount = pt.Votes
			peakPeriod = pt.Timestamp
		}
	}

	// 4. Unique respondents count
	uniqueVoters, _ := s.voteRepo.CountByPollID(ctx, poll.ID)

	return &models.PollAnalyticsResponse{
		PollID:        poll.ID.Hex(),
		Question:      poll.Question,
		Status:        poll.Status,
		TotalVotes:    totalVotes,
		UniqueVoters:  uniqueVoters,
		Results:       resultsList,
		Timeline:      timeline,
		PeakPeriod:    peakPeriod,
		PeakVoteCount: peakCount,
		CreatedAt:     poll.CreatedAt,
		ExpiresAt:     poll.ExpiresAt,
	}, nil
}
