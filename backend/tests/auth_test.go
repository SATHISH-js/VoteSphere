package tests

import (
	"pulsepoll-backend/models"
	"pulsepoll-backend/utils"
	"pulsepoll-backend/validators"
	"testing"
)

func TestPasswordHashing(t *testing.T) {
	password := "SecurePass123!"
	hash, err := utils.HashPassword(password)
	if err != nil {
		t.Fatalf("Expected no error hashing password, got %v", err)
	}

	if !utils.CheckPasswordHash(password, hash) {
		t.Fatalf("Password verification failed for correct password")
	}

	if utils.CheckPasswordHash("WrongPass123!", hash) {
		t.Fatalf("Password verification succeeded for incorrect password")
	}
}

func TestJWTTokenGenerationAndValidation(t *testing.T) {
	secret := "test-secret-key-1234567890123456"
	userID := "652ef1a59f1b2c3d4e5f6a7b"
	email := "alex@example.com"

	token, err := utils.GenerateToken(userID, email, secret)
	if err != nil {
		t.Fatalf("Failed to generate token: %v", err)
	}

	claims, err := utils.ValidateToken(token, secret)
	if err != nil {
		t.Fatalf("Failed to validate token: %v", err)
	}

	if claims.UserID != userID || claims.Email != email {
		t.Fatalf("Token claims mismatch: expected %s / %s, got %s / %s", userID, email, claims.UserID, claims.Email)
	}

	// Validate with wrong secret fails
	_, err = utils.ValidateToken(token, "wrong-secret-key-00000000000000")
	if err == nil {
		t.Fatalf("Expected token validation with wrong secret to fail")
	}
}

func TestValidateRegisterRequest(t *testing.T) {
	valid := &models.RegisterRequest{
		Name:            "Sarah Connor",
		Email:           "sarah@example.com",
		Password:        "Password123!",
		ConfirmPassword: "Password123!",
	}
	if err := validators.ValidateRegisterRequest(valid); err != nil {
		t.Fatalf("Expected valid registration to pass, got error: %v", err)
	}

	// Password mismatch
	mismatch := &models.RegisterRequest{
		Name:            "Sarah Connor",
		Email:           "sarah@example.com",
		Password:        "Password123!",
		ConfirmPassword: "Password456!",
	}
	if err := validators.ValidateRegisterRequest(mismatch); err == nil {
		t.Fatalf("Expected password mismatch error, got nil")
	}

	// Short password
	shortPass := &models.RegisterRequest{
		Name:            "Sarah Connor",
		Email:           "sarah@example.com",
		Password:        "short",
		ConfirmPassword: "short",
	}
	if err := validators.ValidateRegisterRequest(shortPass); err == nil {
		t.Fatalf("Expected password length error, got nil")
	}
}
