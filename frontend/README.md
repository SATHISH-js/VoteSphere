# PulsePoll Frontend (React + Vite + Tailwind CSS)

Modern real-time polling user interface built with React 19, Vite, Tailwind CSS, and WebSockets.

## Features
- **Real-Time Live Results**: Subscribes directly to WebSocket room streams driven by Redis Pub/Sub.
- **Zero Page Refresh**: Instant UI animation as votes arrive from other connected peers.
- **Touch-Friendly Interface**: Mobile-first design adhering to 44px+ minimum touch targets.
- **Accessible & Responsive**: Clean typography, semantic elements, and keyboard navigation.
- **Live Viewer Presence**: Real-time counter showing active participants viewing each poll.
- **Share Modals & Dynamic QR Codes**: Instant client-side SVG QR code generation and native Web Share integration.
- **Visual Analytics**: Interactive distribution breakdowns and vote velocity timelines.

## Scripts
```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Production build
npm run build

# Preview build locally
npm run preview
```

## Environment Configuration
Create `.env` in `frontend/`:
```env
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
```
