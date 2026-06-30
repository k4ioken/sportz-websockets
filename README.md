# Sportz WebSockets

A Node.js + Express backend for managing sports matches and live commentary, with WebSocket broadcasts for real-time updates.

## Overview

This project provides:

- REST endpoints for creating and listing matches
- REST endpoints for creating and listing commentary for a match
- A WebSocket server for real-time updates
- Arcjet-based request protection and rate limiting
- PostgreSQL persistence via Drizzle ORM

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express 5
- **WebSockets:** `ws`
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **Validation:** Zod
- **Security / rate limiting:** Arcjet

## Project Structure

The backend lives in the `backend/` directory.

```text
backend/
  src/
    index.js              # App entry point
    arcjet.js             # HTTP and WS protection middleware
    db/                   # Database connection and schema files
    routes/                # REST API routes
    utils/                # Shared helpers
    validation/           # Zod schemas
    ws/server.js          # WebSocket server setup and broadcasting
```

## Features

### REST API

- `GET /matches` — list matches
- `POST /matches` — create a match
- `GET /matches/:id/commentary` — list commentary for a match
- `POST /matches/:id/commentary` — create commentary for a match

### WebSocket API

WebSocket connections are served at:

- `ws://<host>:<port>/ws`

Supported message types:

- `subscribe` — subscribe to a match feed
- `unsubscribe` — unsubscribe from a match feed

Broadcast events include:

- `welcome` — sent when a socket connects
- `subscribed` — sent after a successful subscription
- `unsubscribed` — sent after a successful unsubscription
- `match_created` — broadcast to all connected clients when a match is created
- `commentary` — broadcast to subscribers of a match when commentary is created
- `error` — sent when invalid JSON is received

### Real-time behavior

- Match creation is broadcast to all connected WebSocket clients.
- Commentary is broadcast only to clients subscribed to the relevant match ID.
- Idle sockets are pinged every 30 seconds.
- Backpressure is limited; sockets with excessive buffered data may be terminated.

## Requirements

- Node.js 18+ recommended
- PostgreSQL database
- Environment variables:
  - `DATABASE_URL`
  - `ARCJET_KEY`
  - `ARCJET_MODE` (optional; defaults to live behavior unless set to `DRY_RUN`)
  - `PORT` (optional; defaults to `8000`)
  - `HOST` (optional; defaults to `0.0.0.0`)

## Setup

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment variables

Create a `.env` file in `backend/`:

```env
DATABASE_URL=postgres://user:password@localhost:5432/sportz
ARCJET_KEY=your_arcjet_key
ARCJET_MODE=DRY_RUN
PORT=8000
HOST=0.0.0.0
```

### 3. Run database migrations

If your schema is set up with Drizzle migrations:

```bash
npm run db:generate
npm run db:migrate
```

You can also inspect the database with:

```bash
npm run db:studio
```

### 4. Start the server

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

## API Usage

### List matches

```bash
GET /matches?limit=10
```

Example response:

```json
{
  "message": "Matches fetched successfully",
  "data": []
}
```

### Create a match

```bash
POST /matches
Content-Type: application/json
```

```json
{
  "sport": "football",
  "homeTeam": "Arsenal",
  "awayTeam": "Chelsea",
  "startTime": "2026-06-30T18:00:00.000Z",
  "endTime": "2026-06-30T20:00:00.000Z",
  "homeScore": 0,
  "awayScore": 0
}
```

### List commentary for a match

```bash
GET /matches/1/commentary?limit=10
```

### Create commentary for a match

```bash
POST /matches/1/commentary
Content-Type: application/json
```

```json
{
  "minute": 12,
  "sequence": 1,
  "period": "first_half",
  "eventType": "goal",
  "actor": "Player Name",
  "team": "Arsenal",
  "message": "A great finish from close range.",
  "metadata": {
    "assist": "Midfielder"
  },
  "tags": ["goal", "highlight"]
}
```

## WebSocket Usage

Connect to `/ws` and send JSON messages.

### Subscribe to a match

```json
{
  "type": "subscribe",
  "matchId": 1
}
```

### Unsubscribe from a match

```json
{
  "type": "unsubscribe",
  "matchId": 1
}
```

### Example client flow

1. Open a WebSocket connection to `/ws`
2. Wait for the `welcome` message
3. Send a `subscribe` message for the match you want to follow
4. Listen for `commentary` and `match_created` events

## Data Model

### matches

- `id`
- `sport`
- `homeTeam`
- `awayTeam`
- `status` (`scheduled`, `live`, `finished`)
- `startTime`
- `endTime`
- `homeScore`
- `awayScore`
- `createdAt`

### commentary

- `id`
- `matchId`
- `minute`
- `sequence`
- `period`
- `eventType`
- `actor`
- `team`
- `message`
- `metadata`
- `tags`
- `createdAt`

## Security and Limits

- HTTP requests are protected by Arcjet middleware.
- WebSocket upgrade requests are also protected.
- Rate-limited clients may receive `429 Too Many Requests`.
- Invalid requests may receive `403 Forbidden`.

## Development Notes

- Match status is derived from start and end times.
- Commentary is stored in PostgreSQL and broadcast to subscribed clients.
- WebSocket sockets are cleaned up on disconnect.

## License

ISC
