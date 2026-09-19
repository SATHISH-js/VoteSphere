package validators

import (
	"errors"
	"fmt"
	"net/mail"
	"pulsepoll-backend/models"
	"strings"
	"time"
)

func ValidateRegisterRequest(req *models.RegisterRequest) error {
	name := strings.TrimSpace(req.Name)
	if len(name) < 2 || len(name) > 100 {
		return errors.New("name must be between 2 and 100 characters")
	}

	email := strings.TrimSpace(req.Email)
	if _, err := mail.ParseAddress(email); err != nil {
		return errors.New("a valid email address is required")
	}

	if len(req.Password) < 8 {
		return errors.New("password must be at least 8 characters long")
	}

	if req.Password != req.ConfirmPassword {
		return errors.New("passwords do not match")
	}

	return nil
}

func ValidateLoginRequest(req *models.LoginRequest) error {
	email := strings.TrimSpace(req.Email)
	if email == "" {
		return errors.New("email is required")
	}
	if _, err := mail.ParseAddress(email); err != nil {
		return errors.New("a valid email address is required")
	}
	if strings.TrimSpace(req.Password) == "" {
		return errors.New("password is required")
	}
	return nil
}

func ValidateCreatePollRequest(req *models.CreatePollRequest) error {
	q := strings.TrimSpace(req.Question)
	if len(q) < 5 {
		return errors.New("question must be at least 5 characters long")
	}
	if len(q) > 300 {
		return errors.New("question must not exceed 300 characters")
	}

	if len(req.Options) < 2 {
		return errors.New("a minimum of 2 poll options are required")
	}
	if len(req.Options) > 10 {
		return errors.New("a maximum of 10 poll options are allowed")
	}

	seen := make(map[string]bool)
	for i, opt := range req.Options {
		trimmed := strings.TrimSpace(opt)
		if len(trimmed) < 1 {
			return fmt.Errorf("option #%d cannot be blank", i+1)
		}
		if len(trimmed) > 100 {
			return fmt.Errorf("option #%d must not exceed 100 characters", i+1)
		}
		lower := strings.ToLower(trimmed)
		if seen[lower] {
			return fmt.Errorf("option '%s' is duplicated; options must be unique", trimmed)
		}
		seen[lower] = true
	}

	return nil
}

func ParseDuration(durationStr string) (*time.Time, error) {
	d := strings.ToLower(strings.TrimSpace(durationStr))
	if d == "" || d == "none" || d == "no_expiry" {
		return nil, nil
	}

	now := time.Now()
	switch d {
	case "1h":
		exp := now.Add(1 * time.Hour)
		return &exp, nil
	case "24h", "1d":
		exp := now.Add(24 * time.Hour)
		return &exp, nil
	case "7d":
		exp := now.Add(7 * 24 * time.Hour)
		return &exp, nil
	default:
		// Attempt parsing as RFC3339 timestamp
		t, err := time.Parse(time.RFC3339, durationStr)
		if err != nil {
			return nil, errors.New("invalid duration format; use 1h, 24h, 7d, or RFC3339 timestamp")
		}
		if t.Before(now) {
			return nil, errors.New("poll expiration date must be in the future")
		}
		return &t, nil
	}
}
