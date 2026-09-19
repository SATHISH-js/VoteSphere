package tests

import (
	"pulsepoll-backend/models"
	"pulsepoll-backend/utils"
	"testing"
)

func TestVoterFingerprintHashing(t *testing.T) {
	fp1 := "canvas_hash_12345:ua_chrome_win:client_uuid_abc"
	fp2 := "canvas_hash_12345:ua_chrome_win:client_uuid_xyz"

	hash1 := utils.GenerateHash(fp1)
	hash2 := utils.GenerateHash(fp2)

	if len(hash1) != 64 || len(hash2) != 64 {
		t.Fatalf("Expected SHA-256 hex string of 64 characters, got %d", len(hash1))
	}

	if hash1 == hash2 {
		t.Fatalf("Different voter fingerprints produced identical hash")
	}

	// Deterministic
	if utils.GenerateHash(fp1) != hash1 {
		t.Fatalf("Hash function must be deterministic")
	}
}

func TestOptionPercentageCalculation(t *testing.T) {
	totalVotes := int64(120)
	optionVotes := int64(42)

	percentage := (float64(optionVotes) / float64(totalVotes)) * 100.0
	rounded := float64(int(percentage*10+0.5)) / 10.0

	expected := 35.0
	if rounded != expected {
		t.Fatalf("Expected percentage %f, got %f", expected, rounded)
	}
}

func TestPollResultsResponseFormat(t *testing.T) {
	res := models.PollResultsResponse{
		PollID:     "652ef1a59f1b2c3d4e5f6a7b",
		Question:   "Frontend framework?",
		TotalVotes: 10,
		Results: []models.OptionResult{
			{OptionID: "opt1", OptionText: "React", Votes: 6, Percentage: 60.0},
			{OptionID: "opt2", OptionText: "Vue", Votes: 4, Percentage: 40.0},
		},
	}

	if res.TotalVotes != 10 {
		t.Fatalf("Expected total votes 10, got %d", res.TotalVotes)
	}
	if len(res.Results) != 2 {
		t.Fatalf("Expected 2 options, got %d", len(res.Results))
	}
}
