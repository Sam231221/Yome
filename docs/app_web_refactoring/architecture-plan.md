# apps/web Architecture Plan

## Current Architecture Assessment

`apps/web` is a production Next.js App Router application in a Bun/Turborepo monorepo. The app already has feature folders, but ownership is inconsistent: several feature-specific modules still live in global `hooks`, `types`, `utils`, `context`, `providers`, and some `lib` areas. B02 moved the first client-heavy route bodies into feature screen components. B03 removed the shared UI dependency on learning feature types and moved common UI leakage into feature or shared ownership. The remaining refactor should preserve routes and behavior while moving ownership toward feature-oriented boundaries.

## Identified Domains and Features

- `landing`: public home page.
- `auth`: login, registration, social auth, NextAuth routes/options, session helpers.
- `onboarding`: onboarding state and onboarding reference UI.
- `account-profile`: account settings, profile update, avatar/photo/crop flows.
- `dashboard-feed`: dashboard page, feed cards, right rail, dashboard data client.
- `learning`: groups, resources, projects, events, connections, notifications, settings, study rooms, learning data/API.
- `chat`: chat list, conversation panel, messages, message media, sockets, chat state/API/types.
- `direct-call`: Stream video provider/status, direct call route, incoming overlay, call guards/routing/storage/actions.
- `dev-db`: local development seed/reset API proxy routes.
- `shared-ui/shared-infra`: reusable UI primitives, layout, generic helpers, auth/session infrastructure, API error handling, config.

## Architecture Rules

Feature-specific components, hooks, types, utilities, state, contexts, providers, actions, API/domain logic, validators, and constants belong under `apps/web/features/<feature>/`. Global directories are reserved for genuinely cross-feature code. Preferred dependency direction is `app -> features -> shared components/hooks -> shared lib/utils`. Shared modules must not import feature implementations. Avoid unnecessary feature-to-feature internal imports; extract a small shared contract instead when two domains need the same primitive type.

## Ownership Corrections From Audit

- `components/Empty.tsx` and `components/Loading/Skeletons.tsx` are currently chat-owned by usage, not shared.
- `components/Loading/Spinner.tsx`, `components/common/DropZoneUploader.tsx`, `components/common/Input.tsx`, and `components/common/Loader.tsx` have no direct imports in the eligible source tree; treat them as delete/review candidates, not shared components.
- `components/common/CaptureAudio.tsx`, `MessageStatus.tsx`, `AvatarWithStatus.tsx`, and `utils/CalculateTime.ts` are chat-owned.
- `components/common/Avatar.tsx`, `PhotoLibrary.tsx`, `CapturePhoto.tsx`, `ProfileAvatar/*`, and `components/common/Slider/*` are account/profile media candidates. `PhotoPicker.tsx` is used by both account/profile and chat and needs a shared media wrapper or feature-specific wrappers.
- `components/ui/primitives.tsx` and `components/ui/icons.tsx` must stop importing learning feature types before they can be treated as pure shared UI.
- `lib/utils.ts` is not broadly consumed today: `cn` is used only by chat avatar status, and URL helpers appear unused in the eligible tree.
- B03 split the legacy common avatar: display-only avatar rendering now lives in `components/shared/media/Avatar.tsx`, while editable profile-photo behavior lives in `features/account-profile/components/profile-avatar-editor.tsx`.
- B07 moved learning static data to `features/learning/data/index.ts`; the shared `YomeTone`/`YomeIconName` contract remains in `types/yome-ui.ts`.
- B07 audit removed the learning study-room dependency on dashboard-feed internals by moving study-room DTOs and fetch ownership into `features/learning/api/learningContentApi.ts`.

## Target Directory Structure

Create only directories needed by real moves.

```text
apps/web/
  app/                       # routes, layouts, metadata, route handlers
  features/
    account-profile/
    auth/
    chat/
    dashboard-feed/
    direct-call/
    landing/
    learning/
    onboarding/
  components/
    ui/                      # feature-neutral primitives only
    layout/                  # app shell/layout only
    shared/                  # cross-feature app components only
  lib/                       # shared infrastructure only
  providers/                 # app-wide providers only
  types/                     # cross-domain types only
  utils/                     # generic pure utilities only
```

## Server and Client Strategy

Server Components are the default. Each `"use client"` file must stay client-side only when it uses state, effects, browser APIs, event handlers, client-only dependencies, or context hooks. Move client boundaries down into feature leaf components. Do not make routes or layouts Client Components only because one child is interactive. B02 completed the high-priority route boundary reviews for `WEB-004`, `WEB-008`, `WEB-009`, `WEB-013`, and `WEB-014`.

