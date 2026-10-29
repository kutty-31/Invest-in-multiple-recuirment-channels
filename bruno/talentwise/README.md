# Talentwise API — Bruno collection

This collection documents the Talentwise Express API. Open `bruno/talentwise` in Bruno, select the **Local** environment, and run the health check first.

## Local setup

1. Start the API and MongoDB using the instructions in [`../../server/README.md`](../../server/README.md).
2. Set `baseUrl` in `environments/Local.bru` if the API is not at `http://localhost:5000/api`.
3. Run **Register** or **Login**. The post-response script saves the returned app JWT into the environment's `token` variable.
4. Replace `channelId` and `candidateId` with IDs returned by the create/list requests before running resource-specific templates.
5. To test **Google sign-in**, replace `googleCredential` with a current Google Identity Services ID token. The API and client must be configured with the same Google OAuth Web client ID.
6. To test **Upload candidate resume**, place a PDF beside that request file as `resume.pdf`, or change its `@file(...)` path. Uploads are limited to 5 MB.

## Authentication

Health and the register, login, and Google sign-in requests are public. All other requests use `Authorization: Bearer {{token}}`. Tokens expire after one hour; sign in again to refresh the environment variable.

## Collection coverage

- Health check
- Username/password registration and login, Google sign-in, and current user
- Recruiting channel list, create, read, patch, replace, delete/archive, and related candidates
- Candidate list, create, bulk create, read, patch, replace, delete, and resume upload/download/removal
- Overview and channel analytics

Request examples use placeholder IDs and representative JSON. Consult the server README for validation rules, query options, file upload constraints, and response semantics.
