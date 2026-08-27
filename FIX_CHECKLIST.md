# Yome Fix Checklist

Track progress against the verified August 27, 2026 baseline.

## Phase 1: Documentation And Safety

- [x] Update `README.md` to describe the notifications service as a stub, not a completed delivery system.
- [x] Add a root `.env.example` with placeholder values and short setup notes.
- [x] Review current environment variable names and document which ones are required by each service.
- [x] Replace runtime Cloudinary setup docs with AWS S3 storage configuration.

## Phase 2: API Validation

- [x] Choose a validation approach for services.
- [x] Add shared request validation helpers or patterns.
- [x] Add validation to auth routes:
  - [x] `POST /get-user`
  - [x] `POST /verify-credentials`
  - [x] `POST /register-user`
  - [x] `POST /oauth-user`
  - [x] `POST /change-password`
  - [x] `GET /generate-token/:userId`
- [x] Add validation to user routes:
  - [x] `POST /get-user-by-id`
  - [x] `POST /update-user`
  - [x] `POST /connect-user-to-mentor`
  - [x] `POST /connect-user-to-group`
  - [x] route param validation for user/group lookup endpoints
- [x] Add validation to chat routes:
  - [x] `GET /get-messages/:from/:to/:chatType`
  - [x] `POST /add-message`
  - [x] `POST /add-media-message`
  - [x] `GET /get-initial-group-messages/:group_id`
  - [x] `GET /get-initial-contacts/:from`
- [x] Standardize validation error responses across services.

## Phase 3: Frontend Type Safety

- [x] Define shared frontend types for:
  - [x] user
  - [x] contact
  - [x] message
  - [x] group
  - [x] call state
  - [x] socket events
- [x] Replace `any` usage in [apps/web/context/StateReducers.ts](/Users/admin/Documents/Developer/FullStackDev/Yome/apps/web/context/StateReducers.ts:3).
- [x] Replace `type SocketPayload = any` in [apps/web/hooks/useChatSocket.ts](/Users/admin/Documents/Developer/FullStackDev/Yome/apps/web/hooks/useChatSocket.ts:7).
- [ ] Tighten message/dashboard typing in the Facebook-style dashboard components.
- [ ] Revisit [apps/web/tsconfig.json](/Users/admin/Documents/Developer/FullStackDev/Yome/apps/web/tsconfig.json:8) after reducer and socket typing are improved.

## Phase 4: `receiver` Naming Migration

- [x] Inventory all current usages of:
  - [x] `recieve`
  - [x] `reciever`
  - [x] `recievedMessages`
- [x] Decide migration strategy:
  - [x] single-step rename
  - [x] compatibility bridge during rollout
- [x] Update Prisma schema relations and fields.
- [x] Add and verify Prisma migration.
- [x] Update backend controllers and socket handlers.
- [x] Update frontend state, components, and socket payloads.
- [x] Regenerate Prisma client if schema changes are applied.
- [x] Run a repo-wide search to confirm the old spellings are gone or intentionally aliased.

## Phase 5: Logging Cleanup

- [ ] Remove browser-side debug logs that are no longer useful.
- [ ] Review service logs and keep only operationally useful startup/error logs.
- [ ] Prefer shared structured logging where service logs need metadata.

## Phase 5.5: Dashboard/API Cleanup

- [ ] Move older dashboard/account Axios flows behind focused helper utilities.
- [x] Standardize people/group suggestion fetches and connect/join actions.
- [ ] Reuse the same helper approach for remaining account update/password flows where it reduces duplication.

## Phase 6: Notifications Decision

- [ ] Decide whether notifications should remain a stub for now.
- [ ] If keeping the stub:
  - [ ] document supported behavior clearly
  - [ ] define the expected contract for future delivery backends
- [ ] If implementing delivery:
  - [ ] choose first channel
  - [ ] define persistence/retry expectations
  - [ ] add tests around acceptance and dispatch behavior

## Phase 7: S3 Runtime Storage Migration

- [x] Add a shared S3 storage helper in `packages/shared`.
- [x] Add startup env validation for runtime object storage.
- [x] Replace media-service chat image uploads with S3 uploads.
- [x] Replace media-service chat audio uploads with S3 uploads.
- [x] Replace user-service avatar uploads with S3 uploads.
- [x] Remove Cloudinary runtime bootstrap from media and user services.
- [x] Remove Cloudinary runtime dependencies from service packages.
- [x] Keep legacy Cloudinary URLs renderable during the compatibility window.
- [x] Add MIME validation and per-route upload size limits for avatar, image, and audio uploads.
- [x] Update frontend remote image config for the chosen S3/CloudFront host.
- [ ] Run manual AWS smoke tests for:
  - [ ] avatar upload
  - [ ] image message upload
  - [ ] audio message upload
  - [ ] reload and render validation for new S3-hosted media
- [ ] Decide whether to build a one-off Cloudinary-to-S3 backfill script.

## Validation After Each Phase

- [x] Run `bun run check-types:all`
- [x] Run targeted manual smoke tests for affected flows
- [x] Update docs when behavior changes

## Explicitly Removed From The Old Checklist

These old tasks are no longer current:

- [x] Delete `apps/web/components/FormInut/`
- [x] Re-enable strict mode across the whole repo from scratch
- [x] Add generic gateway rate limiting from zero
- [x] Investigate committed root `.env` history in this repo
- [x] Keep Cloudinary as the primary runtime upload provider
