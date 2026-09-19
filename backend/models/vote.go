package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Vote struct {
	ID        primitive.ObjectID  `bson:"_id,omitempty" json:"id"`
	PollID    primitive.ObjectID  `bson:"pollId" json:"pollId"`
	OptionIDs []string            `bson:"optionIds" json:"optionIds"`
	VoterHash string              `bson:"voterHash" json:"voterHash"`
	IPHash    string              `bson:"ipHash" json:"ipHash"`
	UserID    *primitive.ObjectID `bson:"userId,omitempty" json:"userId,omitempty"`
	CreatedAt time.Time           `bson:"createdAt" json:"createdAt"`
	UpdatedAt time.Time           `bson:"updatedAt" json:"updatedAt"`
}

type CastVoteRequest struct {
	OptionIDs []string `json:"optionIds" binding:"required,min=1"`
	VoterHash string   `json:"voterHash" binding:"required"`
	UserID    string   `json:"userId,omitempty"`
}

type OptionResult struct {
	OptionID   string  `json:"optionId"`
	OptionText string  `json:"optionText"`
	Votes      int64   `json:"votes"`
	Percentage float64 `json:"percentage"`
}

type PollResultsResponse struct {
	PollID        string         `json:"pollId"`
	Question      string         `json:"question"`
	Status        string         `json:"status"`
	Results       []OptionResult `json:"results"`
	TotalVotes    int64          `json:"totalVotes"`
	ActiveViewers int64          `json:"activeViewers"`
	LastUpdated   time.Time      `json:"lastUpdated"`
}

type VotingTimelinePoint struct {
	Timestamp string `json:"timestamp"`
	Votes     int64  `json:"votes"`
}

type PollAnalyticsResponse struct {
	PollID         string                `json:"pollId"`
	Question       string                `json:"question"`
	Status         string                `json:"status"`
	TotalVotes     int64                 `json:"totalVotes"`
	UniqueVoters   int64                 `json:"uniqueVoters"`
	Results        []OptionResult        `json:"results"`
	Timeline       []VotingTimelinePoint `json:"timeline"`
	PeakPeriod     string                `json:"peakPeriod"`
	PeakVoteCount  int64                 `json:"peakVoteCount"`
	CreatedAt      time.Time             `json:"createdAt"`
	ExpiresAt      *time.Time            `json:"expiresAt,omitempty"`
}
