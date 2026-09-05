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
- `services/user`: dashboard aggregation and learning reads (events, projects) — groups and connections moved to `services/core` in B06; the rest moves out in B07/B08, after which this service is retired
- `services/core`: community domain (groups, connections, invitations) since B06; learning and feed/dashboard modules join it in B07/B08
- `services/chat`: direct/group messaging, Socket.IO, conversation resolution
- `services/media`: image/audio upload endpoints for chat media
- `services/notifications`: stub notification endpoint returning `202 Accepted`

### Shared packages

- `packages/database`: Prisma schema, client, and migrations
- `packages/contracts`: service names, error envelope, and small cross-service helpers (zero framework dependencies)
- `packages/service-kit`: Express middleware, logger, and service ports/env config
- `packages/storage`: S3 upload helpers
- `packages/shared`: compatibility re-export shim over the three packages above — being retired, see [docs/services_packages_refactoring](docs/services_packages_refactoring/)
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

Gateway and auth:

- `GATEWAY_SHARED_TOKEN`
- `GATEWAY_REQUIRE_AUTH`
- `INTERNAL_TOKEN_GUARD_ENABLED`
- `NEXTAUTH_SECRET`
- `JWT_KEY`
- `GATEWAY_RATE_WINDOW_MS`
- `GATEWAY_RATE_MAX_REQUESTS`

Service ports and URLs:

- `GATEWAY_PORT`
- `IDENTITY_SERVICE_PORT`
- `USER_SERVICE_PORT`
- `CHAT_SERVICE_PORT`
- `MEDIA_SERVICE_PORT`
- `NOTIFICATIONS_SERVICE_PORT`
- `IDENTITY_SERVICE_URL`
- `USER_SERVICE_URL`
- `CHAT_SERVICE_URL`
- `MEDIA_SERVICE_URL`
- `NOTIFICATIONS_SERVICE_URL`

Database:

- `DATABASE_URL`
- `DIRECT_URL`

Frontend:

- `NEXT_PUBLIC_BACKEND_API`
- `NEXT_PUBLIC_CHAT_SOCKET_URL`
- `FRONTEND_URL`
- `FRONTEND_CLIENT_PORT` is a legacy alias; prefer `FRONTEND_URL`.

Object storage:

- `STORAGE_PROVIDER`
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET`
- `AWS_S3_PUBLIC_BASE_URL` or `AWS_CLOUDFRONT_URL`
- optional `AWS_S3_PREFIX`

Stream chat/video:

- `NEXT_PUBLIC_STREAM_API_KEY`
- `STREAM_SECRET_KEY`

Development-only seed/reset routes:

- `ENABLE_DEV_SEED_ROUTES`
- `DEV_SEED_ROUTE_TOKEN`

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

## Validation And Tests

Useful verification commands:

```bash
bun run check-types:all
bunx tsc -p apps/web/tsconfig.json --noEmit
bun run --cwd services/chat test
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
