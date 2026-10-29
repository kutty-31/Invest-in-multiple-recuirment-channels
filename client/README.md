# Talentwise React client

The Talentwise client is a React frontend scaffolded with Vite. Its current screens are an interactive, sample-data prototype for the recruiting overview, channel performance comparison, and candidate pipeline. Data is local to the frontend; no API or database is connected yet.

## Component structure

- `src/components/Sidebar.jsx` and `Topbar.jsx` provide shared application navigation and context.
- `PageHeading.jsx` displays the active screen title and page actions.
- `OverviewDashboard.jsx`, `ChannelsPage.jsx`, and `CandidatePipeline.jsx` compose the primary product screens.
- `MetricCard.jsx`, `ChannelTable.jsx`, and `CandidateTable.jsx` are reusable data-display components.
- `src/data/recruiting.js` contains the illustrative recruiting records used by the prototype.

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
