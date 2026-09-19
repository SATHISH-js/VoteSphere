package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type PollOption struct {
	ID   string `bson:"id" json:"id"`
	Text string `bson:"text" json:"text"`
}

type PollSettings struct {
	MultipleChoice         bool   `bson:"multipleChoice" json:"multipleChoice"`
	AnonymousVoting        bool   `bson:"anonymousVoting" json:"anonymousVoting"`
	ShowResultsAfterVoting bool   `bson:"showResultsAfterVoting" json:"showResultsAfterVoting"`
	AllowVoteChanges       bool   `bson:"allowVoteChanges" json:"allowVoteChanges"`
	VoterProtection        string `bson:"voterProtection,omitempty" json:"voterProtection"` // "smart_fingerprint" | "strict_ip" | "require_account"
}

type Poll struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	CreatorID primitive.ObjectID `bson:"creatorId" json:"creatorId"`
	Slug      string             `bson:"slug" json:"slug"`
	Question  string             `bson:"question" json:"question"`
	Options   []PollOption       `bson:"options" json:"options"`
	Settings  PollSettings       `bson:"settings" json:"settings"`
	Status    string             `bson:"status" json:"status"` // "active" | "closed"
	ExpiresAt *time.Time         `bson:"expiresAt,omitempty" json:"expiresAt"`
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt time.Time          `bson:"updatedAt" json:"updatedAt"`
}

type CreatePollRequest struct {
	Question string       `json:"question" binding:"required,min=5,max=300"`
	Options  []string     `json:"options" binding:"required,min=2,max=10"`
	Settings PollSettings `json:"settings"`
	Duration string       `json:"duration"` // "none", "1h", "24h", "7d", or ISO time
}

type UpdatePollRequest struct {
	Question string        `json:"question,omitempty"`
	Settings *PollSettings `json:"settings,omitempty"`
}

type PollResponse struct {
	ID            string       `json:"id"`
	CreatorID     string       `json:"creatorId,omitempty"`
	Slug          string       `json:"slug"`
	Question      string       `json:"question"`
	Options       []PollOption `json:"options"`
	Settings      PollSettings `json:"settings"`
	Status        string       `json:"status"`
	ExpiresAt     *time.Time   `json:"expiresAt,omitempty"`
	CreatedAt     time.Time    `json:"createdAt"`
	UpdatedAt     time.Time    `json:"updatedAt"`
	TotalVotes    int64        `json:"totalVotes"`
	ActiveViewers int64        `json:"activeViewers"`
	PublicURL     string       `json:"publicUrl,omitempty"`
}
