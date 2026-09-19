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
	"go.mongodb.org/mongo-driver/mongo/options"
)

type PollRepository interface {
	Create(ctx context.Context, poll *models.Poll) error
	FindByID(ctx context.Context, id primitive.ObjectID) (*models.Poll, error)
	FindBySlug(ctx context.Context, slug string) (*models.Poll, error)
	FindByIDOrSlug(ctx context.Context, idOrSlug string) (*models.Poll, error)
	FindByCreatorID(ctx context.Context, creatorID primitive.ObjectID) ([]models.Poll, error)
	Update(ctx context.Context, poll *models.Poll) error
	UpdateStatus(ctx context.Context, id primitive.ObjectID, status string) error
	Delete(ctx context.Context, id, creatorID primitive.ObjectID) error
	CountByCreatorID(ctx context.Context, creatorID primitive.ObjectID) (int64, error)
	CountActiveByCreatorID(ctx context.Context, creatorID primitive.ObjectID) (int64, error)
}

type pollRepo struct {
	collection *mongo.Collection
}

func NewPollRepository(db *database.MongoDB) PollRepository {
	return &pollRepo{
		collection: db.Database.Collection("polls"),
	}
}

func (r *pollRepo) Create(ctx context.Context, poll *models.Poll) error {
	poll.CreatedAt = time.Now()
	poll.UpdatedAt = time.Now()
	if poll.Status == "" {
		poll.Status = "active"
	}
	result, err := r.collection.InsertOne(ctx, poll)
	if err != nil {
		return err
	}
	poll.ID = result.InsertedID.(primitive.ObjectID)
	return nil
}

func (r *pollRepo) FindByID(ctx context.Context, id primitive.ObjectID) (*models.Poll, error) {
	var poll models.Poll
	err := r.collection.FindOne(ctx, bson.M{"_id": id}).Decode(&poll)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, nil
		}
		return nil, err
	}
	return &poll, nil
}

func (r *pollRepo) FindBySlug(ctx context.Context, slug string) (*models.Poll, error) {
	var poll models.Poll
	err := r.collection.FindOne(ctx, bson.M{"slug": slug}).Decode(&poll)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			return nil, nil
		}
		return nil, err
	}
	return &poll, nil
}

func (r *pollRepo) FindByIDOrSlug(ctx context.Context, idOrSlug string) (*models.Poll, error) {
	if objID, err := primitive.ObjectIDFromHex(idOrSlug); err == nil {
		p, err := r.FindByID(ctx, objID)
		if err == nil && p != nil {
			return p, nil
		}
	}
	return r.FindBySlug(ctx, idOrSlug)
}

func (r *pollRepo) FindByCreatorID(ctx context.Context, creatorID primitive.ObjectID) ([]models.Poll, error) {
	opts := options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}})
	cursor, err := r.collection.Find(ctx, bson.M{"creatorId": creatorID}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	polls := make([]models.Poll, 0)
	if err := cursor.All(ctx, &polls); err != nil {
		return nil, err
	}
	return polls, nil
}

func (r *pollRepo) Update(ctx context.Context, poll *models.Poll) error {
	poll.UpdatedAt = time.Now()
	filter := bson.M{"_id": poll.ID, "creatorId": poll.CreatorID}
	update := bson.M{
		"$set": bson.M{
			"question":  poll.Question,
			"settings":  poll.Settings,
			"updatedAt": poll.UpdatedAt,
		},
	}
	_, err := r.collection.UpdateOne(ctx, filter, update)
	return err
}

func (r *pollRepo) UpdateStatus(ctx context.Context, id primitive.ObjectID, status string) error {
	filter := bson.M{"_id": id}
	update := bson.M{
		"$set": bson.M{
			"status":    status,
			"updatedAt": time.Now(),
		},
	}
	_, err := r.collection.UpdateOne(ctx, filter, update)
	return err
}

func (r *pollRepo) Delete(ctx context.Context, id, creatorID primitive.ObjectID) error {
	filter := bson.M{"_id": id, "creatorId": creatorID}
	result, err := r.collection.DeleteOne(ctx, filter)
	if err != nil {
		return err
	}
	if result.DeletedCount == 0 {
		return errors.New("poll not found or permission denied")
	}
	return nil
}

func (r *pollRepo) CountByCreatorID(ctx context.Context, creatorID primitive.ObjectID) (int64, error) {
	return r.collection.CountDocuments(ctx, bson.M{"creatorId": creatorID})
}

func (r *pollRepo) CountActiveByCreatorID(ctx context.Context, creatorID primitive.ObjectID) (int64, error) {
	return r.collection.CountDocuments(ctx, bson.M{
		"creatorId": creatorID,
		"status":    "active",
	})
}
