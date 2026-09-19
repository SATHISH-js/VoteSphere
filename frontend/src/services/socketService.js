/**
 * WebSocket connection manager for live poll rooms
 */
export class PollSocket {
  constructor(pollId, onResultsUpdated, onViewerCountUpdated) {
    this.pollId = pollId;
    this.onResultsUpdated = onResultsUpdated;
    this.onViewerCountUpdated = onViewerCountUpdated;
    this.socket = null;
    this.reconnectTimer = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.isExplicitlyClosed = false;

    this.connect();
  }

  getWebSocketUrl() {
    let wsUrl = (import.meta.env.VITE_WS_URL || '').trim().replace(/\/+$/, '');
    if (wsUrl) {
      return `${wsUrl}/ws/polls/${this.pollId}`;
    }

    let apiUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
    if (apiUrl.endsWith('/api')) apiUrl = apiUrl.slice(0, -4);

    if (apiUrl) {
      const wsProtocol = apiUrl.startsWith('https:') ? 'wss:' : 'ws:';
      const cleanHost = apiUrl.replace(/^https?:\/\//, '');
      return `${wsProtocol}//${cleanHost}/ws/polls/${this.pollId}`;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let host = window.location.host;
    if (window.location.port === '5173') {
      host = `${window.location.hostname}:8080`;
    }

    return `${protocol}//${host}/ws/polls/${this.pollId}`;
  }

  connect() {
    if (this.isExplicitlyClosed) return;

    try {
      const url = this.getWebSocketUrl();
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        console.log(`[WebSocket] Connected to poll room: ${this.pollId}`);
      };

      this.socket.onmessage = (event) => {
        try {
          // May receive multiple newline-delimited messages
          const lines = event.data.split('\n');
          for (const line of lines) {
            if (!line.trim()) continue;
            const msg = JSON.parse(line);

            if (msg.type === 'poll-results-updated' && this.onResultsUpdated) {
              const payload = typeof msg.payload === 'string' ? JSON.parse(msg.payload) : msg.payload;
              this.onResultsUpdated(payload);
            } else if (msg.type === 'viewer-count-updated' && this.onViewerCountUpdated) {
              const payload = typeof msg.payload === 'string' ? JSON.parse(msg.payload) : msg.payload;
              this.onViewerCountUpdated(payload.activeViewers || 1);
            }
          }
        } catch (err) {
          console.error('[WebSocket] Failed to parse message:', err);
        }
      };

      this.socket.onclose = (e) => {
        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = (err) => {
        console.warn('[WebSocket] Error:', err);
      };
    } catch (e) {
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[WebSocket] Maximum reconnect attempts reached.');
      return;
    }

    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 10000);
    this.reconnectAttempts++;

    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  disconnect() {
    this.isExplicitlyClosed = true;
    clearTimeout(this.reconnectTimer);
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