Identified `"use client"` files for later audit after B03: `WEB-062`, `WEB-067`, `WEB-068`, `WEB-069`, `WEB-074`, `WEB-075`, `WEB-076`, `WEB-090`, `WEB-091`, `WEB-092`, `WEB-093`, `WEB-096`, `WEB-099`, `WEB-100`, `WEB-102`, `WEB-105`, `WEB-106`, `WEB-107`, `WEB-108`, `WEB-109`, `WEB-110`, `WEB-111`, `WEB-112`, `WEB-113`, `WEB-114`, `WEB-115`, `WEB-116`, `WEB-117`, `WEB-137`, `WEB-138`, `WEB-142`, `WEB-143`, `WEB-144`, and `WEB-145`.

## Route Organization Strategy

Keep `app/` focused on route files, layouts, route handlers, metadata, loading/error boundaries, and server orchestration. Route pages should import feature screens or server/client compositions from `features/*`. Login route-local components and account route-local inputs should move into their owning features. API route files may remain in `app/api`, but reusable handler/options logic can move into feature or shared server libraries when it does not create an import cycle.

## Provider and Context Strategy

Root `app/layout.tsx` should contain only app-wide providers: auth/session, toast infrastructure, and truly global UI context. Direct-call/Stream providers should be scoped to communication routes. The broad `StateContext` and reducer should be split by concern: auth/user session state, chat state, layout/sidebar state, and account/profile update state. Keep compatibility wrappers only temporarily and record them as `BLOCKED` or `PENDING` until removed.

## Code-Splitting Strategy

Runtime code splitting is only for heavy, optional, route-scoped, or interaction-gated client code. Keep route-level splitting natural. Use `next/dynamic` or dynamic `import()` for candidates in `code-splitting-plan.md`, such as emoji picker, audio recorder/WaveSurfer, profile cropper/camera flows, media library/pickers, and Stream video call UI. Do not dynamically import trivial atoms or split code only because a file is long.

## Implementation Batches

### B01 - Documentation Foundation

- Purpose: establish the architecture plan, manifest, code-splitting plan, and migration log.
- Scope: `docs/refactoring/*`.
- Files/features involved: planning docs only.
- Manifest IDs: no production implementation rows are assigned to B01; all `WEB-001` through `WEB-141` are inventory inputs only.
- Dependencies: none.
- Expected file moves: none.
- Expected refactors: none in production code.
- Expected server/client changes: none.
- Expected runtime code-splitting work: none.
- Validation commands: re-scan eligible tree, count manifest entries, verify batch assignments.
- Risks: stale inventory if app files change during planning.
- Definition of Done: four docs exist, manifest count equals eligible file count, actionable rows have batches, and B01 is recorded complete without marking production rows `DONE`.

### B02 - Route Boundaries

- Purpose: make route files thin composition wrappers.
- Scope: client-heavy pages and route-local implementation files.
- Files/features involved: chat, login, onboarding, dashboard, user feeds, account route-local inputs.
- Manifest IDs: `WEB-004`, `WEB-006`, `WEB-007`, `WEB-008`, `WEB-009`, `WEB-011`, `WEB-013`, `WEB-014`, `WEB-102`, and B02-created rows `WEB-142` through `WEB-146`.
- Dependencies: B01.
- Expected file moves: move login components to auth; move account inputs to account-profile; create feature screen components for client route bodies.
- Expected refactors: preserve route URLs while extracting business/UI state.
- Expected server/client changes: remove `"use client"` from route files where client leaves can own interactivity.
- Expected runtime code-splitting work: none.
- Validation commands: `bunx tsc -p apps/web/tsconfig.json --noEmit`, `bun run --cwd apps/web lint`, `bun run --cwd apps/web test`, `bun run --cwd apps/web build`.
- Risks: route param handling, auth redirects, import path churn.
- Definition of Done: targeted routes compile as server wrappers or documented exceptions.

### B03 - Shared UI and Styling Cleanup

