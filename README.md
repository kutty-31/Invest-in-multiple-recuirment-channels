# Talentwise

Talentwise is a recruitment-channel analytics and candidate pipeline application for recruiters and hiring teams.

## Problem statement

Hiring teams often spread candidate and recruiting-source information across spreadsheets and tools. This makes it difficult to compare sourcing channels, follow candidates through the hiring process, and understand hiring cost and quality.

## Proposed solution

Talentwise provides a React dashboard for recruitment insights and candidate workflows, backed by an Express API and MongoDB. Teams can manage candidate and recruiting-channel records, review source performance, and securely access résumé files. An optional AI assistant completes job titles while editing candidate records.

## Technology stack

- **Frontend:** React, Vite, Nginx
- **Backend:** Node.js, Express, Mongoose
- **Database:** MongoDB
- **Authentication:** username/password with JWT; optional Google Identity Services
- **AI autocomplete:** optional server-side OpenAI API integration
- **Testing:** Vitest for client unit tests; Node.js test runner and `mongodb-memory-server` for API tests
- **Deployment/containerization:** Netlify configuration, Render Blueprint, Dockerfiles, and Docker Compose

## Key features

- Recruitment overview, funnel metrics, and channel comparison
- Candidate and recruiting-channel REST APIs with create, read, update, and delete operations
- Candidate-to-channel relationships and candidate pipeline search
- Password-based registration/login, JWT-protected API access, and optional Google sign-in
- Private PDF résumé upload, download, replacement, and removal
- Optional AI-assisted job-title completion in the candidate editor
- Bruno collection for exploring API endpoints
- Responsive React interface and a Docker Compose setup for local development

The overview metrics and channel comparisons currently use illustrative sample data. Candidate and channel CRUD operations use the API and MongoDB. The app does not connect to an external ATS.

## Deployment status

**The deployment is not yet ready for reviewer use.** These links are provided for setup and status checking, not as verified live application links:

- **Frontend:** No Netlify site has been published yet. [Open Netlify](https://app.netlify.com/start) and import this repository after signing in.
- **Backend service:** [talentwise-api.onrender.com](https://talentwise-api.onrender.com) — the Render service is configured, but its latest deployment failed because `MONGODB_URI` has not been configured.
- **Backend health check:** [talentwise-api.onrender.com/api/health](https://talentwise-api.onrender.com/api/health) — expected to return `{"status":"ok","database":"connected"}` after a successful deployment.

To finish deployment, configure a production MongoDB connection string as the Render service's `MONGODB_URI`, then redeploy. After deploying the frontend, set the API's `CLIENT_ORIGIN` to the exact Netlify site origin and redeploy the API. For Google sign-in, configure the same `GOOGLE_CLIENT_ID` in the frontend and API and allow the deployed frontend origin in Google Cloud. To enable AI autocomplete, set `OPENAI_API_KEY` on the API server; never put provider secrets in frontend variables or commit them.

Résumé PDFs are stored on the API service filesystem by default. Render's free service filesystem is ephemeral, so configure durable private storage before relying on résumé uploads in production.

## Run locally

### Requirements

- Node.js 22.12 or newer
- npm
- MongoDB running locally or a MongoDB connection string

1. Clone the repository:

   ```powershell
   git clone https://github.com/kutty-31/Invest-in-multiple-recuirment-channels.git
   cd Invest-in-multiple-recuirment-channels
   ```

2. Configure the API:

   ```powershell
   cd server
   Copy-Item .env.example .env
   ```

   Set `MONGODB_URI` to your MongoDB connection string. Set `JWT_SECRET` to a private random value of at least 32 bytes; generate one with:

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

   `GOOGLE_CLIENT_ID` and `OPENAI_API_KEY` are optional. `OPENAI_MODEL` defaults to `gpt-4o-mini`. Keep all secrets private.

3. Install API dependencies and start the API in the `server` directory:

   ```powershell
   npm ci
   npm start
   ```

   The API listens at `http://localhost:5000`; its health endpoint is `http://localhost:5000/api/health`.

4. In a second terminal, configure and start the frontend:

   ```powershell
   cd client
   Copy-Item .env.example .env
   npm ci
   npm run dev
   ```

   The Vite development server prints its local URL (normally `http://localhost:5173`). Set `VITE_API_URL` in `client/.env` if the API is hosted elsewhere. To enable Google sign-in locally, set `VITE_GOOGLE_CLIENT_ID` and authorize the frontend origin in Google Cloud.

## Run with Docker

Install Docker Desktop, copy `.env.docker.example` to `.env` in the repository root, and set a private `JWT_SECRET` of at least 32 bytes. Then run:

```powershell
docker compose up --build
```

Open the frontend at [http://localhost:8080](http://localhost:8080); the API health check is at [http://localhost:5000/api/health](http://localhost:5000/api/health). Compose starts MongoDB, the API, and the production frontend. MongoDB data and uploaded résumés use named local Docker volumes. Stop with `Ctrl+C`, then run `docker compose down`. To also delete the local database and résumé files, run `docker compose down --volumes`.

Set optional `GOOGLE_CLIENT_ID`, `OPENAI_API_KEY`, and `OPENAI_MODEL` in the root `.env` to enable those integrations. Do not use the development configuration as a public production deployment.

## Tests

Run the client tests, lint, and production build:

```powershell
cd client
npm test
npm run lint
npm run build
```

Run API syntax checks and tests:

```powershell
cd server
npm run check
npm test
```

## Supporting documentation

- [Backend setup and API endpoint reference](./server/README.md)
- [Frontend setup and deployment notes](./client/README.md)
- [Bruno API collection](./bruno/talentwise/)
- [Interactive Mock UX](https://raw.githack.com/kutty-31/Invest-in-multiple-recuirment-channels/feature/mock-ux-design/mock-ux.html)

## Walkthrough video

**Pending:** record and upload the project walkthrough, then replace this note with a publicly viewable video link. Demonstrate the application workflows and explain the architecture, implementation decisions, deployment status, and lessons learned. Verify the share link in a signed-out browser before submitting.
