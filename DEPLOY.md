# Deploying The Reading Room

Website + API run as **one Node.js app on Wasmer Edge**. Data lives in **Supabase Postgres**.

## 1. Create the Supabase database

1. Sign in at https://supabase.com and create a new project. Save the database password.
2. Open **Connect** (top of the project dashboard), choose the **ORMs → Prisma** tab, and copy:
   - the **Transaction pooler** string (port `6543`) → `DATABASE_URL`
   - the **Session pooler** / direct string (port `5432`) → `DIRECT_URL`
3. Copy `server/.env.example` to `server/.env` and fill in every value.
   Generate `JWT_SECRET` with:
   ```
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```

## 2. Create the tables (one time, from your computer)

```
cd server
npm install
npm run db:push
```

Run `npm run db:push` again whenever you change `server/prisma/schema.prisma`.
The app no longer changes the schema at startup.

## 3. Test locally against Supabase

```
npm run dev          # from the repo root
```

The 200+ catalog titles are added on first start. Sign in at http://localhost:5173
with your `DESK_EMAIL` / `DESK_PASSWORD`.

## 4. Deploy to Wasmer Edge

Install the CLI and sign in:

```
# Windows (PowerShell)
iwr https://win.wasmer.io -useb | iex
wasmer login
```

**Option A – from GitHub (simplest):** push this repo to GitHub, then at
https://wasmer.io choose **Deploy → Import from GitHub** and pick the repo.
Use these settings:

| Setting        | Value           |
|----------------|-----------------|
| Runtime        | Node.js 24      |
| Build command  | `npm run build` |
| Start command  | `npm start`     |
| Port           | `PORT` env var (the app reads it) |

**Option B – from your computer:** run `npm run build` in the repo root, then `wasmer deploy`
and answer the prompts with the same settings.

### Environment variables (set as secrets in the Wasmer app settings)

| Name              | Value                                   |
|-------------------|-----------------------------------------|
| `DATABASE_URL`    | Supabase transaction pooler string      |
| `JWT_SECRET`      | your random secret                      |
| `DESK_EMAIL`      | staff login email                       |
| `DESK_PASSWORD`   | staff password (12+ characters)         |
| `DESK_NAME`       | staff display name                      |
| `NODE_ENV`        | `production`                            |
| `TRUST_PROXY`     | `true`                                  |

Do **not** set `SEED_DEMO_ACCOUNTS` in production.

After the deploy, open `https://<your-app>.wasmer.app/api/health`. It should return
`{"ok":true,"ready":true}`.

## 5. Point the phone app at the live server

In the phone app's server setting, enter `https://<your-app>.wasmer.app`
(or change `DEFAULT_BASE` in `phone/src/api.ts` before building).

## Notes

- Signed-out tokens are tracked in memory, so a logout only lasts until the app restarts
  or another instance serves the request. Tokens still expire after 7 days.
- Wasmer's Node.js support is in beta. If the app fails to start there, check the
  Wasmer logs first; the most likely problem is the database driver. In that case,
  any regular Node host (Render, Railway, Fly.io) runs this app unchanged with the
  same environment variables.