- Purpose: make global UI directories feature-neutral.
- Scope: global UI/common/loading/layout components and global CSS ownership.
- Files/features involved: shared UI, chat UI leakage, account profile media, app styling.
- Manifest IDs: `WEB-039` through `WEB-066`, `WEB-119`, `WEB-120`, `WEB-130`, and `WEB-136`.
- Dependencies: B02.
- Expected file moves: move chat-owned common components to chat; move profile media components to account-profile; keep only true primitives/shared components globally.
- Expected refactors: remove learning imports from UI primitives; split oversized global CSS by durable ownership plan; review unused global components before deletion.
- Expected server/client changes: remove unnecessary client directives from primitives if no browser/client APIs remain.
- Expected runtime code-splitting work: preserve candidates for B09.
- Validation commands: typecheck, lint, web tests, build.
- Risks: CSS cascade regressions, import cycles from shared UI to features.
- Definition of Done: shared UI imports no feature code and global styles are classified; `app-theme.css` may remain `BLOCKED` until a cascade and visual-regression plan exists.

### B04 - Chat Messaging Ownership

- Purpose: consolidate chat messaging domain code.
- Scope: chat socket, chat API, chat types, chat utility, message/list components, chat state usage.
- Files/features involved: chat components, global chat hook/type/API/time utility.
- Manifest IDs: `WEB-077` through `WEB-083`, `WEB-085`, `WEB-086`, `WEB-088`, `WEB-090`, `WEB-099`, `WEB-117`, `WEB-125`, `WEB-126`, `WEB-139`, `WEB-141`, and `WEB-149` through `WEB-151`.
- Dependencies: B03.
- Expected file moves: move global chat hook/API/time utility under `features/chat`; expose feature chat types from `features/chat/types.ts`.
- Expected refactors: extract cross-domain chat identity/message contracts for dashboard, actions, and app state; split `ChatHeader` action leaves; fix `ChatContainer` hook order.
- Expected server/client changes: keep chat interactive leaves client-side; avoid raising route boundary.
- Expected runtime code-splitting work: mark audio/voice/search candidates for B09.
- Validation commands: typecheck, lint, web tests, build.
- Risks: socket payload compatibility, state reducer coupling, message media regressions.
- Definition of Done: chat domain imports flow through chat-owned modules or explicit shared contracts.

### B05 - Direct Call and Stream Ownership

- Purpose: isolate Stream video/direct-call dependencies.
- Scope: direct-call provider, route client, overlay, call libs/types/actions.
- Files/features involved: direct-call modules and Stream provider/status.
- Manifest IDs: `WEB-001`, `WEB-002`, `WEB-005`, `WEB-031`, `WEB-091` through `WEB-098`, `WEB-137`, `WEB-138`, `WEB-152`, and `WEB-153`.
- Dependencies: B04.
- Expected file moves: move Stream provider/status/actions/direct-call modules into one direct-call ownership path.
- Expected refactors: keep `app/api/auth/socket-token/route.ts` route-stable because it authenticates chat Socket.IO rather than Stream video; split oversized direct-call route client into route wrapper, room UI, and state UI where safe.
- Expected server/client changes: scope client provider to communication/call routes; keep server actions server-only.
- Expected runtime code-splitting work: defer Stream call controls/overlay only if justified by B09.
- Validation commands: typecheck, lint, web tests, build.
- Risks: Stream client initialization, call token generation, incoming call behavior.
- Definition of Done: direct-call imports do not leak through app-wide providers unnecessarily.

### B06 - Auth, Account, and Onboarding Ownership

- Purpose: clarify account/profile, auth, and onboarding boundaries.
- Scope: account feature files, auth feature files, auth/account libs, onboarding components/state.
- Files/features involved: account settings, auth forms/social auth, user info/session/form validation.
- Manifest IDs: `WEB-028` through `WEB-030`, `WEB-032`, `WEB-067`, `WEB-072` through `WEB-076`, `WEB-111`, `WEB-118`, `WEB-121` through `WEB-124`, `WEB-154`, and `WEB-155`.
- Dependencies: B03.
- Expected file moves: move account API/profile flows to account-profile; move social auth/auth provider/NextAuth options to auth; move onboarding reference page and onboarding option data to onboarding.
- Expected refactors: keep shared auth/session/user helpers global when consumed by unrelated features; extract route-handler logic from auth API routes where it improves route composition.
- Expected server/client changes: keep auth providers client-side; isolate browser URL/localStorage usage in client leaves.
- Expected runtime code-splitting work: mark profile media/crop flows for B09.
- Validation commands: typecheck, lint, web tests, build.
- Risks: NextAuth provider coupling, account update regressions, profile image behavior.
- Definition of Done: auth/account/onboarding files have single-domain ownership or documented shared contract.

### B07 - Dashboard, Feed, and Learning Boundaries

