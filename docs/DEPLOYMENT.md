# Deploying Yome: Vercel + Railway (+ Supabase Storage)

This guide deploys the full stack on low-cost managed platforms:

| Piece | Platform | Cost |
|---|---|---|
| `apps/web` (Next.js) | Vercel (Hobby) | Free, for non-commercial use |
| 6 backend services (`services/*`) | Railway (Hobby) | $5/mo, which includes $5 of usage |
| PostgreSQL | Railway (same project) | Billed as usage; never pauses |
| Redis | Railway (same project) | Billed as usage |
| Media storage (S3-compatible) | Supabase Storage | Free: 1 GB |

Expect about $8–12/month of Railway usage in total, so slightly more than the $5 that's included.
| Calls and video | GetStream | Free tier |

```
Browser ──► Vercel (Next.js, NextAuth)
   │  │
   │  └──► Railway: gateway (public) ──► identity / core / media / notifications / messaging
   │                                      (private network: *.railway.internal)
   └────► Railway: messaging (public, Socket.IO WebSockets)

All services ──► Railway Postgres + Railway Redis (private network)   Supabase Storage (S3 API)
```

Only `gateway` and `messaging` get public URLs. The other four services are reachable only over
Railway's private network, and they still require the `GATEWAY_SHARED_TOKEN` bearer token through
`internalTokenGuard`.

Keep a scratch note open while you work: each step produces a URL or secret that a later step needs.

---

## 0. Generate shared secrets

Run these locally and save the output:

```bash
openssl rand -base64 32
```

Use it as **`NEXTAUTH_SECRET`**. Vercel signs sessions and socket tokens with it, and the gateway
and messaging verify with it, so all three must use the same value.

```bash
openssl rand -hex 32
```

Use it as **`GATEWAY_SHARED_TOKEN`**. It's the token between web and gateway, and between gateway and the services.

---

## 1. Supabase: storage (media uploads only)

Supabase is used only for files here; the database is on Railway.

