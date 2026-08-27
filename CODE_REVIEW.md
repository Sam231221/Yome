# Yome Code Review Baseline

**Date**: August 27, 2026  
**Purpose**: Verified first-pass review of the current repository state  
**Scope**: `apps/web`, `services/*`, `packages/*`, root docs/config

## Executive Summary

The previous review docs were partially correct, but several items were stale or overstated. This updated baseline keeps only issues that are still observable in the repository and turns them into a practical action plan.

Current state:

- The monorepo structure is healthy and `bun run check-types:all` currently passes.
- Route validation and the `receiver` migration have been completed.
- Chat bootstrap and conversation loading were cleaned up.
- Runtime uploads have now been migrated from Cloudinary to shared AWS S3 storage helpers in the media and user services.
- Legacy Cloudinary URLs are still intentionally supported for seeded/demo data and previously stored rows.
- The most important remaining work is dashboard/account cleanup, broader logging cleanup, and optional legacy asset backfill.

## Verified High-Value Issues

### 1. Dashboard/account request handling is still partly ad hoc

**Severity**: High  
**Primary files**:

- [apps/web/app/(main)/(dashboard)/dashboard/components/facebook/PeopleYouMayKnow.tsx](/Users/admin/Documents/Developer/FullStackDev/Yome/apps/web/app/(main)/(dashboard)/dashboard/components/facebook/PeopleYouMayKnow.tsx:1)
- [apps/web/app/(main)/(dashboard)/dashboard/components/facebook/GroupSuggestions.tsx](/Users/admin/Documents/Developer/FullStackDev/Yome/apps/web/app/(main)/(dashboard)/dashboard/components/facebook/GroupSuggestions.tsx:1)
- [apps/web/app/(main)/(dashboard)/account/page.tsx](/Users/admin/Documents/Developer/FullStackDev/Yome/apps/web/app/(main)/(dashboard)/account/page.tsx:1)

**What is true now**

- The earlier reducer and socket `any` hotspots have now been cleaned up.
- The next frontend consistency gap is that some dashboard/account features still call Axios directly and parse responses locally instead of going through small domain helpers.

**Why it matters**

- Similar request/response logic is duplicated across several dashboard widgets.
- Error handling and success-message handling drift more easily when each component does its own API parsing.

**Recommended direction**

- Add a focused dashboard/account API helper layer similar to the chat helper pattern.
- Move shared success/error parsing out of the widgets and into those helpers.
- Reuse that layer in the dashboard suggestion and connect/join flows first.

### 2. Storage migration follow-through still needs smoke verification

**Severity**: Medium  
**Primary files**:

- [packages/shared/src/storage/s3.ts](/Users/admin/Documents/Developer/FullStackDev/Yome/packages/shared/src/storage/s3.ts:1)
- [services/media/src/controllers/media.controller.ts](/Users/admin/Documents/Developer/FullStackDev/Yome/services/media/src/controllers/media.controller.ts:1)
- [services/user/src/controllers/user.controller.ts](/Users/admin/Documents/Developer/FullStackDev/Yome/services/user/src/controllers/user.controller.ts:1)
- [apps/web/next.config.js](/Users/admin/Documents/Developer/FullStackDev/Yome/apps/web/next.config.js:1)

**What is true now**

- New runtime uploads now target AWS S3 instead of Cloudinary.
- The shared storage layer validates required AWS env vars, normalizes MIME handling, generates unique object keys, and returns public URLs.
- The frontend still allows Cloudinary hosts so old media continues to render during the compatibility window.

**Why it matters**

- This was a high-risk infrastructure change and needs one focused manual smoke pass with real AWS credentials.
- The remaining Cloudinary references are expected legacy/demo URLs, not active runtime upload code.

**Recommended direction**

- Verify avatar, image, and audio uploads against the configured S3 bucket.
- Confirm the chosen public delivery hostname in `AWS_CLOUDFRONT_URL` or `AWS_S3_PUBLIC_BASE_URL` is the same host the web app renders from.
- Decide later whether to backfill old Cloudinary-hosted assets into S3.

