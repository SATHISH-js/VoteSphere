package websocket

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"sync"

	"pulsepoll-backend/redis"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Allow cross-origin WebSocket connections from frontend
		return true
	},
}

type Hub struct {
	// Rooms maps pollID to connected clients
	rooms      map[string]map[*Client]bool
	Register   chan *Client
	Unregister chan *Client
	broadcast  chan RoomBroadcast
	mutex      sync.RWMutex
	redisSvc   *redis.RedisService
}

type RoomBroadcast struct {
	PollID  string
	Message []byte
}

func NewHub(redisSvc *redis.RedisService) *Hub {
	return &Hub{
		rooms:      make(map[string]map[*Client]bool),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		broadcast:  make(chan RoomBroadcast, 256),
		redisSvc:   redisSvc,
	}
}

func (h *Hub) Run(ctx context.Context) {
	// Start background Redis subscriber for all poll update channels
	go h.listenRedisPubSub(ctx)

	for {
		select {
		case <-ctx.Done():
			log.Println("[INFO] WebSocket Hub shutting down")
			return

		case client := <-h.Register:
			h.mutex.Lock()
			if _, ok := h.rooms[client.PollID]; !ok {
				h.rooms[client.PollID] = make(map[*Client]bool)
			}
			h.rooms[client.PollID][client] = true
			clientCount := len(h.rooms[client.PollID])
			h.mutex.Unlock()

			// Update Redis active users & broadcast viewer count
			if h.redisSvc != nil && h.redisSvc.Client != nil {
				go func(pollID, clientID string) {
					count, err := h.redisSvc.AddActiveViewer(context.Background(), pollID, clientID)
					if err != nil {
						count = int64(clientCount)
					}
					h.BroadcastViewerCount(pollID, count)
				}(client.PollID, client.ID)
			} else {
				h.BroadcastViewerCount(client.PollID, int64(clientCount))
			}

		case client := <-h.Unregister:
			h.mutex.Lock()
			if clients, ok := h.rooms[client.PollID]; ok {
				if _, exists := clients[client]; exists {
					delete(clients, client)
					close(client.Send)
					if len(clients) == 0 {
						delete(h.rooms, client.PollID)
					}
				}
			}
			clientCount := 0
			if clients, ok := h.rooms[client.PollID]; ok {
				clientCount = len(clients)
			}
			h.mutex.Unlock()

			// Remove from Redis active users & broadcast viewer count
			if h.redisSvc != nil && h.redisSvc.Client != nil {
				go func(pollID, clientID string) {
					count, err := h.redisSvc.RemoveActiveViewer(context.Background(), pollID, clientID)
					if err != nil {
						count = int64(clientCount)
					}
					h.BroadcastViewerCount(pollID, count)
				}(client.PollID, client.ID)
			} else {
				h.BroadcastViewerCount(client.PollID, int64(clientCount))
			}

		case rb := <-h.broadcast:
			h.mutex.RLock()
			clients, ok := h.rooms[rb.PollID]
			if ok {
				for client := range clients {
					select {
					case client.Send <- rb.Message:
					default:
						close(client.Send)
						delete(clients, client)
					}
				}
			}
			h.mutex.RUnlock()
		}
	}
}

// listenRedisPubSub listens to Redis channel pattern poll:*:updates and relays to WebSocket
func (h *Hub) listenRedisPubSub(ctx context.Context) {
	if h.redisSvc == nil || h.redisSvc.Client == nil {
		log.Println("[WARN] Redis service unavailable; Pub/Sub relay disabled (local fallback mode)")
		return
	}

	pubsub := h.redisSvc.SubscribePattern(ctx, "poll:*:updates")
	defer pubsub.Close()

	ch := pubsub.Channel()
	log.Println("[INFO] Subscribed to Redis Pub/Sub pattern: poll:*:updates")

	for {
		select {
		case <-ctx.Done():
			return
		case msg, ok := <-ch:
			if !ok {
				return
			}
			// Channel name format: poll:{pollId}:updates
			parts := strings.Split(msg.Channel, ":")
			if len(parts) >= 3 {
				pollID := parts[1]
				// Construct standard WebSocket event
				wsMsg := WSMessage{
					Type:    "poll-results-updated",
					PollID:  pollID,
					Payload: json.RawMessage(msg.Payload),
				}
				data, err := json.Marshal(wsMsg)
				if err == nil {
					h.broadcast <- RoomBroadcast{
						PollID:  pollID,
						Message: data,
					}
				}
			}
		}
	}
}

func (h *Hub) BroadcastViewerCount(pollID string, count int64) {
	payload, _ := json.Marshal(ViewerCountPayload{
		PollID:        pollID,
		ActiveViewers: count,
	})
	wsMsg := WSMessage{
		Type:    "viewer-count-updated",
		PollID:  pollID,
		Payload: payload,
	}
	data, err := json.Marshal(wsMsg)
	if err == nil {
		h.broadcast <- RoomBroadcast{
			PollID:  pollID,
			Message: data,
		}
	}
}

// ServeWS handles incoming websocket upgrade requests from clients
func (h *Hub) ServeWS(w http.ResponseWriter, r *http.Request, pollID string) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[ERROR] Failed to upgrade websocket: %v", err)
		return
	}

	client := &Client{
		Hub:    h,
		Conn:   conn,
		Send:   make(chan []byte, 256),
		PollID: pollID,
		ID:     uuid.New().String(),
	}

	h.Register <- client

	// Start reader and writer routines
	go client.WritePump()
	go client.ReadPump()
}

// BroadcastLocal handles fallback or direct broadcast if Redis PubSub is disabled
func (h *Hub) BroadcastLocal(pollID string, eventType string, payload interface{}) {
	raw, err := json.Marshal(payload)
	if err != nil {
		return
	}
	msg := WSMessage{
		Type:    eventType,
		PollID:  pollID,
		Payload: raw,
	}
	data, _ := json.Marshal(msg)
	h.broadcast <- RoomBroadcast{
		PollID:  pollID,
		Message: data,
	}
}
