package database

import (
	"context"
	"errors"
	"log"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type MongoDB struct {
	Client   *mongo.Client
	Database *mongo.Database
}

func ConnectMongoDB(uri, dbName string) (*MongoDB, error) {
	if strings.Contains(uri, "<db_password>") || strings.Contains(uri, "<password>") {
		log.Println("[ERROR] ==========================================================================")
		log.Println("[ERROR] MONGO_URI still contains placeholder '<db_password>' or '<password>'!")
		log.Println("[ERROR] Please replace '<db_password>' in your .env file with your actual database user password.")
		log.Println("[ERROR] ==========================================================================")
		return nil, errors.New("MONGO_URI contains placeholder '<db_password>'. Please replace it with your actual Atlas password in .env")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	clientOptions := options.Client().
		ApplyURI(uri).
		SetServerSelectionTimeout(3 * time.Second).
		SetConnectTimeout(5 * time.Second)
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return nil, err
	}

	// Ping database to verify connection
	if err := client.Ping(ctx, nil); err != nil {
		log.Printf("[ERROR] Failed to ping MongoDB: %v", err)
		log.Printf("[HELP] If using Free MongoDB Atlas:")
		log.Printf("[HELP]  1. Check Network Access in Atlas dashboard: ensure 0.0.0.0/0 (allow all) is added.")
		log.Printf("[HELP]  2. Ensure your Atlas database username and password in MONGO_URI are correct.")
		log.Printf("[HELP]  3. Ensure URI format is: mongodb+srv://<user>:<password>@cluster.mongodb.net/<dbname>?retryWrites=true&w=majority")
		return nil, err
	}

	log.Printf("[INFO] Successfully connected to MongoDB at database: %s", dbName)
	db := client.Database(dbName)

	mongoDB := &MongoDB{
		Client:   client,
		Database: db,
	}

	// Create indexes
	if err := mongoDB.createIndexes(); err != nil {
		log.Printf("[WARN] Error creating indexes: %v", err)
	}

	return mongoDB, nil
}

func (m *MongoDB) createIndexes() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 1. Users collection: unique email
	usersColl := m.Database.Collection("users")
	_, err := usersColl.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "email", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		log.Printf("[WARN] Could not create users.email index: %v", err)
	}

	// 2. Polls collection: creatorId index, unique slug index
	pollsColl := m.Database.Collection("polls")
	_, err = pollsColl.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys:    bson.D{{Key: "slug", Value: 1}},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys: bson.D{{Key: "creatorId", Value: 1}},
		},
		{
			Keys: bson.D{{Key: "status", Value: 1}},
		},
	})
	if err != nil {
		log.Printf("[WARN] Could not create polls indexes: %v", err)
	}

	// 3. Votes collection: pollId index, compound pollId + voterHash
	votesColl := m.Database.Collection("votes")
	_, err = votesColl.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{
			Keys: bson.D{{Key: "pollId", Value: 1}},
		},
		{
			Keys: bson.D{
				{Key: "pollId", Value: 1},
				{Key: "voterHash", Value: 1},
			},
		},
	})
	if err != nil {
		log.Printf("[WARN] Could not create votes indexes: %v", err)
	}

	log.Println("[INFO] MongoDB indexes verified and ensured.")
	return nil
}

func (m *MongoDB) Close() {
	if m.Client != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = m.Client.Disconnect(ctx)
		log.Println("[INFO] MongoDB connection closed.")
	}
}
