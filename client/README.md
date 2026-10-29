# Talentwise React client

The Talentwise client is a React frontend scaffolded with Vite. The sign-in screen supports username/password and Google sign-in; candidate records are loaded from the authenticated API and edits/deletions are persisted to MongoDB. Overview metrics and channel comparisons remain illustrative sample data.

## Component structure

- `src/components/Sidebar.jsx` and `Topbar.jsx` provide shared application navigation and context.
- `PageHeading.jsx` displays the active screen title and page actions.
- `OverviewDashboard.jsx`, `ChannelsPage.jsx`, and `CandidatePipeline.jsx` compose the primary product screens.
- `MetricCard.jsx`, `ChannelTable.jsx`, and `CandidateTable.jsx` are reusable data-display components.
- `src/api/auth.js` provides authentication, candidate, and channel API requests.
- `src/data/recruiting.js` contains illustrative records used by the sample-data overview.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Run locally

From this directory:

```powershell
npm install
npm run dev
```

Vite prints a local development URL after the server starts.

Copy `.env.example` to `.env` in this directory and set `VITE_GOOGLE_CLIENT_ID` to your Google Cloud OAuth 2.0 Web client ID to enable the Google button. Configure the same ID as `GOOGLE_CLIENT_ID` in the API's `server/.env`. Add the Vite origin (usually `http://localhost:5173`) to authorized JavaScript origins in Google Cloud Console. Start the API from `server/` with a configured MongoDB connection and `JWT_SECRET` before signing in. Set `VITE_API_URL` if the API is not at `http://localhost:5000/api`.

## Validate

```powershell
npm run lint
npm run build
```

## Available scripts

- `npm run dev` — start the Vite development server
- `npm run build` — create a production build in `dist/`
- `npm run preview` — preview the production build locally
- `npm run lint` — run Oxlint
