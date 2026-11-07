# CEO - Natheelco Taskflow

Taskflow management and CEO dashboard application for Natheelco Al Khaleej.

## Setup & Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```
   This installs both the main frontend and the integrated Cash Bank Dashboard.

2. Start the Node.js backend from a second terminal:
   ```powershell
   cd Backend
   npm start
   ```
   It listens on `localhost:8889` and stores application data under `Backend/data` and uploaded files under `Backend/uploads`.

3. Start the frontend:
   ```bash
   npm run dev
   ```
   Vite proxies `/api` to the backend. On first launch, create the admin PIN. To run the standalone browser demo intentionally, use `npm run dev:frontend-only`.

4. Build for production:
   ```bash
   npm run build
   ```
   The Cash Bank Dashboard is built under `/cash-bank/` and is opened from its sidebar button. Its deployable source is in `cash-bank-app`; the separate `Mrs noura` repository is left untouched.

## Roles & user PINs

The Roles sidebar page lets the dashboard admin create users with unique 4-digit PINs and assign access to dashboard sections. With the backend enabled, PINs are salted and hashed on the server, and API routes enforce section permissions. Frontend-only mode keeps users and PINs in that browser and is only a demo convenience, not server-side authentication.

## ClickUp synchronization

The Vercel serverless endpoint at `/api/clickup` reads `CLICKUP_API_TOKEN` from the server environment and fetches workspace tasks, members, and spaces from ClickUp. Add the token as a Vercel environment variable for the production deployment; never add it to frontend `VITE_` variables or source files. The endpoint is read-only, refreshes automatically every 30 seconds in the dashboard, and keeps a short server-side cache.

The endpoint returns workspace task data, so protect the production deployment with Vercel Deployment Protection/SSO. Never expose the ClickUp token in a `VITE_` variable. For local development, the Node backend at `localhost:8889` serves the ClickUp route through the Vite proxy.

## Foodics Management

Task records, meetings, projects/configuration, HR records, Natheel Gulf project metadata, Foodics records, Foodics workflow progress, ClickUp snapshots, and uploaded files are stored by the backend and shared across authenticated sessions. Dashboard display preferences are saved separately for each user. The backend uses a SQLite database and local file storage, so production deployments require persistent storage and a backup plan. Uploaded files and database contents are not encrypted at rest. The admin-only Activity Log records data changes without capturing confidential field values. Document classifications and Foodics labels are organizational labels, not access controls.
