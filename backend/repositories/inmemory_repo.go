package repositories

import (
	"context"
	"strings"
	"sync"
	"time"

	"pulsepoll-backend/models"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type inMemoryStore struct {
	mu    sync.RWMutex
	users map[string]*models.User
	polls map[string]*models.Poll
	votes map[string]*models.Vote
}

var globalStore = &inMemoryStore{
	users: make(map[string]*models.User),
	polls: make(map[string]*models.Poll),
	votes: make(map[string]*models.Vote),
}

// -----------------------------------------------------------------------------
// In-Memory User Repository
// -----------------------------------------------------------------------------

type inMemoryUserRepo struct {
	store *inMemoryStore
}

func (r *inMemoryUserRepo) Create(ctx context.Context, user *models.User) error {
	r.store.mu.Lock()
	defer r.store.mu.Unlock()

	if user.ID.IsZero() {
		user.ID = primitive.NewObjectID()
	}
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()

	r.store.users[user.ID.Hex()] = user
	return nil
}

func (r *inMemoryUserRepo) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	r.store.mu.RLock()
	defer r.store.mu.RUnlock()

	clean := strings.ToLower(strings.TrimSpace(email))
	for _, u := range r.store.users {
		if strings.ToLower(u.Email) == clean {
			cpy := *u
			return &cpy, nil
		}
	}
	return nil, nil
}

func (r *inMemoryUserRepo) FindByID(ctx context.Context, id primitive.ObjectID) (*models.User, error) {
	r.store.mu.RLock()
	defer r.store.mu.RUnlock()

	if u, exists := r.store.users[id.Hex()]; exists {
		cpy := *u
		return &cpy, nil
	}
	return nil, nil
}

// -----------------------------------------------------------------------------
// In-Memory Poll Repository
// -----------------------------------------------------------------------------

type inMemoryPollRepo struct {
	store *inMemoryStore
}

func (r *inMemoryPollRepo) Create(ctx context.Context, poll *models.Poll) error {
	r.store.mu.Lock()
	defer r.store.mu.Unlock()

	if poll.ID.IsZero() {
		poll.ID = primitive.NewObjectID()
	}
	poll.CreatedAt = time.Now()
	poll.UpdatedAt = time.Now()

	r.store.polls[poll.ID.Hex()] = poll
	return nil
}

func (r *inMemoryPollRepo) FindByID(ctx context.Context, id primitive.ObjectID) (*models.Poll, error) {
	r.store.mu.RLock()
	defer r.store.mu.RUnlock()

	if p, exists := r.store.polls[id.Hex()]; exists {
		cpy := *p
		return &cpy, nil
	}
	return nil, nil
}

func (r *inMemoryPollRepo) FindBySlug(ctx context.Context, slug string) (*models.Poll, error) {
	r.store.mu.RLock()
	defer r.store.mu.RUnlock()

	for _, p := range r.store.polls {
		if p.Slug == slug {
			cpy := *p
			return &cpy, nil
		}
	}
	return nil, nil
}

func (r *inMemoryPollRepo) FindByIDOrSlug(ctx context.Context, idOrSlug string) (*models.Poll, error) {
	if oid, err := primitive.ObjectIDFromHex(idOrSlug); err == nil {
		if p, _ := r.FindByID(ctx, oid); p != nil {
			return p, nil
		}
	}
	return r.FindBySlug(ctx, idOrSlug)
}

func (r *inMemoryPollRepo) FindByCreatorID(ctx context.Context, creatorID primitive.ObjectID) ([]models.Poll, error) {
	r.store.mu.RLock()
	defer r.store.mu.RUnlock()

	var result []models.Poll
	for _, p := range r.store.polls {
		if p.CreatorID == creatorID {
			result = append(result, *p)
		}
	}
	return result, nil
}

func (r *inMemoryPollRepo) Update(ctx context.Context, poll *models.Poll) error {
	r.store.mu.Lock()
	defer r.store.mu.Unlock()

	poll.UpdatedAt = time.Now()
	r.store.polls[poll.ID.Hex()] = poll
	return nil
}

func (r *inMemoryPollRepo) UpdateStatus(ctx context.Context, id primitive.ObjectID, status string) error {
	r.store.mu.Lock()
	defer r.store.mu.Unlock()

	if p, exists := r.store.polls[id.Hex()]; exists {
		p.Status = status
		p.UpdatedAt = time.Now()
	}
	return nil
}

func (r *inMemoryPollRepo) Delete(ctx context.Context, id, creatorID primitive.ObjectID) error {
	r.store.mu.Lock()
	defer r.store.mu.Unlock()

	if p, exists := r.store.polls[id.Hex()]; exists && p.CreatorID == creatorID {
		delete(r.store.polls, id.Hex())
	}
	return nil
}

func (r *inMemoryPollRepo) CountByCreatorID(ctx context.Context, creatorID primitive.ObjectID) (int64, error) {
	r.store.mu.RLock()
	defer r.store.mu.RUnlock()

	var count int64
	for _, p := range r.store.polls {
		if p.CreatorID == creatorID {
			count++
		}
	}
	return count, nil
}

func (r *inMemoryPollRepo) CountActiveByCreatorID(ctx context.Context, creatorID primitive.ObjectID) (int64, error) {
	r.store.mu.RLock()
	defer r.store.mu.RUnlock()

	var count int64
	for _, p := range r.store.polls {
		if p.CreatorID == creatorID && p.Status == "active" {
			count++
		}
	}
	return count, nil
}

