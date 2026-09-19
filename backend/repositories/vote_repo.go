package repositories

import (
	"context"
	"errors"
	"time"

	"pulsepoll-backend/database"
	"pulsepoll-backend/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type VoteRepository interface {
	Create(ctx context.Context, vote *models.Vote) error
	FindByPollIDAndVoterHash(ctx context.Context, pollID primitive.ObjectID, voterHash string) (*models.Vote, error)
	FindByPollIDAndIPHash(ctx context.Context, pollID primitive.ObjectID, ipHash string) (*models.Vote, error)
	FindByPollIDAndUserID(ctx context.Context, pollID, userID primitive.ObjectID) (*models.Vote, error)
	Update(ctx context.Context, vote *models.Vote) error
	CountByPollID(ctx context.Context, pollID primitive.ObjectID) (int64, error)
	CountTotalVotesByCreator(ctx context.Context, pollIDs []primitive.ObjectID) (int64, error)
	CountUniqueRespondentsByCreator(ctx context.Context, pollIDs []primitive.ObjectID) (int64, error)
	AggregateOptionVotes(ctx context.Context, pollID primitive.ObjectID) (map[string]int64, error)
	GetVotingTimeline(ctx context.Context, pollID primitive.ObjectID) ([]models.VotingTimelinePoint, error)
	DeleteByPollID(ctx context.Context, pollID primitive.ObjectID) error
}

type voteRepo struct {
	collection *mongo.Collection
}

func NewVoteRepository(db *database.MongoDB) VoteRepository {
	return &voteRepo{
		collection: db.Database.Collection("votes"),
	}
}

func (r *voteRepo) Create(ctx context.Context, vote *models.Vote) error {
	vote.CreatedAt = time.Now()
	vote.UpdatedAt = time.Now()
	result, err := r.collection.InsertOne(ctx, vote)
	if err != nil {
		return err
	}
	vote.ID = result.InsertedID.(primitive.ObjectID)
	return nil
}

func (r *voteRepo) FindByPollIDAndVoterHash(ctx context.Context, pollID primitive.ObjectID, voterHash string) (*models.Vote, error) {
	var vote models.Vote
	err := r.collection.FindOne(ctx, bson.M{
		"pollId":    pollID,
		"voterHash": voterHash,
	}).Decode(&vote)

	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, nil
		}
		return nil, err
	}
	return &vote, nil
}

func (r *voteRepo) FindByPollIDAndIPHash(ctx context.Context, pollID primitive.ObjectID, ipHash string) (*models.Vote, error) {
	var vote models.Vote
	err := r.collection.FindOne(ctx, bson.M{
		"pollId": pollID,
		"ipHash": ipHash,
	}).Decode(&vote)

	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, nil
		}
		return nil, err
	}
	return &vote, nil
}

func (r *voteRepo) FindByPollIDAndUserID(ctx context.Context, pollID, userID primitive.ObjectID) (*models.Vote, error) {
	var vote models.Vote
	err := r.collection.FindOne(ctx, bson.M{
		"pollId": pollID,
		"userId": userID,
	}).Decode(&vote)

	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, nil
		}
		return nil, err
	}
	return &vote, nil
}

func (r *voteRepo) Update(ctx context.Context, vote *models.Vote) error {
	vote.UpdatedAt = time.Now()
	filter := bson.M{"_id": vote.ID}
	update := bson.M{
		"$set": bson.M{
			"optionIds": vote.OptionIDs,
			"updatedAt": vote.UpdatedAt,
		},
	}
	_, err := r.collection.UpdateOne(ctx, filter, update)
	return err
}

func (r *voteRepo) CountByPollID(ctx context.Context, pollID primitive.ObjectID) (int64, error) {
	return r.collection.CountDocuments(ctx, bson.M{"pollId": pollID})
}

func (r *voteRepo) CountTotalVotesByCreator(ctx context.Context, pollIDs []primitive.ObjectID) (int64, error) {
	if len(pollIDs) == 0 {
		return 0, nil
	}
	return r.collection.CountDocuments(ctx, bson.M{
		"pollId": bson.M{"$in": pollIDs},
	})
}

func (r *voteRepo) CountUniqueRespondentsByCreator(ctx context.Context, pollIDs []primitive.ObjectID) (int64, error) {
	if len(pollIDs) == 0 {
		return 0, nil
	}
	distinct, err := r.collection.Distinct(ctx, "voterHash", bson.M{
		"pollId": bson.M{"$in": pollIDs},
	})
	if err != nil {
		return 0, err
	}
	return int64(len(distinct)), nil
}

func (r *voteRepo) AggregateOptionVotes(ctx context.Context, pollID primitive.ObjectID) (map[string]int64, error) {
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"pollId": pollID}}},
		{{Key: "$unwind", Value: "$optionIds"}},
		{{Key: "$group", Value: bson.M{
			"_id":   "$optionIds",
			"count": bson.M{"$sum": 1},
		}}},
	}

	cursor, err := r.collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	type AggResult struct {
		ID    string `bson:"_id"`
		Count int64  `bson:"count"`
	}

	results := make(map[string]int64)
	for cursor.Next(ctx) {
		var item AggResult
		if err := cursor.Decode(&item); err == nil {
			results[item.ID] = item.Count
		}
	}

	return results, nil
}

func (r *voteRepo) GetVotingTimeline(ctx context.Context, pollID primitive.ObjectID) ([]models.VotingTimelinePoint, error) {
	// Aggregate votes bucketed by hour or minute
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"pollId": pollID}}},
		{{Key: "$project", Value: bson.M{
			"formattedDate": bson.M{
				"$dateToString": bson.M{
					"format": "%Y-%m-%d %H:00",
					"date":   "$createdAt",
				},
			},
		}}},
		{{Key: "$group", Value: bson.M{
			"_id":   "$formattedDate",
			"count": bson.M{"$sum": 1},
		}}},
		{{Key: "$sort", Value: bson.M{"_id": 1}}},
	}

	cursor, err := r.collection.Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	type TimelineDoc struct {
		Timestamp string `bson:"_id"`
		Count     int64  `bson:"count"`
	}

	points := make([]models.VotingTimelinePoint, 0)
	for cursor.Next(ctx) {
		var doc TimelineDoc
		if err := cursor.Decode(&doc); err == nil {
			points = append(points, models.VotingTimelinePoint{
				Timestamp: doc.Timestamp,
				Votes:     doc.Count,
			})
		}
	}

	return points, nil
}

func (r *voteRepo) DeleteByPollID(ctx context.Context, pollID primitive.ObjectID) error {
	_, err := r.collection.DeleteMany(ctx, bson.M{"pollId": pollID})
	return err
}
