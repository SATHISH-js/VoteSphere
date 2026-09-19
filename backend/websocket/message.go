package websocket

import "encoding/json"

type WSMessage struct {
	Type    string          `json:"type"` // "poll-results-updated", "viewer-count-updated", "ping", "pong"
	PollID  string          `json:"pollId,omitempty"`
	Payload json.RawMessage `json:"payload,omitempty"`
}

type ViewerCountPayload struct {
	PollID        string `json:"pollId"`
	ActiveViewers int64  `json:"activeViewers"`
}