### 3. Notifications service is intentionally a stub and docs should say that clearly

**Severity**: Medium  
**Primary files**:

- [services/notifications/src/index.ts](/Users/admin/Documents/Developer/FullStackDev/Yome/services/notifications/src/index.ts:9)
- [services/notifications/src/routes/notifications.routes.ts](/Users/admin/Documents/Developer/FullStackDev/Yome/services/notifications/src/routes/notifications.routes.ts:13)
- [README.md](/Users/admin/Documents/Developer/FullStackDev/Yome/README.md:1)

**What is true now**

- The service is a deliberate stub that accepts requests and returns `202`.
- The README needed to stop implying this is a full delivery system.

**Why it matters**

- New contributors may assume notification delivery exists when it does not.
- Product and engineering expectations can drift.

**Recommended direction**

- Update docs to state the current stub behavior.
- Decide whether the next step is email, push, in-app persistence, or removal.

### 4. Debug logging cleanup is still needed

**Severity**: Medium  
**Representative files**:

- [apps/web/app/(communication)/chat/components/Call/Container.tsx](/Users/admin/Documents/Developer/FullStackDev/Yome/apps/web/app/(communication)/chat/components/Call/Container.tsx:30)
- [apps/web/components/common/IncomingCall.tsx](/Users/admin/Documents/Developer/FullStackDev/Yome/apps/web/components/common/IncomingCall.tsx:18)
- [apps/web/app/(main)/(dashboard)/account/page.tsx](/Users/admin/Documents/Developer/FullStackDev/Yome/apps/web/app/(main)/(dashboard)/account/page.tsx:76)

**What is true now**

- There are still multiple `console.*` calls across frontend and services.
- The chat route is cleaner now, but account/dashboard/call flows still need one pass.

**Recommended direction**

- Keep startup/service logs where useful.
- Remove ad hoc browser debugging logs and replace service-side ad hoc logs with structured logger usage where appropriate.

## Items From The Old Review That Are Stale

These should not drive current work:

- The `apps/web/components/FormInut/` typo folder no longer exists.
- The repo is not failing service/package typechecks right now.
- Shared/service TypeScript strict mode is already enabled in [packages/typescript-config/base.json](/Users/admin/Documents/Developer/FullStackDev/Yome/packages/typescript-config/base.json:16).
- A shared Express error handler already exists in [packages/shared/src/middleware/errorHandler.ts](/Users/admin/Documents/Developer/FullStackDev/Yome/packages/shared/src/middleware/errorHandler.ts:8).
- Generic request rate limiting already exists in the gateway at [services/gateway/src/index.ts](/Users/admin/Documents/Developer/FullStackDev/Yome/services/gateway/src/index.ts:77).
- `git log --all --full-history -- .env` shows no committed root `.env` history in this repository.
- Cloudinary is no longer the runtime upload provider for media or avatar uploads.

## Current Risks Noted During Verification

### Web compiler settings are still looser than the rest of the repo

- [apps/web/tsconfig.json](/Users/admin/Documents/Developer/FullStackDev/Yome/apps/web/tsconfig.json:8) keeps `noImplicitAny: false`.
- That is not an emergency, but it explains why the web app can carry more typing debt than the services.

### Docs do not fully match runtime behavior

- The README still describes notifications as a real-time delivery service instead of a stub.
- The old review docs overstated several issues, which could waste time if followed directly.

## Recommended Work Order

1. Run a real AWS-backed smoke pass for avatar, image, and audio uploads.
2. Standardize dashboard/account request helpers to match the cleaner chat API layer.
3. Clean browser debug logs and standardize service logging.
4. Decide whether the notifications stub stays or gets a first delivery backend.

## Verification Notes

The following checks were run during this first pass:

- `bun run check-types:all`
- `bunx tsc -p apps/web/tsconfig.json --noEmit`
- `git log --all --full-history -- .env`
- repository-wide searches for `any`, `console.*`, `reciever`, `recieve`, `recievedMessages`

This file is intended to be the new baseline for follow-up fixes, not a final audit.
