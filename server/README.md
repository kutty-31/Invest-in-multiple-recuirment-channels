# Talentwise server models

This package contains the Express API and MongoDB models for the Talentwise recruiting workflow. Each candidate and channel API route reads or writes MongoDB through Mongoose.

## Models

- **RecruitingChannel** — validates channel name and type, monthly spend, active status, and description. Channel names are unique.
- **Candidate** — validates candidate identity, role, recruiting-source reference, pipeline stage, quality score, and application/hire dates. Hires must have a hire date on or after application; other stages cannot have one. `daysToHire` is a virtual value.

Both schemas use Mongoose timestamps and strict field checking. Candidate stage/date and source/stage indexes support the main pipeline queries.

## Configure and run

1. Copy `.env.example` to `.env` in this directory.
2. Set `MONGODB_URI` to a MongoDB connection string for a database you control.
3. Set `JWT_SECRET` to a random secret of at least 32 bytes. For example, generate one with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` and keep it private.
4. Optionally set `PORT` (defaults to `5000`) and `CLIENT_ORIGIN` (defaults to allowing browser development origins).
4. Install and start the API:

```powershell
npm install
npm run dev
```

The API refuses to start without `MONGODB_URI`, a valid `JWT_SECRET`, or if MongoDB is unreachable. The React client can access it at `http://localhost:5000/api`.

## Authentication

Create an account from the React sign-in screen or call `POST /api/auth/register` with `{ "username": "recruiter", "password": "a-strong-password" }`. Usernames are case-insensitive; passwords must contain at least 8 characters and no more than 72 UTF-8 bytes. Passwords are stored as bcrypt hashes. Sign in with `POST /api/auth/login` to receive a one-hour JWT access token. The client keeps the token in memory and signing out or reloading requires signing in again.

Send authenticated API requests with `Authorization: Bearer <accessToken>`. The health check and `/api/auth/register` and `/api/auth/login` are public. `/api/auth/me`, candidate, channel, and analytics endpoints require a valid access token. The JWT secret must remain private and should be different for each environment.

## API endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Report API and MongoDB connection status |
| POST | `/api/auth/register` | Create an account and return an access token |
| POST | `/api/auth/login` | Verify credentials and return an access token |
| GET | `/api/auth/me` | Read the authenticated account |
| GET, POST | `/api/channels` | List channels or create a channel |
| GET, PATCH, PUT, DELETE | `/api/channels/:id` | Read, partially update, replace, or delete/archive a channel |
| GET | `/api/channels/:id/candidates` | List candidates related to a recruiting channel |
| GET, POST | `/api/candidates` | List/filter candidates or create a candidate |
| GET, PATCH, PUT, DELETE | `/api/candidates/:id` | Read, partially update, replace, or delete a candidate |
| POST | `/api/candidates/bulk` | Validate and create up to 100 candidates in one request |
| GET | `/api/analytics/overview` | Read all-time totals, stage counts, and monthly hiring trends |
| GET | `/api/analytics/channels` | Compare applicant volume, hires, hire rate, and candidate quality by channel |

Each candidate stores a required `source` ObjectId reference to a recruiting channel; the channel model exposes the inverse relationship through a Mongoose virtual. `GET /api/channels/:id/candidates` populates that relationship and returns the channel with its related candidate records, using `page` and `limit` pagination. Candidate listing supports `stage`, `source`, `q`, `appliedFrom`, `appliedTo`, `page`, and `limit`. Lists return `{ data, pagination }`. Candidate responses populate the channel source. PUT replaces all mutable fields; omitted optional fields are cleared and schema defaults are applied. PATCH remains available for partial updates. Candidate PUT requires a valid, existing `source`. A channel that already has candidates is archived rather than removed. Bulk creation accepts `{ "candidates": [...] }`, validates every record and source before writing, and rejects invalid batches without inserting partial data; batches are limited to 100 records. The overview accepts an optional `months` parameter from 1 to 12 (default 6); it includes zero-count months and reports all-time totals separately. Channel analytics includes inactive channels and returns null for quality when a channel has no candidate records.

## Validate

The test suite uses an ephemeral in-memory MongoDB instance, so no local MongoDB server or credentials are needed to run tests.

```powershell
npm run check
npm test
```
