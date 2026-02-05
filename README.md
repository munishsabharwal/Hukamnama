
# Daily Hukamnamas — Azure Static Web Apps Starter

This repository is a **browser-only** starter for hosting a public Daily Hukamnamas site with **Admin** and **Editor** areas on **Azure Static Web Apps (SWA)**. It uses:

- **SWA managed auth** with **Microsoft Entra External ID** via a **custom OpenID Connect provider**
- **Azure Functions** for APIs
- **Azure Cosmos DB (NoSQL, serverless)** for data
- **Azure Communication Services (Email)** for invitations/notifications

## Quick start
1. Create Microsoft Entra **External ID** tenant + **Sign-up/Sign-in** user flow.
2. Create **Cosmos DB** (serverless) database `hukamdb` with containers: `HukamLibrary` (pk `/id`), `DailyPublications` (pk `/gurudwaraCode`), and `Users` (pk `/id`).
3. Create a **Static Web App** from this GitHub repo (App location: `/frontend`, API location: `/api`).
4. In SWA **Configuration**, set these app settings:
   - `EXTERNALID_CLIENT_ID`
   - `EXTERNALID_CLIENT_SECRET`
   - `COSMOS_CONN`
   - `ACS_CONN_STRING`
   - `FROM_EMAIL`
   - `PUBLIC_URL` (e.g., `https://<yourswa>.azurestaticapps.net`)
5. Update `frontend/staticwebapp.config.json` with your **External ID** well-known URL.
6. (Optional) Import `data/hukamLibrary.sample.json` into Cosmos `HukamLibrary` via Data Explorer.

## Routes
- `/` public cards + filters
- `/editor` Editor hub (role: `editor` or `admin`)
- `/admin` Admin panel (role: `admin`)

## Notes
- Role assignment uses SWA **auth.rolesSource** (`/api/getRoles`) to map roles from the `Users` container based on email.
- Secrets/keys live in SWA **Configuration** (never commit keys to the repo).
