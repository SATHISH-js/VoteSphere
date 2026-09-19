package tests

import (
	"pulsepoll-backend/models"
	"pulsepoll-backend/utils"
	"pulsepoll-backend/validators"
	"testing"
)

func TestValidateCreatePollRequest(t *testing.T) {
	// Valid request
	valid := &models.CreatePollRequest{
		Question: "Which backend framework is best for high throughput?",
		Options:  []string{"Go / Gin", "Node.js / Express", "Rust / Actix", "Python / FastAPI"},
		Settings: models.PollSettings{
			MultipleChoice:  false,
			AnonymousVoting: true,
		},
	}
	if err := validators.ValidateCreatePollRequest(valid); err != nil {
		t.Fatalf("Expected valid poll to pass validation, got: %v", err)
	}

	// Question too short (< 5 chars)
	shortQ := &models.CreatePollRequest{
		Question: "Why?",
		Options:  []string{"Option 1", "Option 2"},
	}
	if err := validators.ValidateCreatePollRequest(shortQ); err == nil {
		t.Fatalf("Expected error for question shorter than 5 chars, got nil")
	}

	// Too few options (< 2)
	fewOptions := &models.CreatePollRequest{
		Question: "What is your favorite color?",
		Options:  []string{"Only One"},
	}
	if err := validators.ValidateCreatePollRequest(fewOptions); err == nil {
		t.Fatalf("Expected error for fewer than 2 options, got nil")
	}

	// Duplicate options
	duplicateOpts := &models.CreatePollRequest{
		Question: "Which database do you prefer?",
		Options:  []string{"PostgreSQL", "MongoDB", "PostgreSQL"},
	}
	if err := validators.ValidateCreatePollRequest(duplicateOpts); err == nil {
		t.Fatalf("Expected error for duplicate options, got nil")
	}
}

func TestGenerateSecureSlug(t *testing.T) {
	slug1 := utils.GenerateSecureSlug(8)
	slug2 := utils.GenerateSecureSlug(8)

	if len(slug1) != 8 || len(slug2) != 8 {
		t.Fatalf("Expected slug length 8, got %d and %d", len(slug1), len(slug2))
	}

	if slug1 == slug2 {
		t.Fatalf("Expected unique slugs, but got identical: %s == %s", slug1, slug2)
	}
}

func TestParseDuration(t *testing.T) {
	t1, err := validators.ParseDuration("1h")
	if err != nil || t1 == nil {
		t.Fatalf("Expected 1h duration to parse cleanly, got err: %v", err)
	}

	tNone, err := validators.ParseDuration("none")
	if err != nil || tNone != nil {
		t.Fatalf("Expected 'none' duration to return nil timestamp without error, got %v, err: %v", tNone, err)
	}
}
