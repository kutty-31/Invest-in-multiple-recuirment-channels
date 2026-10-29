# Talentwise

Talentwise is a responsive recruitment analytics dashboard for comparing hiring sources, monitoring the candidate funnel, and tracking candidate quality.

## Capstone Project Idea

Talentwise will grow into a MERN recruitment-channel intelligence platform for recruiters, people leads, and hiring managers. It will bring candidate pipeline and channel performance data together so teams can compare application volume, hire conversion, candidate quality, time to hire, and recruitment cost, then make better-informed sourcing decisions.

The initial capstone scope includes a recruiting performance dashboard, channel comparison, candidate pipeline management, and actionable insights. The current dashboard is a front-end concept using sample data; the capstone plan below covers the intended full-stack implementation.

## Day-by-Day Capstone Plan

| Day | Plan |
| --- | --- |
| Day 1 | Confirm project scope, user needs, success measures, user journeys, and the initial UX wireframes. |
| Day 2 | Design MongoDB models for candidates, recruiting channels, and hiring activity; scaffold the Express and React applications. |
| Day 3 | Build the backend API and connect it to MongoDB; implement candidate and recruiting-channel create, read, update, and delete operations. |
| Day 4 | Build the React dashboard, summary metrics, hiring funnel, and channel comparison views using API data. |
| Day 5 | Add candidate search and filters, stage updates, date-range controls, and report export. |
| Day 6 | Test core user journeys and API behavior; fix defects and refine accessibility, responsive layouts, and error handling. |
| Day 7 | Prepare sample data, deploy the application, document setup and usage, and review the completed capstone against its requirements. |

## Mock UX Design

Design preview: [Open the interactive Mock UX](https://raw.githack.com/kutty-31/Invest-in-multiple-recuirment-channels/feature/mock-ux-design/mock-ux.html)  
Source: [mock-ux.html](https://github.com/kutty-31/Invest-in-multiple-recuirment-channels/blob/feature/mock-ux-design/mock-ux.html)

This mock UX communicates the primary overview, channel comparison, candidate pipeline, and core hiring journeys. It uses sample data to show how people teams move from hiring insights to recruiting decisions.

## Run the existing dashboard

No build step, package installation, or framework is required. Open `index.html` in a modern browser, or use a local static-file server such as the VS Code Live Server extension.

## React client

The Vite-powered React frontend is in [`client/`](./client/). From that folder, install dependencies with `npm install` and run the development server with `npm run dev`. The sign-in screen supports username/password and Google authentication through the Express API; the overview and channel comparison screens continue to use sample data.

## Mongoose models

The Express API connects to MongoDB through `MONGODB_URI` and uses Mongoose to read and write recruiting channels and candidates. See [`server/README.md`](./server/README.md) for setup, API endpoints, and tests.

## Bruno API collection

The importable Bruno request collection is in [`bruno/talentwise/`](./bruno/talentwise/). It covers health, authentication, recruiting channels, candidates and résumé files, and analytics. See its README for local environment and token setup.

## What’s included

- Overview metrics for applicants, hires, hiring time, and cost per hire
- Date filters, a six-month hiring chart, and an application-to-hire funnel
- Recruiting-channel comparisons for volume, conversion, quality, and cost
- A package comparison section with starter, growth, scale-up, and executive recruiting plans
- Candidate search and a form for adding candidates to the pipeline
- Username/password registration and sign-in with protected recruiting API access
- Authenticated candidate PDF resume uploads, downloads, and removal
- Hire dates and time-to-hire tracking for successful hires
- CSV export of candidate records in the selected reporting period
- Authenticated candidate updates and deletions persisted to MongoDB
- Responsive layouts, keyboard-accessible controls, and small-screen navigation

The overview and channel comparison use an included sample dataset. Candidate records are loaded from MongoDB through the authenticated API and updates/deletions are persisted there. The application does not connect to an external ATS.