1. Create a project at [supabase.com](https://supabase.com), in a region near your Railway region.
2. Go to **Storage → New bucket**, name it `media`, and turn **Public bucket** on.
3. Go to **Project Settings → Storage → S3 Connection**. Enable it and **create an access key**.
4. Note these values:
   ```
   STORAGE_PROVIDER=s3
   AWS_REGION=<the region shown on the S3 Connection page, e.g. ap-south-1>
   AWS_ACCESS_KEY_ID=<access key id>
   AWS_SECRET_ACCESS_KEY=<secret access key>
   AWS_S3_BUCKET=media
   AWS_S3_ENDPOINT=https://<ref>.storage.supabase.co/storage/v1/s3
   AWS_S3_FORCE_PATH_STYLE=true
   AWS_S3_PUBLIC_BASE_URL=https://<ref>.supabase.co/storage/v1/object/public/media
   ```
   `AWS_S3_ENDPOINT` and `AWS_S3_FORCE_PATH_STYLE` point `@repo/storage` at Supabase instead of AWS.
   Uploaded files are served from `AWS_S3_PUBLIC_BASE_URL`.

## 2. GetStream: calls

1. Create a free app at [getstream.io](https://getstream.io).
2. Copy its key and secret:
   ```
   NEXT_PUBLIC_STREAM_API_KEY=<api key>
   STREAM_SECRET_KEY=<api secret>
   ```

---

## 3. Railway: database, Redis and backend services

Each service has a config-as-code file at `services/<name>/railway.json`. It tells Railway to:
- build `Dockerfile.service`;
- health-check `/health`;
- redeploy only when that service, `packages/`, the Dockerfile or the lockfile changes.

`services/core/railway.json` also has a **pre-deploy command**,
`bun run --cwd packages/database db:migrate`. Before each new core deployment goes live, it applies
any pending Prisma migrations to the Railway database, so you never run migrations by hand.

### 3.1 Create the project, database and services

1. Sign up at [railway.com](https://railway.com) with GitHub and upgrade to the **Hobby** plan.
2. Create a project with **New Project → Deploy from GitHub repo**, and pick this repo. That
   creates the first service. Click **+ Create → GitHub Repo** five more times, picking the same
   repo, so you end up with 6 services.
3. Rename the services exactly: `gateway`, `identity`, `core`, `messaging`, `media`,
   `notifications`. The reference variables below depend on these names.
4. Click **+ Create → Database → Add PostgreSQL**, then **+ Create → Database → Add Redis**. Leave
   their names as `Postgres` and `Redis`; the variables below reference them by those names.
   Don't generate public domains for either. They're reachable only over the private network.
5. In **Settings**, set these for **each** of the 6 app services:
   - **Source → Root Directory:** leave empty (repo root). The Dockerfile needs the whole monorepo.
   - **Source → Branch:** `production`.
   - **Config-as-code → Railway config file:** `/services/<name>/railway.json`.
   - **Deploy → Region:** the same region for all six, and the same as Postgres and Redis.

### 3.2 Shared variables (Project → Settings → Shared Variables)

Add these once. Then on each service, open **Variables → Shared Variable** and share them all into it.

```
NODE_ENV=production

# Database (Railway Postgres, private network)
DATABASE_URL=${{Postgres.DATABASE_URL}}
DIRECT_URL=${{Postgres.DATABASE_URL}}
DATABASE_POOL_MAX=2

# Redis (Railway Redis, private network). Keep the ?family=0: ioredis looks up IPv4 only by
# default, and *.railway.internal hostnames can be IPv6-only, which fails with ENOTFOUND.
REDIS_URL=${{Redis.REDIS_URL}}?family=0

# Auth / internal trust
NEXTAUTH_SECRET=<from step 0>
GATEWAY_SHARED_TOKEN=<from step 0>
GATEWAY_REQUIRE_AUTH=true
INTERNAL_TOKEN_GUARD_ENABLED=true
GATEWAY_RATE_WINDOW_MS=60000
GATEWAY_RATE_MAX_REQUESTS=120

# CORS origin for gateway + Socket.IO. Use a placeholder now and fix it after step 4.
FRONTEND_URL=https://<your-app>.vercel.app

# Storage (all the values from step 1)
STORAGE_PROVIDER=s3
AWS_REGION=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=media
AWS_S3_ENDPOINT=https://<ref>.storage.supabase.co/storage/v1/s3
AWS_S3_FORCE_PATH_STYLE=true
AWS_S3_PUBLIC_BASE_URL=https://<ref>.supabase.co/storage/v1/object/public/media

# GetStream
NEXT_PUBLIC_STREAM_API_KEY=...
STREAM_SECRET_KEY=...

# Never on in production
ENABLE_DEV_SEED_ROUTES=false
ENABLE_DEV_USER_SYNC=false

# Ports (each service reads its own one)
GATEWAY_PORT=4100
IDENTITY_SERVICE_PORT=4101
MESSAGING_SERVICE_PORT=4103
MEDIA_SERVICE_PORT=4104
NOTIFICATIONS_SERVICE_PORT=4105
CORE_SERVICE_PORT=4107

# Internal URLs over Railway's private network (Railway resolves the ${{...}} references)
IDENTITY_SERVICE_URL=http://${{identity.RAILWAY_PRIVATE_DOMAIN}}:4101
MESSAGING_SERVICE_URL=http://${{messaging.RAILWAY_PRIVATE_DOMAIN}}:4103
MEDIA_SERVICE_URL=http://${{media.RAILWAY_PRIVATE_DOMAIN}}:4104
NOTIFICATIONS_SERVICE_URL=http://${{notifications.RAILWAY_PRIVATE_DOMAIN}}:4105
CORE_SERVICE_URL=http://${{core.RAILWAY_PRIVATE_DOMAIN}}:4107
```

If Railway won't resolve service references inside shared variables, add the five `*_SERVICE_URL`
lines directly to **gateway** instead, and add `MESSAGING_SERVICE_URL` to **media**, which calls
messaging directly. Those are the only services that read them.

### 3.3 Per-service variable

On **each** service, add one service variable. Railway passes it to the Dockerfile as the
`SERVICE_DIR` build argument:

| Service | Variable |
|---|---|
| gateway | `SERVICE_DIR=services/gateway` |
| identity | `SERVICE_DIR=services/identity` |
| core | `SERVICE_DIR=services/core` |
| messaging | `SERVICE_DIR=services/messaging` |
| media | `SERVICE_DIR=services/media` |
| notifications | `SERVICE_DIR=services/notifications` |

### 3.4 Public domains

Go to **Settings → Networking → Generate Domain**, but **only** on these two services:

| Service | Target port | Used as |
|---|---|---|
| gateway | `4100` | `NEXT_PUBLIC_BACKEND_API` |
| messaging | `4103` | `NEXT_PUBLIC_CHAT_SOCKET_URL` (Railway supports WebSockets) |

Leave `identity`, `core`, `media` and `notifications` without a public domain.

### 3.5 Deploy and check

Deploy **core first** and wait until it's green. Its pre-deploy step creates the database tables, and
the other services need them. Then deploy the other five with **Deploy**. After the first time,
pushing to `production` redeploys everything that changed, and core migrates before going live.
When they're green, open these:
- `https://<gateway-domain>/health` should return `{"ok":true,"service":"gateway","services":{...}}`, and the
  upstream URLs should be `*.railway.internal` addresses.
- `https://<messaging-domain>/health` should return `{"ok":true,"service":"messaging"}`.

If a service crashes on boot, check its **Deploy Logs**. The usual cause is a missing variable,
because the services throw on startup without `GATEWAY_SHARED_TOKEN`, `NEXTAUTH_SECRET` or `REDIS_URL`.
If **core** fails in the *pre-deploy* phase, the migration failed; its log shows the Prisma error.

### 3.6 Seed data (optional)

The database is private, so to seed it or inspect it from your machine:
1. Open the **Postgres** service, go to **Variables**, and copy `DATABASE_PUBLIC_URL`.
2. Put it in your local `.env` as `DATABASE_URL` and `DIRECT_URL`, and run your usual seed
   command.
3. Switch your `.env` back to the local database afterwards.

Traffic over the public URL counts as Railway egress, so use it for one-off jobs only. Railway's
Postgres **Data** tab also lets you browse tables without connecting from your machine.

---

## 4. Vercel: web app

1. At [vercel.com](https://vercel.com), go to **Add New → Project** and import this repo.
2. In **Configure Project**, set:
   - **Root Directory:** `apps/web`. Then enable **Include files outside the root directory in
     the Build Step**.
   - **Framework Preset:** Next.js (auto-detected). Leave the Install and Build commands at their
     defaults. Vercel uses Bun because of `bun.lock`.
3. Add these **Environment Variables** for Production:
   ```
   NEXTAUTH_SECRET=<same as Railway>
   NEXTAUTH_URL=https://<your-app>.vercel.app
   GATEWAY_SHARED_TOKEN=<same as Railway>

   NEXT_PUBLIC_BACKEND_API=https://<gateway-domain>
   NEXT_PUBLIC_CHAT_SOCKET_URL=https://<messaging-domain>
   NEXT_PUBLIC_STREAM_API_KEY=<same as Railway>

   # next.config.js uses this to allow images from Supabase Storage
   AWS_S3_PUBLIC_BASE_URL=https://<ref>.supabase.co/storage/v1/object/public/media

   # OAuth (only the providers you use)
   GOOGLE_ID=...
   GOOGLE_CLIENT_SECRET=...
   GITHUB_ID=...
   GITHUB_SECRET=...
   FACEBOOK_CLIENT_ID=...
   FACEBOOK_CLIENT_SECRET=...

   ENABLE_DEV_SEED_ROUTES=false
   ENABLE_DEV_USER_SYNC=false
   ```
   `NEXT_PUBLIC_*` values and `AWS_S3_PUBLIC_BASE_URL` are baked in **at build time**. After
   changing them, redeploy.
4. Click **Deploy**. Then go to **Settings → Git** and set the **Production Branch** to `production`.
5. Point the OAuth providers' callback URLs at the Vercel domain:
   - Google: `https://<your-app>.vercel.app/api/auth/callback/google`
   - GitHub: `https://<your-app>.vercel.app/api/auth/callback/github`
   - Facebook: `https://<your-app>.vercel.app/api/auth/callback/facebook`
6. Go back to Railway and set `FRONTEND_URL` to the **exact** final Vercel URL, with no trailing
   slash. The gateway's CORS and messaging's Socket.IO only accept that one origin. Railway
   redeploys the services when the variable changes.

The GitHub workflow `.github/workflows/deploy-web.yml` only deploys when the `VERCEL_*` secrets are
set in GitHub. Vercel's Git integration already deploys on push, so **don't** add those secrets,
or every push gets deployed twice. Without them the workflow just acts as a build check.

---

## 5. Smoke test

1. Open the Vercel URL and sign up or sign in.
2. Open a second browser (or an incognito window) as another user and send a direct message. It
   should arrive live; that's the Socket.IO path through messaging and Railway Redis.
3. Upload an avatar or a chat image. It should load from `…supabase.co/storage/v1/object/public/media/…`.
4. Start an audio or video call. Tokens are minted by messaging and the call runs through GetStream.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Browser console shows CORS errors calling the gateway | `FRONTEND_URL` on Railway doesn't exactly match the Vercel origin. Note that preview deployments use different URLs. |
| Socket never connects, or gets `unauthorized` | `NEXT_PUBLIC_CHAT_SOCKET_URL` is wrong, or the `NEXTAUTH_SECRET` values differ between Vercel and Railway. |
| Gateway returns 502/503 for one route | That service is down, or its `*_SERVICE_URL` or port is wrong. Check that the service's deploy logs say it's listening. |
| `401` from internal services | The `GATEWAY_SHARED_TOKEN` values differ between Vercel and Railway. |
| Upload fails with `SignatureDoesNotMatch` or `NoSuchBucket` | `AWS_S3_ENDPOINT`, `AWS_REGION` or `AWS_S3_FORCE_PATH_STYLE=true` is missing or wrong. |
| Images upload but Next.js refuses to render them | `AWS_S3_PUBLIC_BASE_URL` wasn't set on Vercel at build time. Set it and redeploy. |
| `Can't reach database server` | `DATABASE_URL` isn't the `${{Postgres.DATABASE_URL}}` reference, or the service is in a different region or environment from Postgres. |
| `relation "…" does not exist` | Migrations haven't run yet. Redeploy **core**, then the failing service. |
| Redis `ENOTFOUND redis.railway.internal` | `?family=0` is missing from `REDIS_URL`. |
| Spending creeps above $5 | Check Railway's **Usage** page and set a usage limit in **Account → Usage**. |

## Day-2 operations

- **Deploys:** pushing to `production` redeploys only the Railway services whose watch patterns
  match, and Vercel redeploys the web app.
- **Migrations:** they're automatic. A new migration under `packages/database/prisma/migrations`
  matches core's `packages/**` watch pattern, so core redeploys and its pre-deploy step applies the
  migration. Keep migrations backward-compatible (add first, remove later), because the other
  services may briefly run old code against the new schema.
- **Scaling:** raise `numReplicas` in a service's `railway.json`. Messaging fans out through the
  Redis adapter, and the outbox relay uses `SKIP LOCKED`, so replicas are safe. Watch the Postgres
  connection count, which is `DATABASE_POOL_MAX` times the total number of replicas.