// -----------------------------------------------------------------------------
// In-Memory Vote Repository
// -----------------------------------------------------------------------------

type inMemoryVoteRepo struct {
	store *inMemoryStore
}

func (r *inMemoryVoteRepo) Create(ctx context.Context, vote *models.Vote) error {
	r.store.mu.Lock()
	defer r.store.mu.Unlock()

	if vote.ID.IsZero() {
		vote.ID = primitive.NewObjectID()
	}
	vote.CreatedAt = time.Now()
	r.store.votes[vote.ID.Hex()] = vote
	return nil
}

func (r *inMemoryVoteRepo) FindByPollIDAndVoterHash(ctx context.Context, pollID primitive.ObjectID, voterHash string) (*models.Vote, error) {
	r.store.mu.RLock()
	defer r.store.mu.RUnlock()

	for _, v := range r.store.votes {
		if v.PollID == pollID && v.VoterHash == voterHash {
			cpy := *v
			return &cpy, nil
		}
	}
	return nil, nil
}

func (r *inMemoryVoteRepo) FindByPollIDAndIPHash(ctx context.Context, pollID primitive.ObjectID, ipHash string) (*models.Vote, error) {
	r.store.mu.RLock()
	defer r.store.mu.RUnlock()

	for _, v := range r.store.votes {
		if v.PollID == pollID && v.IPHash == ipHash {
			cpy := *v
			return &cpy, nil
		}
	}
	return nil, nil
}

func (r *inMemoryVoteRepo) FindByPollIDAndUserID(ctx context.Context, pollID, userID primitive.ObjectID) (*models.Vote, error) {
	r.store.mu.RLock()
	defer r.store.mu.RUnlock()

	for _, v := range r.store.votes {
		if v.PollID == pollID && v.UserID != nil && *v.UserID == userID {
			cpy := *v
			return &cpy, nil
		}
	}
	return nil, nil
}

func (r *inMemoryVoteRepo) Update(ctx context.Context, vote *models.Vote) error {
	r.store.mu.Lock()
	defer r.store.mu.Unlock()

	r.store.votes[vote.ID.Hex()] = vote
	return nil
}

func (r *inMemoryVoteRepo) CountByPollID(ctx context.Context, pollID primitive.ObjectID) (int64, error) {
	r.store.mu.RLock()
	defer r.store.mu.RUnlock()

	var count int64
	for _, v := range r.store.votes {
		if v.PollID == pollID {
			count++
		}
	}
	return count, nil
}

func (r *inMemoryVoteRepo) CountTotalVotesByCreator(ctx context.Context, pollIDs []primitive.ObjectID) (int64, error) {
	r.store.mu.RLock()
	defer r.store.mu.RUnlock()

	idMap := make(map[primitive.ObjectID]bool)
	for _, id := range pollIDs {
		idMap[id] = true
	}

	var count int64
	for _, v := range r.store.votes {
		if idMap[v.PollID] {
			count++
		}
	}
	return count, nil
}

func (r *inMemoryVoteRepo) CountUniqueRespondentsByCreator(ctx context.Context, pollIDs []primitive.ObjectID) (int64, error) {
	r.store.mu.RLock()
	defer r.store.mu.RUnlock()

	idMap := make(map[primitive.ObjectID]bool)
	for _, id := range pollIDs {
		idMap[id] = true
	}

	voters := make(map[string]bool)
	for _, v := range r.store.votes {
		if idMap[v.PollID] {
			voters[v.VoterHash] = true
		}
	}
	return int64(len(voters)), nil
}

func (r *inMemoryVoteRepo) AggregateOptionVotes(ctx context.Context, pollID primitive.ObjectID) (map[string]int64, error) {
	r.store.mu.RLock()
	defer r.store.mu.RUnlock()

	counts := make(map[string]int64)
	for _, v := range r.store.votes {
		if v.PollID == pollID {
			for _, optID := range v.OptionIDs {
				counts[optID]++
			}
		}
	}
	return counts, nil
}

func (r *inMemoryVoteRepo) GetVotingTimeline(ctx context.Context, pollID primitive.ObjectID) ([]models.VotingTimelinePoint, error) {
	r.store.mu.RLock()
	defer r.store.mu.RUnlock()

	timeline := make(map[string]int64)
	for _, v := range r.store.votes {
		if v.PollID == pollID {
			hourKey := v.CreatedAt.Format("2006-01-02 15:00")
			timeline[hourKey]++
		}
	}

	var points []models.VotingTimelinePoint
	for t, count := range timeline {
		points = append(points, models.VotingTimelinePoint{
			Timestamp: t,
			Votes:     count,
		})
	}
	return points, nil
}

func (r *inMemoryVoteRepo) DeleteByPollID(ctx context.Context, pollID primitive.ObjectID) error {
	r.store.mu.Lock()
	defer r.store.mu.Unlock()

	for k, v := range r.store.votes {
		if v.PollID == pollID {
			delete(r.store.votes, k)
		}
	}
	return nil
}

// -----------------------------------------------------------------------------
// Factory
// -----------------------------------------------------------------------------

func NewInMemoryRepositories() (UserRepository, PollRepository, VoteRepository) {
	return &inMemoryUserRepo{store: globalStore},
		&inMemoryPollRepo{store: globalStore},
		&inMemoryVoteRepo{store: globalStore}
}
