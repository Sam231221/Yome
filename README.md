# Yome

Full-stack communication platform built with Next.js, Bun, microservices, PostgreSQL, Socket.IO, and S3-backed media storage.

## Overview

Yome includes:

- direct and group chat
- direct conversations backed by a first-class `Conversation` model
- video/voice calling flows
- social dashboard features
- account/profile management
- S3-backed avatar, image, and audio uploads
- a notifications service that is currently a stub acceptance endpoint

## Architecture

### Apps

- `apps/web`: Next.js frontend

### Services

- `services/gateway`: API gateway and auth-aware routing
- `services/identity`: authentication/credential flows and profile operations (avatar upload, get/update/list users) — renamed from `services/auth` in B05, which absorbed the profile endpoints
- `services/core`: community (B06: groups, connections, invitations), learning (B07: events, projects, and everything from the now-deleted `services/resources`), feed (B08: reads for now — no write endpoint for posts/comments/likes exists yet), and dashboard (B08: composes the other three modules' reads) — `services/user`, which all four were extracted from, no longer exists
- `services/messaging`: direct/group messaging, Socket.IO, conversation resolution, and direct-call provisioning (Stream token minting + participant upsert) — renamed from `services/chat` in B09, which also absorbed call setup out of `apps/web/actions/stream.actions.ts`
- `services/media`: image/audio upload endpoints for chat media
- `services/notifications`: stub notification endpoint returning `202 Accepted`

### Shared packages

- `packages/database`: Prisma schema, client, and migrations
- `packages/contracts`: service names, error envelope, and small cross-service helpers (zero framework dependencies)
- `packages/service-kit`: Express middleware, logger, and service ports/env config
- `packages/storage`: S3 upload helpers
- `packages/cache`: Redis client, presence store, and sliding-window rate limiter (B11) — used by `services/messaging` (presence + Socket.IO fan-out) and `services/gateway` (rate limiting)
- `packages/typescript-config`: shared TS configuration
- `packages/eslint-config`: shared lint configuration

## Direct Chat Model

Direct chat now uses an explicit `Conversation` model.

- `Conversation.id`: stable string identifier for a direct thread
- `Conversation.participantAId` / `participantBId`: normalized numeric user ids
- direct messages are primarily owned by `conversationId`
- group messages are owned by `groupId`
- `receiverId` still exists as a transitional compatibility field in some payloads, but it is no longer the primary direct-chat owner

This cleanup replaced the older loose pair-based direct-message inference in the main chat paths and aligned storage ownership with durable thread identifiers.

## Media Storage

New runtime uploads use AWS S3-compatible public URLs through the shared storage helper in [packages/storage/src/s3.ts](/Users/admin/Documents/Developer/FullStackDev/Yome/packages/storage/src/s3.ts:1).

Current key layout:

- direct chat audio: `media/chat/direct/conversation-<conversationId>/messages/audio/YYYY/MM/DD/<uuid>.<ext>`
- direct chat images: `media/chat/direct/conversation-<conversationId>/messages/images/YYYY/MM/DD/<uuid>.<ext>`
- group chat media: `media/chat/groups/group-<groupId>/messages/{audio|images}/YYYY/MM/DD/<uuid>.<ext>`
- avatars: `media/users/user-<userId>/avatars/YYYY/MM/<uuid>.<ext>`

Legacy Cloudinary URLs are still supported for old rows and seeded/demo content, but new runtime uploads should use S3.

## Getting Started

### Prerequisites

- Bun
- Node.js
- PostgreSQL
- AWS S3 bucket configured for media uploads
- optional: CloudFront or an S3 public base URL for media delivery

### Install

```bash
bun install
```

### Environment

Create a single `.env` file in the monorepo root and keep it out of git. All
apps, services, and Prisma scripts load this root file for local development;
service-level env files are not used for the normal local workflow.

[`.env.example`](.env.example) is the source of truth: it lists only the variables the code
reads, grouped by area, with optional ones commented out next to their defaults. Copy it:

```bash
cp .env.example .env
```

At minimum, fill in:

- `GATEWAY_SHARED_TOKEN` and `NEXTAUTH_SECRET`, both shared by the web app and the services
- the object-storage block (`AWS_*`). It's set up for Supabase Storage; for plain AWS S3, leave
  `AWS_S3_ENDPOINT` unset
- `NEXT_PUBLIC_STREAM_API_KEY` and `STREAM_SECRET_KEY` for calls

The local database and Redis URLs already point at `bun run infra:up` (docker-compose.yml).
For deployed values, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

### Database

Run the Prisma migration flow from the database package:

```bash
bun run --cwd packages/database db:migrate
```

### Development

Start everything:

```bash
bun run dev
```

Or start services separately:

```bash
bun run dev:services
bun run dev:web
```

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for a step-by-step guide to deploying on Vercel (web), Railway (services, Postgres and Redis) and Supabase Storage (media).

## Validation And Tests

Useful verification commands:

```bash
bun run check-types:all
bunx tsc -p apps/web/tsconfig.json --noEmit
bun run --cwd services/messaging test
bun run --cwd packages/storage test
bun run --cwd packages/contracts test
```

## Current Status

Completed recently:

- auth, user, and chat route validation
- `receiver` naming cleanup
- direct conversation model rollout
- S3 migration for runtime chat media and avatars
- chat bootstrap/error-handling cleanup
- audio send/playback fixes
- stricter web chat types and reducer actions
- auth/account validation wording polish

Still intentionally incomplete:

- notifications delivery backend
- full dashboard/account API helper standardization
- optional historical Cloudinary-to-S3 backfill
