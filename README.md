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
- `services/auth`: authentication and credential flows
- `services/user`: profile and user operations, including avatar upload
- `services/chat`: direct/group messaging, Socket.IO, conversation resolution
- `services/media`: image/audio upload endpoints for chat media
- `services/notifications`: stub notification endpoint returning `202 Accepted`

### Shared packages

- `packages/database`: Prisma schema, client, and migrations
- `packages/shared`: shared middleware, utilities, and S3 storage helpers
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

New runtime uploads use AWS S3-compatible public URLs through the shared storage helper in [packages/shared/src/storage/s3.ts](/Users/admin/Documents/Developer/FullStackDev/Yome/packages/shared/src/storage/s3.ts:1).

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

Copy the example env file and fill in values:

```bash
cp .env.example .env
```

Important values include:

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXTAUTH_SECRET`
- `JWT_KEY`
- `NEXT_PUBLIC_BACKEND_API`
- `NEXT_PUBLIC_CHAT_SOCKET_URL`
- `FRONTEND_URL`
- `GATEWAY_SHARED_TOKEN`
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET`
- `AWS_S3_PUBLIC_BASE_URL` or `AWS_CLOUDFRONT_URL`
- optional `AWS_S3_PREFIX`

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
bun run --cwd packages/shared test
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
