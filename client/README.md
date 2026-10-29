# Talentwise React client

The Talentwise client is a React frontend scaffolded with Vite. The sign-in screen supports username/password and Google sign-in; candidate records are loaded from the authenticated API, edits/deletions are persisted to MongoDB, and PDF resumes can be uploaded, downloaded, and removed. Overview metrics and channel comparisons remain illustrative sample data.

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

## Deploy to Netlify

The repository root contains a `netlify.toml` configured for this Vite app. In Netlify, choose **Add new site → Import an existing project**, connect the GitHub repository, and select the `main` branch after this deployment setup is merged. Netlify will use `client/` as the base directory, run `npm run build`, and publish `dist/`. The API URL is set to `https://talentwise-api.onrender.com/api`; override `VITE_API_URL` in Netlify site environment variables if your API URL differs. If Google sign-in is enabled, set `VITE_GOOGLE_CLIENT_ID` in Netlify to the public OAuth Web client ID.

After Netlify assigns the site a URL, set the Render API's `CLIENT_ORIGIN` environment variable to that exact URL (for example, `https://your-site-name.netlify.app`) and redeploy the API. The API also requires a working production `MONGODB_URI`; without it, sign-in and database-backed features will not work. Add the Netlify site origin to the Google OAuth client's authorized JavaScript origins when using Google sign-in.

## Available scripts

- `npm run dev` — start the Vite development server
- `npm run build` — create a production build in `dist/`
- `npm run preview` — preview the production build locally
- `npm run lint` — run Oxlint
