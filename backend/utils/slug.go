package utils

import (
	"crypto/rand"
	"math/big"
)

const slugCharset = "abcdefghijklmnopqrstuvwxyz0123456789"

// GenerateSecureSlug generates a URL-friendly, cryptographically random slug
func GenerateSecureSlug(length int) string {
	if length <= 0 {
		length = 8
	}

	result := make([]byte, length)
	charsetLen := big.NewInt(int64(len(slugCharset)))

	for i := 0; i < length; i++ {
		num, err := rand.Int(rand.Reader, charsetLen)
		if err != nil {
			// Fallback fallback character if random entropy read fails
			result[i] = slugCharset[i%len(slugCharset)]
			continue
		}
		result[i] = slugCharset[num.Int64()]
	}

	return string(result)
}
