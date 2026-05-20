# Conduit

A personal task pipeline. Paste a JSON or CSV export of a single task, review the cleaned-up
result, and Conduit creates a formatted Notion page **and** a TickTick task in one step.

Single user, single password, no database. Deploys as one Next.js app to Vercel.

## How it works

1. Paste a JSON export or upload a CSV on the main screen.
2. Conduit normalizes the task (cleans the HTML description, drops empty fields, maps the
   core fields, dumps everything else into a "Details" section).
3. You review the result, adjust the title and dates, and confirm.
4. Conduit creates (or updates, if the ID already exists) a Notion page in your Tasks
   database and creates a TickTick task with the same content.

Re-submitting the same export is safe — the Notion page is matched by its ID property and
updated in place.

## Requirements

- Node.js 20+
- A Notion workspace with a Tasks database and an internal integration that has access to it
- A TickTick account with OAuth credentials from the developer portal

## Setup

### 1. Install

```bash
npm install
cp .env.example .env.local
```

### 2. Fill in the easy values

In `.env.local`:

- `APP_PASSWORD` — anything strong. This is what you'll type on the login screen.
- `SESSION_PASSWORD` — 32+ character random string. Generate with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

### 3. Get the Notion token + data source ID

1. Create an internal integration at <https://www.notion.so/profile/integrations>.
2. Copy the integration token (starts with `ntn_`) into `NOTION_TOKEN`.
3. Open your **Tasks** database in Notion, click `•••` → **Connections** → add the
   integration.
4. Grab the database ID from the URL: `https://www.notion.so/<workspace>/<DATABASE_ID>?v=...`
   (the 32-char hex string).
5. Run the helper script to turn that database ID into a data source ID:
   ```bash
   npx tsx scripts/notion-datasource.ts <database_id>
   ```
   Copy the printed value into `NOTION_DATA_SOURCE_ID`.

The Tasks database must already have these properties (other properties are ignored):

| Property     | Type   |
| ------------ | ------ |
| Title        | title  |
| ID           | text   |
| Priority     | select |
| Status       | status |
| Project      | select |
| Select       | select |
| Created Date | date   |
| Due Date     | date   |
| Start Date   | date   |

The Status property is special — its options must exist before Conduit can use them. The
source-to-Notion status mapping lives in `lib/mappers.ts` (`NOTION_STATUS_MAP`); edit it to
match the option names you have.

### 4. Get the TickTick access token (one-time)

TickTick uses OAuth, but Conduit is single-user, so you do the handshake once and store the
resulting token.

1. Register an app at <https://developer.ticktick.com/manage>. Set the redirect URI to
   `http://localhost:3000/api/ticktick/callback` for local setup (and your production URL
   later).
2. Put the client ID and secret in `.env.local` as `TICKTICK_CLIENT_ID` and
   `TICKTICK_CLIENT_SECRET`.
3. Start the dev server (`npm run dev`), log in to Conduit, then open
   <http://localhost:3000/api/ticktick/auth> in your browser.
4. Approve the consent screen. You'll land on a page that prints the access token.
5. Copy the token into `TICKTICK_ACCESS_TOKEN` and restart the dev server.

If you want tasks to land in a specific list instead of the Inbox, set `TICKTICK_PROJECT_ID`
to that list's ID.

## Run locally

```bash
npm run dev
```

Open <http://localhost:3000>, enter `APP_PASSWORD`, paste a task export.

## Tests

```bash
npm test
```

Covers the CSV parser, HTML cleaner, the presence-driven transform, and the label/priority
mappers.

## Deploy to Vercel

1. Push the repo to GitHub.
2. Import the project at <https://vercel.com/new>.
3. In Project Settings → Environment Variables, add every variable from `.env.example`
   (production + preview).
4. After the first deploy, update the TickTick redirect URI in the developer portal to
   `https://<your-vercel-domain>/api/ticktick/callback`. If you re-run the OAuth flow in
   production, do it against the deployed URL.
5. Visit the deployed URL and log in.

No background jobs, no database — every request is stateless. The session cookie is the
only state Conduit keeps.

## Environment variables

See `.env.example` for the full list with inline comments. Summary:

| Variable                 | Required | Notes                                         |
| ------------------------ | -------- | --------------------------------------------- |
| `APP_PASSWORD`           | yes      | Login password                                |
| `SESSION_PASSWORD`       | yes      | 32+ char secret for iron-session              |
| `NOTION_TOKEN`           | yes      | Internal integration token (`ntn_...`)        |
| `NOTION_DATA_SOURCE_ID`  | yes      | From `scripts/notion-datasource.ts`           |
| `TICKTICK_CLIENT_ID`     | setup    | Only needed to run `/api/ticktick/auth`       |
| `TICKTICK_CLIENT_SECRET` | setup    | Only needed to run `/api/ticktick/auth`       |
| `TICKTICK_ACCESS_TOKEN`  | yes      | Long-lived token from the one-time OAuth flow |
| `TICKTICK_PROJECT_ID`    | no       | Target list; if empty, tasks go to the Inbox  |

Never commit `.env.local` — it's gitignored.
