# Unified Host Tool Backend

Backend service for synchronizing Airbnb and Vrbo reservations, pricing, and calendars. The MVP connects to listings via iCal feeds and exposes REST endpoints for dashboards or mobile apps.

## Features
- Express.js API with routes for listings and bookings.
- PostgreSQL persistence using `pg` connection pooling.
- iCal ingestion utility to normalize Airbnb/Vrbo calendar feeds.
- Background sync every 15 minutes via `node-cron`.
- Manual sync endpoint to trigger per-listing updates.

## Getting Started
```bash
git clone <repo>
cd unified-host-tool
npm install
cp .env.example .env # set your DATABASE_URL + PORT
npm start
```

### Environment Variables
Create a `.env` file with:
```
PORT=4000
DATABASE_URL=postgres://USERNAME:PASSWORD@HOST:5432/unified_host_tool
```

## Database Schema
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  password TEXT
);

CREATE TABLE listings (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  platform TEXT NOT NULL,
  listing_id TEXT,
  ical_url TEXT NOT NULL,
  last_sync TIMESTAMP
);

CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  listing_id INT REFERENCES listings(id),
  platform TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  guest_name TEXT,
  reservation_id TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

`reservation_id` is populated with the event UID from the iCal feed to avoid duplicates.

## API Overview

### Health Check
`GET /health`

### Listings
- `GET /api/listings`
- `POST /api/listings`
  ```json
  {
    "user_id": 1,
    "platform": "airbnb",
    "listing_id": "12345",
    "ical_url": "https://example.com/calendar.ics"
  }
  ```
- `POST /api/listings/:id/sync` – manual sync trigger.

### Bookings
- `GET /api/bookings?listing_id=1`
- `DELETE /api/bookings/:id`

## Sync Logic
- `src/utils/icalParser.js` fetches and parses iCal feeds.
- `src/services/airbnbService.js` and `src/services/vrboService.js` upsert bookings and update `last_sync`.
- `src/app.js` registers a cron task (`*/15 * * * *`) that syncs every listing based on its platform.

## Next Steps
- Swap iCal ingestion for official partner APIs when credentials are available.
- Add webhook endpoints for real-time updates.
- Layer on notifications, pricing rules, and analytics dashboards.
