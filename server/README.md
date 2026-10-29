# Talentwise server models

This package contains the Express API and MongoDB models for the Talentwise recruiting workflow. Each candidate and channel API route reads or writes MongoDB through Mongoose.

## Models

- **RecruitingChannel** — validates channel name and type, monthly spend, active status, and description. Channel names are unique.
- **Candidate** — validates candidate identity, role, recruiting-source reference, pipeline stage, quality score, and application/hire dates. Hires must have a hire date on or after application; other stages cannot have one. `daysToHire` is a virtual value.

Both schemas use Mongoose timestamps and strict field checking. Candidate stage/date and source/stage indexes support the main pipeline queries.

## Configure and run

1. Copy `.env.example` to `.env` in this directory.
2. Set `MONGODB_URI` to a MongoDB connection string for a database you control.
3. Optionally set `PORT` (defaults to `5000`) and `CLIENT_ORIGIN` (defaults to allowing browser development origins).
4. Install and start the API:

```powershell
npm install
npm run dev
```

The API refuses to start without `MONGODB_URI` or if MongoDB is unreachable. The React client can access it at `http://localhost:5000/api`.

## API endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Report API and MongoDB connection status |
| GET, POST | `/api/channels` | List channels or create a channel |
| GET, PATCH, DELETE | `/api/channels/:id` | Read, update, or delete/archive a channel |
| GET, POST | `/api/candidates` | List/filter candidates or create a candidate |
| GET, PATCH, DELETE | `/api/candidates/:id` | Read, update, or delete a candidate |
| POST | `/api/candidates/bulk` | Validate and create up to 100 candidates in one request |
| GET | `/api/analytics/overview` | Read all-time totals, stage counts, and monthly hiring trends |
| GET | `/api/analytics/channels` | Compare applicant volume, hires, hire rate, and candidate quality by channel |

Candidate listing supports `stage`, `source`, `q`, `appliedFrom`, `appliedTo`, `page`, and `limit`. Lists return `{ data, pagination }`. Candidate responses populate the channel source. A channel that already has candidates is archived rather than removed. Bulk creation accepts `{ "candidates": [...] }`, validates every record and source before writing, and rejects invalid batches without inserting partial data; batches are limited to 100 records. The overview accepts an optional `months` parameter from 1 to 12 (default 6); it includes zero-count months and reports all-time totals separately. Channel analytics includes inactive channels and returns null for quality when a channel has no candidate records.

## Validate

The test suite uses an ephemeral in-memory MongoDB instance, so no local MongoDB server or credentials are needed to run tests.

```powershell
npm run check
npm test
```
