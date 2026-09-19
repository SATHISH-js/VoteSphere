package services

import (
	"context"
	"errors"
	"strings"

	"pulsepoll-backend/models"
	"pulsepoll-backend/repositories"
	"pulsepoll-backend/utils"
	"pulsepoll-backend/validators"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type AuthService interface {
	Register(ctx context.Context, req *models.RegisterRequest) (*models.AuthResponse, error)
	Login(ctx context.Context, req *models.LoginRequest) (*models.AuthResponse, error)
	GetCurrentUser(ctx context.Context, userID string) (*models.UserSummary, error)
}

type authService struct {
	userRepo  repositories.UserRepository
	jwtSecret string
}

func NewAuthService(userRepo repositories.UserRepository, jwtSecret string) AuthService {
	return &authService{
		userRepo:  userRepo,
		jwtSecret: jwtSecret,
	}
}

func (s *authService) Register(ctx context.Context, req *models.RegisterRequest) (*models.AuthResponse, error) {
	if s.userRepo == nil {
		return nil, errors.New("database is not connected. Please ensure your MongoDB Atlas password is set in .env")
	}

	if err := validators.ValidateRegisterRequest(req); err != nil {
		return nil, err
	}

	cleanEmail := strings.ToLower(strings.TrimSpace(req.Email))

	// Check if email already exists
	existing, err := s.userRepo.FindByEmail(ctx, cleanEmail)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, errors.New("an account with this email already exists")
	}

	hash, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, errors.New("failed to hash password")
	}

	user := &models.User{
		Name:         strings.TrimSpace(req.Name),
		Email:        cleanEmail,
		PasswordHash: hash,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}

	token, err := utils.GenerateToken(user.ID.Hex(), user.Email, s.jwtSecret)
	if err != nil {
		return nil, errors.New("failed to generate authentication token")
	}

	return &models.AuthResponse{
		Token: token,
		User: models.UserSummary{
			ID:        user.ID.Hex(),
			Name:      user.Name,
			Email:     user.Email,
			CreatedAt: user.CreatedAt,
		},
	}, nil
}

func (s *authService) Login(ctx context.Context, req *models.LoginRequest) (*models.AuthResponse, error) {
	if s.userRepo == nil {
		return nil, errors.New("database is not connected. Please ensure your MongoDB Atlas password is set in .env")
	}

	if err := validators.ValidateLoginRequest(req); err != nil {
		return nil, err
	}

	cleanEmail := strings.ToLower(strings.TrimSpace(req.Email))
	user, err := s.userRepo.FindByEmail(ctx, cleanEmail)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("invalid email or password")
	}

	if !utils.CheckPasswordHash(req.Password, user.PasswordHash) {
		return nil, errors.New("invalid email or password")
	}

	token, err := utils.GenerateToken(user.ID.Hex(), user.Email, s.jwtSecret)
	if err != nil {
		return nil, errors.New("failed to generate authentication token")
	}

	return &models.AuthResponse{
		Token: token,
		User: models.UserSummary{
			ID:        user.ID.Hex(),
			Name:      user.Name,
			Email:     user.Email,
			CreatedAt: user.CreatedAt,
		},
	}, nil
}

func (s *authService) GetCurrentUser(ctx context.Context, userID string) (*models.UserSummary, error) {
	if s.userRepo == nil {
		return nil, errors.New("database is not connected")
	}

	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, errors.New("invalid user ID")
	}

	user, err := s.userRepo.FindByID(ctx, objID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("user not found")
	}

	return &models.UserSummary{
		ID:        user.ID.Hex(),
		Name:      user.Name,
		Email:     user.Email,
		CreatedAt: user.CreatedAt,
	}, nil
}