- Purpose: settle broad learning and dashboard/feed ownership.
- Scope: learning pages/data/APIs, feed feature, dashboard API/types, resource API/types.
- Files/features involved: dashboard-feed, learning, resources/projects/events/groups/study rooms.
- Manifest IDs: `WEB-015` through `WEB-027`, `WEB-100` through `WEB-110`, `WEB-112` through `WEB-116`, `WEB-127` through `WEB-129`, `WEB-131` through `WEB-135`, and `WEB-140`.
- Dependencies: B03.
- Expected file moves: move feed into dashboard-feed; move learning APIs/types/data under learning; move learning page implementations out of `pages/` into feature components.
- Expected refactors: keep tone/icon shared contract in `types/yome-ui.ts`; keep `ApiRoutes.ts` as a shared endpoint registry unless B08/B10 can split it without circular dependencies.
- Expected server/client changes: review learning pages that are client by default but may not need hooks/browser APIs.
- Expected runtime code-splitting work: only for large optional panels after ownership split.
- Validation commands: typecheck, lint, web tests, build.
- Risks: barrel export hidden dependencies, over-splitting learning into too many features.
- Definition of Done: learning/dashboard/feed boundaries are documented and imports follow them.

### B08 - Provider and Context Decomposition

- Purpose: reduce global state blast radius.
- Scope: root layout providers, modal context, broad state context/reducer/constants.
- Files/features involved: app shell, auth provider, modal provider, state reducer, affected feature consumers.
- Manifest IDs: `WEB-042`, `WEB-062`, `WEB-068`, `WEB-069`, `WEB-070`, `WEB-071`.
- Dependencies: B04, B05, B06, B07.
- Expected file moves: move feature state into owning features; keep root providers only if app-wide.
- Expected refactors: replace broad reducer cases with scoped providers/hooks.
- Expected server/client changes: reduce client provider nesting in root layout where possible.
- Expected runtime code-splitting work: none.
- Validation commands: typecheck, lint, web tests, build.
- Risks: broad consumer impact, stale context assumptions, auth/chat state regressions.
- Definition of Done: root layout provider list is justified and feature state is scoped.

### B09 - Runtime Code Splitting

- Purpose: implement only justified runtime splits.
- Scope: candidates from `code-splitting-plan.md`.
- Files/features involved: chat composer/audio/voice/search, account profile media, direct-call Stream UI.
- Manifest IDs: `WEB-046`, `WEB-048`, `WEB-049`, `WEB-055`, `WEB-056`, `WEB-057`, `WEB-058`, `WEB-084`, `WEB-087`, `WEB-089`, `WEB-092`, `WEB-093`, `WEB-137`, and `WEB-152`.
- Dependencies: B04, B05, B06.
- Expected file moves: none unless required by earlier ownership batches.
- Expected refactors: introduce dynamic imports only at interaction or route boundaries.
- Expected server/client changes: use `ssr: false` only for browser-only modules.
- Expected runtime code-splitting work: emoji picker, audio recorder, cropper/camera/media library, Stream call UI as justified.
- Validation commands: typecheck, lint, web tests, build.
- Risks: loading-state regressions, hydration issues, delayed interaction.
- Definition of Done: each implemented split has owner, fallback, SSR decision, and no trivial dynamic imports.

### B10 - Final Reconciliation

- Purpose: close the migration safely.
- Scope: all manifest rows and refactor docs.
- Files/features involved: all web architecture domains.
- Manifest IDs: all `WEB-001` through `WEB-162`, including historical deletion rows.
- Dependencies: B01-B09.
- Expected file moves: none beyond reconciliation fixes.
- Expected refactors: remove obsolete barrels or compatibility shims only after proving usage.
- Expected server/client changes: final `"use client"` audit.
- Expected runtime code-splitting work: final candidate review.
- Validation commands: `bun run --cwd apps/web lint`, `bun run --cwd apps/web test`, `bunx tsc -p apps/web/tsconfig.json --noEmit`, `bun run --cwd apps/web build`.
- Risks: incomplete manifest status, stale docs.
- Definition of Done: no unresolved `PENDING` or `IN_PROGRESS` items remain, and final validation is recorded.

## Global Definition of Done

- Every eligible file has a manifest row with stable ID, classification, action, status, risk, server/client assessment, and batch if actionable.
- All non-`KEEP`/non-`BLOCKED` rows belong to an implementation batch.
- Every production implementation batch after B01 has at least one manifest item.
- Every runtime split candidate has an owner feature and implementation batch.
- No production routes, public URLs, API contracts, or user-visible behavior change without explicit implementation validation.
- Final checks pass or pre-existing failures are documented separately.
