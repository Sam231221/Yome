# apps/web Refactor Migration Log

## Date and Start State

- Date: 2026-09-02
- Git branch: `refactor/web-architecture`
- Repository package manager: `bun@1.3.5`
- Refactor state: B10 final reconciliation completed on 2026-09-04. All ten batches (B01-B10) are complete; the apps/web feature-oriented architecture migration is closed.

## Detected Validation Commands

From root `package.json`:

- `bun run build`
- `bun run lint`
- `bun run check-types`
- `bun run check-types:all`
- `bun run test`
- `bun run test:integration`

From `apps/web/package.json`:

- `bun run --cwd apps/web build`
- `bun run --cwd apps/web lint`
- `bun run --cwd apps/web test`
- `bun run --cwd apps/web dev`
- `bun run --cwd apps/web start`

Additional direct TypeScript command used for web-only validation:

- `bunx tsc -p apps/web/tsconfig.json --noEmit`

## Baseline Validation

- Git branch: `refactor/web-architecture`
- Package manager: `bun@1.3.5`
- Node version: `v22.19.0`
- Package manager version: `1.3.5`

| Area | Command | Exit Status | Result |
| --- | --- | --- | --- |
| Typecheck | `bunx tsc -p apps/web/tsconfig.json --noEmit` | 0 | Passed with no output. |
| ESLint | `bun run --cwd apps/web lint` | 0 | Passed with 174 warnings. |
| Tests | `bun run --cwd apps/web test` | 0 | Passed: 12 tests across 4 files. |
| Production build | `bun run --cwd apps/web build` | 0 | Passed; build reports the Next.js middleware/proxy deprecation warning. |
| Turbo typecheck | `bun run check-types` | 0 | Passed: 8 package tasks successful, 3 cached. |
| Turbo lint | `bun run lint` | 101 | Failed before task execution because Turbo crashed. |
| Turbo tests | `bun run test` | 101 | Failed before task execution because Turbo crashed. |
| Turbo build | `bun run build` | 101 | Failed before task execution because Turbo crashed. |

### Baseline Failure Classification

| Command | Exit Status | Error Summary | Affected File/Package | Classification |
| --- | --- | --- | --- | --- |
| `bun run lint` | 101 | Turbo 2.8.7 panicked in `system-configuration` dynamic store lookup: `Attempted to create a NULL object.` | Turborepo CLI/runtime, not an app package | ENVIRONMENT |
| `bun run test` | 101 | Turbo 2.8.7 panicked in `system-configuration` dynamic store lookup: `Attempted to create a NULL object.` | Turborepo CLI/runtime, not an app package | ENVIRONMENT |
| `bun run build` | 101 | Turbo 2.8.7 panicked in `system-configuration` dynamic store lookup: `Attempted to create a NULL object.` | Turborepo CLI/runtime, not an app package | ENVIRONMENT |

### Baseline Warning Classification

- `bun run --cwd apps/web lint` exits 0 but reports 174 PRE_EXISTING warnings, including Turbo undeclared env vars, unused imports/variables, React hook dependency warnings, React hook order warnings in chat container, `no-img-element`, and CommonJS config warnings.
- `bun run --cwd apps/web build` exits 0 but reports a PRE_EXISTING Next.js middleware/proxy deprecation warning.
- No PRE_EXISTING command failures were found in web typecheck, web lint, web tests, web build, or Turbo typecheck.
- Environment-related failures are limited to root Turbo `lint`, `test`, and `build` command crashes.
- Unknown failures: none.

## Baseline Status

Captured before implementation refactoring:

- `bun run --cwd apps/web lint`: passed with 174 warnings.
- `bun run --cwd apps/web test`: passed, 12 tests.
- `bunx tsc -p apps/web/tsconfig.json --noEmit`: passed.
- `bun run --cwd apps/web build`: passed. Build reported the Next.js middleware/proxy deprecation warning.
- `bun run check-types`: passed through Turbo.
- `bun run lint`, `bun run test`, and `bun run build`: failed with ENVIRONMENT-classified Turbo panics before package task execution.

## Pre-existing Failures and Warnings

- No baseline command failed.
- Lint currently reports warnings, including undeclared Turbo env vars, unused imports/variables, React hook dependency warnings, React hook order warnings in chat container, `no-img-element`, CommonJS config warnings, and Next.js middleware deprecation during build.
- These should be separated from regressions introduced during implementation batches.

## Batch Execution History

| Batch | Status | Started | Completed | Validation Result | Notes |
| --- | --- | --- | --- | --- | --- |
| B01 | COMPLETE | 2026-09-02 | 2026-09-02 | Passed documentation/inventory checks plus web typecheck, lint, and tests | Documentation foundation completed; no production source changes. |
| B02 | COMPLETE | 2026-09-02 | 2026-09-02 | Passed web typecheck, lint, tests, and production build | Route boundary cleanup completed; no runtime code splitting performed. |
| B03 | COMPLETE | 2026-09-02 | 2026-09-02 | Passed web typecheck, lint, tests, production build, and Turbo typecheck | Shared UI and styling cleanup completed; `WEB-039` remains blocked for safe CSS cascade extraction. |
| B04 | COMPLETE | 2026-09-02 | 2026-09-02 | Passed web typecheck, lint, tests, production build, and Turbo typecheck | Chat messaging ownership completed; root Turbo build remains the known ENVIRONMENT failure. |
| B05 | COMPLETE | 2026-09-02 | 2026-09-02 | Passed web typecheck, lint, tests, production build, and Turbo typecheck | Direct-call and Stream ownership completed; root Turbo build remains the known ENVIRONMENT failure. |
| B06 | COMPLETE | 2026-09-02 | 2026-09-02 | Passed web typecheck, lint, tests, production build, and Turbo typecheck | Auth, account, and onboarding ownership completed; root Turbo build remains the known ENVIRONMENT failure. |
| B07 | COMPLETE | 2026-09-02 | 2026-09-02 | Passed web typecheck, lint, tests, production build, and Turbo typecheck | Dashboard, feed, and learning boundaries completed and audited; root Turbo lint/test/build remain known ENVIRONMENT failures. |
| B08.1 | COMPLETE | 2026-09-02 | 2026-09-02 | Passed web typecheck, lint, tests, production build, and Turbo typecheck | AppShell dependency correction completed; shared app-shell code now has zero feature dependencies. |
| B08.2 | COMPLETE | 2026-09-02 | 2026-09-02 | Passed web typecheck, lint, tests, production build, and Turbo typecheck | ModalContextProvider removed as dead provider with zero consumers. |
| B08.3 | COMPLETE | 2026-09-03 | 2026-09-03 | Passed web typecheck, lint, tests, and production build | StateContext decomposed into scoped AuthStateProvider and ChatStateProvider; legacy context/reducer/constants removed. |
| B08 | COMPLETE | 2026-09-02 | 2026-09-03 | Passed web typecheck, lint, tests, and production build | Provider/context decomposition completed across B08.1-B08.3. |
| B09 | COMPLETE | 2026-09-04 | 2026-09-04 | Passed web typecheck, lint (46 warnings), tests (12), and production build | Implemented `CS-003` (lazy emoji picker) and `CS-001` (recorder loading fallback); resolved `CS-002` by removing a trivial dynamic import; reviewed `CS-004`–`CS-009` and kept them eager. B09-created file: `WEB-162`. |
| B10 | COMPLETE | 2026-09-04 | 2026-09-04 | Passed web typecheck, lint (46 warnings), tests (12), and production build | Manifest reconciled (153 eligible = 153 current rows + 9 historical `DELETED:` rows; 0 `PENDING`/`IN_PROGRESS`); `WEB-068` deletion-row formatting fixed; `"use client"` audit (37 files, all justified); barrel/shim audit (no obsolete barrels); final code-splitting review (2 justified dynamic imports); account profile-media orphan cluster resolved as KEEP with a product recommendation; empty `apps/web/context/` directory removed. No production code changed. `WEB-039` remains documented `BLOCKED`. |

## B01 Execution

- Manifest IDs completed: none as production implementation rows; `WEB-001` through `WEB-141` were verified as inventory inputs.
- Eligible source files: 141.
- Manifest entries: 141.
- Duplicate manifest IDs: 0.
- Duplicate current file entries: 0.
- Unassigned actionable items: 0.
- Files moved: none.
- Files refactored: none.
- Files removed: none.
- Imports changed: none.
- Server/client boundary changes: none.
- Runtime code-splitting changes: none.
- Production manifest statuses: unchanged; no source item was marked `DONE` because B01 is documentation-only.
- Import, barrel export, dynamic import, test, route, and `"use client"` scans were reviewed for later implementation batches.
- Existing dynamic imports use `ssr: false` without explicit `loading` props; this is a B09 follow-up, not a B01 regression.
- Client direct-call modules currently import `actions/stream.actions.ts`; this is a pre-existing B05 server/client boundary item, not a B01 regression.
- B01 audit validation: web typecheck passed, web lint passed with the same 174 baseline warnings, web tests passed with 12 tests, and web production build passed with the same baseline middleware/proxy deprecation warning.
- Production build: run during B01 audit for verification; no regressions found.

## B02 Execution

- Manifest IDs completed: `WEB-004`, `WEB-006`, `WEB-007`, `WEB-008`, `WEB-009`, `WEB-011`, `WEB-013`, `WEB-014`, `WEB-102`, and B02-created rows `WEB-142` through `WEB-146`.
- Files moved: login containers to `features/auth/components`, account inputs to `features/account-profile/lib`, landing content to `features/landing/components`.
- Files refactored: chat, login, onboarding, dashboard, and userfeeds route pages now compose feature-owned screen components.
- Files removed: none intentionally; moved files no longer exist at their old paths.
- Imports/re-exports changed: route imports updated to feature destinations; no barrel exports changed.
- Server/client boundary changes: removed `"use client"` from `/chat`, `/login`, `/onboarding`, `/dashboard`, and `/userfeeds` route pages; client logic now lives in feature screen components. `user-feeds-screen.tsx` is server-safe.
- Runtime code-splitting changes: none; B02 kept App Router route-level splitting only.
- Lint warnings before: 174.
- Lint warnings after: 174.
- Typecheck: `bunx tsc -p apps/web/tsconfig.json --noEmit` passed.
- Lint: `bun run --cwd apps/web lint` passed with 174 baseline warnings.
- Tests: `bun run --cwd apps/web test` passed, 12 tests.
- Production build: `bun run --cwd apps/web build` passed. It emitted the baseline middleware/proxy deprecation warning and an environment/package-data Browserslist warning about stale `caniuse-lite`; no B02 code regression found.
- Turbo: `bun run check-types` passed; root Turbo lint/test/build remain known ENVIRONMENT failures from baseline and were not rerun for B02.
- Planning changes: added `WEB-102` and B02-created rows `WEB-142` through `WEB-146` to B02 tracking.

## B02 Audit

- B02 manifest rows were re-scanned and every B02 item is `DONE` or `KEEP`; none are `PENDING`, `IN_PROGRESS`, or `BLOCKED`.
- Current eligible source files: 146.
- Manifest entries: 146.
- Duplicate manifest IDs: 0.
- Duplicate current file entries: 0.
- Missing manifest files: 0.
- Stale B02 old-path references: 0.
- B02 route wrappers have no `"use client"` directives and no direct hook/browser/session usage.
- `LoginContainer.tsx` and `RegisterContainer.tsx` intentionally inherit the client boundary from `login-screen.tsx`.
- The dashboard screen's dependency on `features/feed` remains a documented B07 ownership follow-up because `features/feed` is already classified as dashboard-feed-owned.
- B02 audit validation passed after running the production build before the final direct TypeScript check. A parallel typecheck attempted before `.next/types` had been regenerated failed with missing generated Next type files; the ordered rerun passed and no source regression was found.

## B03 Execution

- Manifest IDs completed: `WEB-040`, `WEB-043` through `WEB-061`, `WEB-063` through `WEB-066`, `WEB-136`, and B03-created rows `WEB-147` and `WEB-148`.
- Manifest IDs kept: `WEB-041`, `WEB-119`, `WEB-120`, and `WEB-130`.
- Blocked items: `WEB-039` because `app-theme.css` needs cascade mapping and visual regression coverage before safe extraction.
- Files moved: chat empty state, chat skeleton, chat status/avatar/audio components, chat stylesheet, shared context menu, shared photo picker, and account-profile media/crop/slider files moved into their owning directories.
- Files refactored: legacy common avatar split into account-profile editable avatar and shared display-only avatar; UI primitives now use `types/yome-ui.ts` instead of learning feature types; learning data re-exports the shared UI type contract for compatibility; chat avatar status now owns its local class-name join helper.
- Files removed: `components/Loading/Spinner.tsx`, `components/common/DropZoneUploader.tsx`, `components/common/Input.tsx`, `components/common/Loader.tsx`, and `lib/utils.ts` after import, barrel, dynamic, test, route, and server-action scans found no usage.
- Imports/re-exports changed: old `components/common`, `components/Loading/Skeletons`, `components/Empty`, `components/common/CaptureAudio`, and `lib/utils` imports were replaced with feature/shared destinations. `components/ui/index.ts` now re-exports UI tone/icon types.
- Server/client boundary changes: removed unnecessary `"use client"` from `components/ui/primitives.tsx`. The split shared display avatar is server-safe.
- Runtime code-splitting changes: no new dynamic imports; existing `CaptureAudio` dynamic import now points to `features/chat/components/message-composer/CaptureAudio.tsx`.
- Lint warnings before: 174.
- Lint warnings after: 174.
- Typecheck: `bunx tsc -p apps/web/tsconfig.json --noEmit` passed.
- Lint: `bun run --cwd apps/web lint` passed with 174 baseline warnings.
- Tests: `bun run --cwd apps/web test` passed, 12 tests.
- Production build: `bun run --cwd apps/web build` passed. It emitted the baseline middleware/proxy deprecation warning and the previously observed Browserslist stale-data warning; no B03 regression found.
- Turbo: `bun run check-types` passed. Root Turbo lint/test/build remain known ENVIRONMENT failures from baseline and were not rerun for B03.
- Planning changes: B03 architecture manifest IDs were reconciled to include `WEB-119`, `WEB-120`, `WEB-130`, and `WEB-136`; manifest gained B03-created rows `WEB-147` and `WEB-148`; code-splitting paths were updated for moved modules.

## B03 Audit

- B03 manifest rows rechecked: every B03 item is `DONE`, `KEEP`, or documented `BLOCKED`; none are `PENDING` or `IN_PROGRESS`.
- Current eligible source files: 143.
- Current manifest source-file rows: 143, plus 5 historical B03 deletion rows.
- Duplicate manifest IDs: 0.
- Duplicate current file entries: 0.
- Missing manifest files: 0.
- Stale B03 old-path references in production source: 0.
- Audit fixes applied: removed unnecessary `"use client"` from `components/ui/primitives.tsx`; moved the shared `YomeTone`/`YomeIconName` contract from `components/ui/types.ts` to `types/yome-ui.ts`; `features/learning/data.ts` now re-exports that type contract for compatibility.
- Empty legacy directories from B03 moves were removed.
- Remaining non-B03 architectural issue observed: `components/layout/AppShell.tsx` imports `features/learning/data`; this remains assigned to B08 via `WEB-062`.
- Validation after audit fixes: web typecheck passed, web lint passed with 174 baseline warnings, web tests passed with 12 tests, web production build passed with the baseline middleware/proxy warning and known Browserslist stale-data warning, and Turbo typecheck passed.
- Runtime code-splitting audit: no new dynamic imports were introduced; existing `CaptureAudio` and `VoiceMessage` dynamic imports remain justified candidates for B09 with no missing B03 fallback work.

## B04 Execution

- Manifest IDs completed: `WEB-085`, `WEB-086`, `WEB-117`, `WEB-125`, `WEB-126`, `WEB-139`, `WEB-141`, and B04-created rows `WEB-149` through `WEB-151`.
- Manifest IDs kept: `WEB-077` through `WEB-083`, `WEB-088`, `WEB-090`, and `WEB-099`.
- Files moved: `hooks/useChatSocket.ts` to `features/chat/hooks/useChatSocket.ts`; `lib/chat/chatApi.ts` to `features/chat/api/chatApi.ts`; `lib/chat/notificationSound.ts` to `features/chat/lib/notificationSound.ts`; `utils/CalculateTime.ts` to `features/chat/lib/calculateTime.ts`; `types/chat.ts` to `types/chat-contracts.ts` with a chat-facing `features/chat/types.ts` shim.
- Files refactored: `ChatContainer` hook order fixed; `ChatHeader` split into `ChatHeaderCallActions.tsx` and `ChatHeaderMenuActions.tsx`.
- Files removed: no source files deleted; empty legacy directories `apps/web/hooks` and `apps/web/lib/chat` were removed.
- Imports/re-exports changed: chat feature imports now use `features/chat/*`; dashboard, stream action, and app state use the shared `types/chat-contracts.ts` contract.
- Server/client boundary changes: no `"use client"` directives added or removed. Chat interactive leaves remain inside the existing `ChatRightBar` client boundary.
- Runtime code-splitting changes: none; `ChatHeader` source splitting remains eager under `CS-010`.
- Lint warnings before: 174.
- Lint warnings after: 172.
- Typecheck: `bunx tsc -p apps/web/tsconfig.json --noEmit` passed; `bun run check-types` also passed through Turbo.
- Lint: `bun run --cwd apps/web lint` passed with 172 warnings. The decrease came from fixing the B04 hook-order warning in `ChatContainer`.
- Tests: `bun run --cwd apps/web test` passed, 12 tests.
- Production build: `bun run --cwd apps/web build` passed. It emitted the baseline middleware/proxy deprecation warning and known Browserslist stale-data warning.
- Turbo: `bun run build` remains the known ENVIRONMENT failure with Turbo exit 101 before package task execution.
- New regressions: none found.
- Blocked items: none for B04.
- Planning changes: B04 manifest IDs were reconciled to exclude B09-owned `WEB-084`, `WEB-087`, and `WEB-089`; B04 gained `WEB-149` through `WEB-151`; `CS-010` records the new eager header leaves.

## B04 Audit

- B04 manifest rows rechecked: every B04 item is `DONE` or `KEEP`; none are `PENDING`, `IN_PROGRESS`, or `BLOCKED`.
- Current eligible source files: 146.
- Current manifest source-file rows: 146, plus 5 historical B03 deletion rows.
- Duplicate manifest IDs: 0.
- Duplicate current file entries: 0.
- Missing manifest files: 0.
- Stale B04 old-path references in production source: 0.
- Audit fix applied: direct-call files changed from importing `features/chat/types` to importing `types/chat-contracts.ts`, preserving the B05 direct-call boundary instead of creating a direct-call-to-chat type dependency.
- Existing dynamic imports remain limited to `CaptureAudio` and `VoiceMessage`; no B04 runtime split was added, removed, or found unjustified.
- Validation after audit fix: web typecheck passed, web lint passed with 172 warnings, web tests passed with 12 tests, web production build passed with the baseline middleware/proxy warning and known Browserslist stale-data warning, and Turbo typecheck passed.
- Turbo build remains the known ENVIRONMENT failure with exit 101 before package task execution.

## B05 Execution

- Manifest IDs completed: `WEB-001`, `WEB-005`, `WEB-091` through `WEB-098`, `WEB-137`, `WEB-138`, and B05-created rows `WEB-152` and `WEB-153`.
- Manifest IDs kept/reviewed: `WEB-002` and `WEB-031`.
- Files moved: Stream server actions moved to `features/direct-call/actions/stream.actions.ts`; direct-call provider, route client, overlay, guards, routing, service, storage, and types moved from `features/chat/direct-call` to `features/direct-call`; Stream provider/status moved from global `providers` into `features/direct-call/providers`.
- Files refactored: communication layout now imports the scoped direct-call provider; `DirectCallRouteClient.tsx` was split into route-client orchestration, `DirectCallRoom.tsx`, and `DirectCallStates.tsx`.
- Files removed: no source files were deleted; empty legacy directories `apps/web/actions`, `apps/web/providers`, and `apps/web/features/chat/direct-call` were removed.
- Imports/re-exports changed: app call route, communication layout, chat header call actions, direct-call libs/components/providers, and Stream provider imports updated to `features/direct-call/*`.
- Server/client boundary changes: no `"use client"` directives added or removed. Server actions remain server-only under `features/direct-call/actions`; client direct-call code imports those server actions through the existing Next server-action pattern.
- Runtime code-splitting changes: none. `CS-007` and `CS-008` were reviewed during B05 and remain B09 candidates.
- Lint warnings before: 172.
- Lint warnings after: 172.
- Typecheck: `bunx tsc -p apps/web/tsconfig.json --noEmit` passed; `bun run check-types` also passed through Turbo.
- Lint: `bun run --cwd apps/web lint` passed with 172 warnings.
- Tests: `bun run --cwd apps/web test` passed, 12 tests.
- Production build: `bun run --cwd apps/web build` passed. It emitted the baseline middleware/proxy deprecation warning and known Browserslist stale-data warning.
- Turbo: `bun run build` remains the known ENVIRONMENT failure with Turbo exit 101 before package task execution.
- New regressions: none found.
- Blocked items: none for B05.
- Planning changes: `WEB-093` moved into B05 ownership while `CS-008` remains a B09 runtime split candidate; `WEB-031` was reviewed and kept route-stable because it authenticates chat Socket.IO rather than Stream video; B05 gained `WEB-152` and `WEB-153`.

## B05 Audit

- B05 manifest rows rechecked: every B05 item is `DONE` or `KEEP`; none are `PENDING`, `IN_PROGRESS`, or `BLOCKED`.
- Current eligible source files: 148.
- Current manifest source-file rows: 148, plus 5 historical deletion rows.
- Duplicate manifest IDs: 0.
- Duplicate current file entries: 0.
- Missing manifest files: 0.
- Stale B05 old-path references in production source: 0.
- Legacy directories checked: `apps/web/actions`, `apps/web/providers`, and `apps/web/features/chat/direct-call` contain no source files.
- Import graph audit: direct-call code now depends on shared chat contracts and auth infrastructure, not chat feature internals; chat call controls are the only B05 cross-feature consumer of direct-call behavior.
- Server/client audit: direct-call client directives are still justified by React state/effects, Stream hooks, router events, browser storage, or browser media APIs; route and API files remain server-side.
- Runtime code-splitting audit: no dynamic imports were added or removed. `CS-007` and `CS-008` remain B09 candidates with direct-call ownership and batch assignments.
- Validation after audit: web typecheck passed, web lint passed with 172 warnings, web tests passed with 12 tests, web production build passed with the baseline middleware/proxy warning, and Turbo typecheck passed.
- Turbo build remains the known ENVIRONMENT failure with exit 101 before package task execution.

## B06 Execution

- Manifest IDs completed: `WEB-028`, `WEB-029`, `WEB-030`, `WEB-032`, `WEB-067`, `WEB-072` through `WEB-076`, `WEB-111`, `WEB-118`, `WEB-121` through `WEB-124`, and B06-created rows `WEB-154` and `WEB-155`.
- Files moved: `AuthProvider.tsx` moved from global `context` to `features/auth/providers`; NextAuth options moved from `app/api/auth/[...nextauth]` to `features/auth/lib`; social auth moved to `features/auth/components`; account page content, settings constants, primitives, controller hook, and account API moved from `features/account`/`lib/account` to `features/account-profile`; onboarding reference UI moved from learning to onboarding.
- Files refactored: auth route handlers now import auth-owned NextAuth options; the sync-user route delegates OAuth user sync to `features/auth/api/sync-user.ts`; onboarding reference UI now imports onboarding-owned interests/goals and no longer depends on the learning barrel.
- Files removed: no source files were deleted; empty legacy directories `apps/web/features/account` and `apps/web/lib/account` were removed.
- Imports/re-exports changed: root layout, account route, auth containers, auth API routes, direct-call Stream actions, onboarding client, and learning barrel exports were updated for the new ownership paths.
- Shared-helper decisions: `lib/auth/formValidation.ts`, `lib/auth/sessionToken.ts`, `lib/auth/userInfo.ts`, and `lib/auth/userInfo.test.ts` remain global because they are consumed across unrelated auth, account-profile, chat, dashboard, learning, direct-call, API route, and app-state code.
- Server/client boundary changes: no `"use client"` directives were added or removed. B06 client files remain justified by session hooks, router/search params, state/effects, browser URL/localStorage, file inputs, or event handlers.
- Runtime code-splitting changes: none. Account profile media candidates `CS-004`, `CS-005`, and `CS-006` remain B09 candidates.
- Eligible source files: 150.
- Manifest source-file rows: 150, plus 5 historical deletion rows.
- Missing manifest files: 0.
- Stale B06 old-path references in production source: 0.
- Lint warnings before: 172.
- Lint warnings after: 146.
- Typecheck: `bunx tsc -p apps/web/tsconfig.json --noEmit` passed; `bun run check-types` also passed through Turbo.
- Lint: `bun run --cwd apps/web lint` passed with 146 warnings.
- Tests: `bun run --cwd apps/web test` passed, 12 tests.
- Production build: `bun run --cwd apps/web build` passed. It emitted the baseline middleware/proxy deprecation warning and known Browserslist stale-data warning.
- Turbo: `bun run build` remains the known ENVIRONMENT failure with Turbo exit 101 before package task execution.
- New regressions: none found.
- Blocked items: none for B06.
- Planning changes: B06 architecture manifest IDs were reconciled to include auth API rows `WEB-028`, `WEB-029`, `WEB-030`, and `WEB-032`; B06 gained `WEB-154` and `WEB-155`; account page content was moved rather than split further because controller and primitive separation already existed.

## B06 Audit

- B06 manifest rows rechecked: every B06 item is `DONE`; none are `KEEP`, `PENDING`, `IN_PROGRESS`, or `BLOCKED`.
- Current eligible source files: 150.
- Current manifest source-file rows: 150, plus 5 historical deletion rows.
- Duplicate manifest IDs: 0.
- Duplicate current file entries: 0.
- Missing manifest files: 0.
- Stale B06 old-path references in production source: 0.
- Legacy locations checked: `apps/web/features/account`, `apps/web/lib/account`, `apps/web/context/AuthProvider.tsx`, `apps/web/app/api/auth/[...nextauth]/options.ts`, and `apps/web/features/learning/pages/onboarding.tsx` contain no source files.
- Barrel export audit: `features/learning/index.ts` no longer re-exports onboarding; B06 introduced no broad auth, account-profile, or onboarding barrels.
- Ownership audit: account settings/API/controller code is under `features/account-profile`; auth provider/social auth/NextAuth options/sync helper are under `features/auth`; onboarding reference UI and options are under `features/onboarding`.
- Shared-helper audit: `lib/auth/formValidation.ts`, `lib/auth/sessionToken.ts`, and `lib/auth/userInfo.ts` remain justified shared infrastructure because they are consumed across unrelated features/routes.
- Server/client audit: B06 client directives remain justified by session hooks, router/search params, state/effects, event handlers, file/browser APIs, or localStorage; auth route handlers and NextAuth options remain server-side.
- Runtime code-splitting audit: no dynamic imports were added, removed, or found unjustified. `CS-004`, `CS-005`, and `CS-006` remain B09 candidates.
- Validation after audit: web typecheck passed, web lint passed with 146 warnings, web tests passed with 12 tests, web production build passed with the baseline middleware/proxy warning, and Turbo typecheck passed.
- Turbo build remains the known ENVIRONMENT failure with exit 101 before package task execution.

## B07 Execution

- Manifest IDs completed: `WEB-100`, `WEB-101`, `WEB-103` through `WEB-110`, `WEB-112` through `WEB-116`, `WEB-127` through `WEB-129`, `WEB-131` through `WEB-135`, and `WEB-140`.
- Manifest IDs kept: `WEB-015` through `WEB-019` and `WEB-021` through `WEB-027`.
- Files moved: feed components/barrel moved to `features/dashboard-feed`; dashboard API/test/types moved to `features/dashboard-feed`; learning API/content/resource modules and resource types moved under `features/learning`; learning page implementations moved from `features/learning/pages` to `features/learning/components`; learning static data moved to `features/learning/data/index.ts`.
- Files refactored: learning route-facing barrel now exports from `components`; dashboard and learning imports now point to feature-owned API/type modules; `ApiRoutes.ts` was reviewed and kept as shared endpoint infrastructure because unrelated auth, account, chat, dashboard, learning, resources, and call clients consume it.
- Files removed: no source files were deleted; empty legacy directories `apps/web/features/feed`, `apps/web/lib/dashboard`, `apps/web/lib/learning`, `apps/web/lib/resources`, and `apps/web/features/learning/pages` contain no source files.
- Imports/re-exports changed: old `features/feed`, `lib/dashboard`, `lib/learning`, `lib/resources`, and `features/learning/pages` imports were replaced with feature destinations; `apps/web/package.json` test script now includes moved feature API tests.
- Server/client boundary changes: unnecessary `"use client"` directives were removed from `features/learning/components/notifications.tsx` and `features/learning/components/settings.tsx`; other B07 client files remain justified by state, effects, router interactions, event handlers, browser APIs, or client-only data fetching.
- Runtime code-splitting changes: none. Learning/dashboard routes remain eager through App Router route-level splitting; no heavy optional B07 module justified a new dynamic import.
- Eligible source files: 150.
- Manifest source-file rows: 150, plus 5 historical deletion rows.
- Missing manifest files: 0.
- Stale B07 old-path references in production source: 0.
- Lint warnings before: 146.
- Lint warnings after: 46.
- Typecheck: `bunx tsc -p apps/web/tsconfig.json --noEmit` passed; `bun run check-types` also passed through Turbo.
- Lint: `bun run --cwd apps/web lint` passed with 46 warnings.
- Tests: `bun run --cwd apps/web test` passed, 12 tests across 4 files.
- Production build: `bun run --cwd apps/web build` passed. It emitted the baseline middleware/proxy deprecation warning and known Browserslist stale-data warning.
- Turbo: `bun run check-types` passed; `bun run lint`, `bun run test`, and `bun run build` remain the known ENVIRONMENT failure with Turbo exit 101 before package task execution.
- New regressions: none found.
- Blocked items: none for B07.
- Planning changes: B07 architecture manifest IDs were reconciled to include `WEB-140`; B10 reconciliation range was updated through `WEB-155`; B07 source-split proposals for learning page files were recorded as ownership moves, with larger runtime/code decomposition deferred until measurement or behavior coverage justifies it.

## B07 Audit

- B07 manifest rows rechecked: every B07 item is `DONE` or `KEEP`; none are `PENDING`, `IN_PROGRESS`, or `BLOCKED`.
- Audit fix applied: `features/learning/components/study-rooms.tsx` no longer imports `features/dashboard-feed/api/dashboardApi` or dashboard-feed types. Study-room DTOs and fetching now live in `features/learning/api/learningContentApi.ts` while preserving the existing backend endpoint behavior.
- Current eligible source files: 150.
- Current manifest source-file rows: 150, plus 5 historical deletion rows.
- Duplicate manifest IDs: 0.
- Duplicate current file entries: 0.
- Missing manifest files: 0.
- Stale B07 old-path references in production source: 0.
- Legacy locations checked: `apps/web/features/feed`, `apps/web/lib/dashboard`, `apps/web/lib/learning`, `apps/web/lib/resources`, and `apps/web/features/learning/pages` contain no source files.
- Barrel export audit: `features/dashboard-feed/index.ts` and `features/learning/index.ts` are narrow route-facing barrels and point only at current feature-owned components.
- Server/client audit: `notifications.tsx` and `settings.tsx` remain server-safe without `"use client"`; remaining B07 client directives are justified by state, effects, session hooks, context hooks, event handlers, browser APIs, or client data fetching.
- Runtime code-splitting audit: no dynamic imports were added, removed, or found unjustified. Learning/dashboard routes remain eager through App Router route-level splitting.
- Validation after audit fix: web typecheck passed, web lint passed with 46 warnings, web tests passed with 12 tests, web production build passed with the baseline middleware/proxy warning and known Browserslist stale-data warning, and Turbo typecheck passed.
- Turbo lint, Turbo test, and Turbo build remain the known ENVIRONMENT failure with exit 101 before package task execution.

## Blockers

- AppShell no longer imports feature modules; navigation and dashboard contracts live under `lib/app-shell`.
- `StateContext` decomposition is complete; auth and chat state now live in scoped feature providers.
- Direct-call and Stream modules now live under `features/direct-call`; B09 still owns any optional runtime deferral for call route UI and incoming overlay.
- Chat identity/message contracts used outside the chat feature now live in `types/chat-contracts.ts`; chat feature code imports them through `features/chat/types.ts`.
- `ApiRoutes.ts` is a global endpoint registry used by several features and API routes; split only when feature ownership will not create circular dependencies.

## Architecture Decisions

- Use feature-oriented architecture for `apps/web`.
- Keep route URLs stable; route files become thin wrappers where feasible.
- Keep API route files in `app/api`; extract reusable server logic only when dependency direction remains clean.
- Treat Server Components as default and push Client Component boundaries down.
- Keep runtime code splitting limited to heavy, optional, interaction-gated, route-scoped, or browser-only modules.
- Do not mark manifest rows `DONE` until implementation batches actually complete.

## B08.1 Execution (WEB-062: AppShell Dependency Correction)

- Manifest IDs completed: `WEB-062`, `WEB-156`, `WEB-157`, `WEB-158`.
- Manifest IDs pending: `WEB-068`, `WEB-069`, `WEB-070`, `WEB-071`.
- Files created: `apps/web/lib/app-shell/data-types.ts` (shared data contract), `apps/web/lib/app-shell/navigation.ts` (feature-neutral nav config, pre-existing from recovery), `apps/web/components/layout/YomeAppShellContainer.tsx` (feature-aware wrapper).
- Files refactored: `apps/web/components/layout/AppShell.tsx` (removed all data fetching, removed feature imports, now pure presentational component accepting props), `apps/web/components/layout/index.ts` (added YomeAppShellContainer export).
- Files updated: `apps/web/app/(main)/layout.tsx` (now uses YomeAppShellContainer instead of YomeAppShell), `apps/web/features/chat/components/chat-screen.tsx` (now uses YomeAppShellContainer instead of YomeAppShell).
- Architecture violation resolved: AppShell previously imported `DashboardHome` from `@/features/dashboard-feed/types`, violating the rule that shared code cannot depend on feature modules. Solution: (1) Created feature-neutral data contract layer in `lib/app-shell/data-types.ts` with `DashboardHome` type containing only fields AppShell uses (profile, sidebarGroups), (2) Created feature-aware container (`YomeAppShellContainer.tsx`) that fetches dashboard data via feature API and orchestrates composition, (3) Refactored AppShell to pure presentational component receiving all data as props with zero feature dependencies.
- Consumers identified: 2 direct consumers found: `app/(main)/layout.tsx` and `chat-screen.tsx`. All consumers updated to use container. No legacy `YomeAppShell` direct imports remain in production code.
- Imports/re-exports changed: AppShell now imports types from `@/lib/app-shell/data-types` instead of `@/features/dashboard-feed/types`; YomeAppShellContainer imports feature API and feature type but is itself feature-aware (container pattern); shared app-shell library code has zero feature imports.
- Server/client boundary: AppShell remains client component (dark theme toggle state); YomeAppShellContainer is client component (useSession, useStateProvider, useEffect); boundary placement justified.
- Eligible source files: 153.
- Manifest source-file rows: 158 (150 existing + 5 B03 deletes + 3 B08.1 new).
- Missing manifest files: 0.
- Stale B08.1 old-path references in production source: 0. Verified: no remaining imports from `@/features/dashboard-feed/types` outside feature module itself.
- Lint warnings before B08.1: 46. Lint warnings after B08.1: 46 (no new warnings introduced).
- Typecheck: `bunx tsc -p apps/web/tsconfig.json --noEmit` passed; web tsc check-types passed.
- Lint: `bun run --cwd apps/web lint` passed with 46 warnings (no change).
- Tests: `bun run --cwd apps/web test` passed, 12 tests across 4 files (no change).
- Production build: `bun run --cwd apps/web build` passed. Emitted baseline middleware/proxy deprecation warning and known Browserslist stale-data warning.
- Turbo: `bun run check-types` passed; `bun run lint`, `bun run test`, and `bun run build` remain the known ENVIRONMENT failure with Turbo exit 101 before package task execution.
- New regressions: none found. All existing tests pass. Build succeeds. No new lint warnings. No new type errors.
- Blocked items: none for B08.1. WEB-068 (ModalContextProvider review) and WEB-069/070/071 (StateContext decomposition) are B08 sub-stages but not yet started; explicitly deferred per user guidance to avoid scope escalation.
- Architecture verification: Confirmed that shared app-shell code (`lib/app-shell/navigation.ts`, `lib/app-shell/data-types.ts`, `components/layout/AppShell.tsx`) has zero imports from `@/features/*`. All feature-specific logic moved to feature-aware container layer.

## B08.2 Execution (WEB-068: ModalContextProvider Review)

- Manifest IDs completed: `WEB-068`.
- Files deleted: `apps/web/context/ModalContextProvider.tsx` (dead provider).
- Files refactored: `apps/web/app/layout.tsx` (removed ModalContextProvider import and wrapper).
- Provider analysis: `ModalContextProvider` exports `ModalContext`, `ModalContextProvider` component, and `useModalContext()` hook. Provider was wrapping the root layout but **zero consumers** found—`useModalContext()` is never called anywhere in the codebase.
- Consumer search results: Comprehensive grep across `apps/web --include="*.ts" --include="*.tsx"` found: (1) `ModalContextProvider.tsx` definition and export, (2) `app/layout.tsx` import and wrapper, (3) NO other files consuming `useModalContext()`.
- Decision rationale: ModalContextProvider provides zero functionality. Removing it (1) eliminates dead code, (2) reduces unnecessary provider nesting at root level, (3) improves app bootstrap performance by one fewer context provider, (4) aligns with principle of keeping only necessary app-wide providers.
- Root layout provider stack before: `AuthProvider → ModalContextProvider → StateProvider`. Root layout provider stack after: `AuthProvider → StateProvider` (one fewer nesting level).
- Eligible source files: 152.
- Manifest source-file rows: 158 (150 existing + 5 B03 deletes + 3 B08.1 new; WEB-068 now marked DELETED but kept in historical record).
- Missing manifest files: 0.
- Lint warnings before B08.2: 46. Lint warnings after B08.2: 46 (no new warnings introduced).
- Typecheck: `bunx tsc -p apps/web/tsconfig.json --noEmit` passed; web tsc check-types passed.
- Lint: `bun run --cwd apps/web lint` passed with 46 warnings (no change).
- Tests: `bun run --cwd apps/web test` passed, 12 tests across 4 files (no change).
- Production build: `bun run --cwd apps/web build` passed. Emitted baseline middleware/proxy deprecation warning and known Browserslist stale-data warning.
- Turbo: `bun run check-types` passed; `bun run lint`, `bun run test`, and `bun run build` remain the known ENVIRONMENT failure with Turbo exit 101 before package task execution.
- New regressions: none found. All existing tests pass. Build succeeds. No new lint warnings. No new type errors.
- Blocked items: none for B08.2. WEB-069/070/071 (StateContext decomposition) completed in B08.3.

## B08.3 Execution (WEB-069/070/071: StateContext Decomposition)

- Manifest IDs completed: `WEB-042`, `WEB-069`, `WEB-070`, `WEB-071`, and B08.3-created rows `WEB-159` through `WEB-161`.
- Files created: `features/auth/providers/AuthStateProvider.tsx`, `features/chat/state/ChatStateContext.tsx`, `features/chat/state/chat-reducer.ts`.
- Files deleted: `context/StateContext.tsx`, `context/StateReducers.ts`, and `context/constants.ts` after all consumers migrated.
- Files refactored: `app/layout.tsx` now composes `AuthProvider` and `AuthStateProvider` only (app-wide); `ChatStateProvider` is scoped to `app/(communication)/layout.tsx`; chat, auth, dashboard, account, direct-call, and learning consumers now use scoped feature hooks.
- Architecture outcome: global monolithic reducer replaced by feature-scoped auth state (`userInfo`, `newUser`) and chat reducer state; no compatibility shim remains.
- Imports/re-exports changed: all `useStateProvider`/`reducerCases` imports replaced with `useAuthState`, `useChatState`, and `chatReducerCases`; `ensureUserInfo` callers now pass `setUserInfo`.
- Server/client boundary changes: no new `"use client"` directives added; root layout remains a server component composing client providers.
- Runtime code-splitting changes: none.
- Eligible source files: 152.
- Manifest source-file rows: 161 (150 existing + 5 B03 deletes + 3 B08.1 new + 3 B08.3 new; 3 B08 state files deleted but retained as historical rows).
- Stale B08.3 old-path references in production source: 0.
- Lint warnings before B08.3: 46. Lint warnings after B08.3: 46.
- Typecheck: `bunx tsc -p apps/web/tsconfig.json --noEmit` passed.
- Lint: `bun run --cwd apps/web lint` passed with 46 warnings.
- Tests: `bun run --cwd apps/web test` passed, 12 tests across 4 files.
- Production build: `bun run --cwd apps/web build` passed with the baseline middleware/proxy deprecation warning.
- New regressions: none found.
- Blocked items: none for B08.3.

## B08 Audit

- B08 manifest rows rechecked: every B08 item is `DONE`, `KEEP`, or documented `DELETED`; none are `PENDING`, `IN_PROGRESS`, or `BLOCKED`.
- Sub-stages B08.1 (AppShell dependency correction), B08.2 (ModalContextProvider removal), and B08.3 (StateContext decomposition) are all complete.
- Root provider stack is now: `AuthProvider → AuthStateProvider` (with `ChatStateProvider` properly scoped to `app/(communication)/layout.tsx`).
- Shared app-shell code remains feature-neutral; feature-aware orchestration lives in `YomeAppShellContainer`.
- Audit fixes applied in B08.3:
  1. Fixed `chat-reducer.ts` `CHANGE_CURRENT_CHAT_USER` and `ADD_USER_MESSAGE` logic: removed broken `userContacts[0]?.id` fallback; threaded `action.currentUserId` and leveraged `action.fromSelf` to ensure accurate `mark-read` emissions and correct 1:1 message direction/unread counting.
  2. Removed `ChatStateProviderLayer.tsx` (unnecessary compatibility bridge) and imported `ChatStateProvider` directly in `app/(communication)/layout.tsx`.
  3. Reconciled provider documentation in migration log.
- Validation after B08.3 fixes: web typecheck passed, web lint passed with 46 warnings, web tests passed with 12 tests, and web production build passed.

## B09 Execution

- Batch: B09 — Runtime Code Splitting. Started and completed 2026-09-04.
- Manifest IDs completed: `WEB-084`, `WEB-087`, `WEB-089`, and B09-created row `WEB-162`.
- Candidate review outcomes (from `code-splitting-plan.md`):
  - `CS-003` — IMPLEMENTED. `emoji-picker-react` was an eager static import in `MessageSendBar`. Extracted a lazy wrapper `features/chat/components/message-composer/EmojiPickerPanel.tsx` (`"use client"`) that owns the library and exposes a plain `(emoji: string) => void` callback. `MessageSendBar` now loads it with `next/dynamic` (`ssr: false`, `loading` skeleton) on first emoji-popover open. `MessageSendBar` no longer imports `emoji-picker-react` or its types. Verified in `.next/react-loadable-manifest.json`: `EmojiPickerPanel` is now a dynamic module and `emoji-picker-react` sits in a lazy vendor chunk.
  - `CS-001` — IMPLEMENTED (fallback). The existing `CaptureAudio` `next/dynamic` import kept `ssr: false` and gained a `loading` fallback rendering an `audio-recorder-shell` placeholder. WaveSurfer remains in its own ~43 KB chunk.
  - `CS-002` — RESOLVED, KEEP EAGER. `VoiceMessage.tsx` has no heavy dependency (React, `react-icons`, native `<audio>`), so the pre-existing `next/dynamic` boundary (`EX-002`) in `ChatContainer/index.tsx` was removed and replaced with a static `import VoiceMessage from "./VoiceMessage"`. Removes an unnecessary chunk + suspense boundary per audio message and satisfies the "no trivial dynamic imports" rule. SSR-safe: `ChatContainer` returns `null` before any message maps when there is no session.
  - `CS-004`, `CS-005`, `CS-006` (account side) — REVIEWED, KEEP EAGER. Exhaustive import scan (`profile-avatar-editor`, `ProfileAvatar`, `CropEasy`, `CapturePhoto`, `PhotoLibrary`, `cropImage`, `react-easy-crop`) shows the `features/account-profile` profile-media edit flow is a closed orphan cluster: `profile-avatar-editor.tsx` and `ProfileAvatar.tsx` have zero consumers, so `react-easy-crop` is not reachable from `/account` or any route and is not in any bundle. A dynamic import would have no runtime effect. Not deleted in B09 (AGENTS.md forbids deletion on apparent-unused alone); flagged for B10 KEEP/DELETE reconciliation.
  - `CS-006` (chat side) — REVIEWED, KEEP EAGER. `components/shared/media/PhotoPicker.tsx` is a 16-line `react-dom` portal around a hidden `<input type="file">`; no bundle cost, trivial per AGENTS.md.
  - `CS-007` — REVIEWED, KEEP EAGER. `DirectCallRouteClient`/`DirectCallRoom` are already isolated to `/chat/[id]/call/[callId]` by App Router route-level splitting. `@stream-io/video-react-sdk` is pulled onto every communication route by the always-mounted `app/(communication)/layout.tsx` → `DirectCallProviderLayer` → `StreamClientProvider`, so a route-client split cannot remove the SDK from `/chat`. A `next/dynamic` `ssr: false` boundary is not expressible from the server `page.tsx` without adding a client wrapper, for marginal unmeasured benefit at High risk. The existing `DirectCallLoadingState` already covers the connecting state.
  - `CS-008` — REVIEWED, KEEP EAGER. `IncomingDirectCallOverlay` is `lucide-react` icons plus guards; the plan's own rationale says keep eager when the provider already dominates cost, which it does here.
  - `CS-009` — REVIEWED, KEEP EAGER. `SearchMessagesRightMostChatContainer` is an icon-only panel (`react-icons` + `calculateTime`), always mounted inside the `ChatRightBar` client boundary and toggled by CSS; no heavy dependency to defer.
- Files moved: none.
- Files refactored: `features/chat/components/ChatRightBar/Chat/MessageSendBar.tsx` (emoji picker lazified, recorder fallback added, `handleEmojiClick` now takes a string), `features/chat/components/ChatRightBar/Chat/ChatContainer/index.tsx` (VoiceMessage dynamic import removed, `next/dynamic` import dropped).
- Files created: `features/chat/components/message-composer/EmojiPickerPanel.tsx` (`WEB-162`).
- Files removed: none.
- Style changes: added `.composer-emoji-picker-loading` and `.audio-recorder-shell--loading` fallback classes to the chat-owned `features/chat/styles/chat.css`.
- Imports/re-exports changed: `MessageSendBar` no longer imports `emoji-picker-react`; `ChatContainer` no longer imports `next/dynamic`; `ChatContainer` now statically imports `./VoiceMessage`. No barrels changed. Stale-path scan across `apps/web`: 0.
- Server/client boundary changes: none. `EmojiPickerPanel.tsx` carries `"use client"` and is `ssr: false`; all edited components remain inside the existing `ChatRightBar` client boundary. No route or layout boundary was raised or lowered.
- Runtime code-splitting changes: `emoji-picker-react` moved from eager to lazy (`CS-003`, new `EX-003`); `CaptureAudio` dynamic import gained a `loading` fallback (`CS-001`, `EX-001`); `VoiceMessage` dynamic import removed (`CS-002`, `EX-002` retired).
- Eligible source files: 153 (152 + `EmojiPickerPanel.tsx`). Manifest source-file rows: 153, plus 5 historical B03 deletion rows.
- Lint warnings before B09: 46. Lint warnings after B09: 46 (no change).
- Typecheck: `bunx tsc -p apps/web/tsconfig.json --noEmit` passed (exit 0).
- Lint: `bun run --cwd apps/web lint` passed with 46 baseline warnings.
- Tests: `bun run --cwd apps/web test` passed, 12 tests across 4 files.
- Production build: `bun run --cwd apps/web build` passed (exit 0). All 27 routes unchanged; `/chat` remains statically prerendered. Emitted the baseline Next.js middleware/proxy deprecation warning and the known Browserslist stale-data warning.
- Turbo: `bun run check-types` not rerun for B09; root Turbo `lint`/`test`/`build` remain the known ENVIRONMENT failure (exit 101) and were not rerun.
- New regressions: none found.
- Blocked items: none for B09. Carried to B10: KEEP/DELETE classification of the orphaned account profile-media cluster (`profile-avatar-editor.tsx`, `ProfileAvatar.tsx`, `CropEasy.tsx`, `CapturePhoto.tsx`, `PhotoLibrary.tsx`, `Slider.tsx`, `cropImage.ts`, `slider.css`). Pre-existing `WEB-039` (`app-theme.css`) remains `BLOCKED` from B03 and is outside B09 scope.

## B10 Execution

- Batch: B10 — Final Reconciliation. Started and completed 2026-09-04. No production code changed; one empty directory removed; four tracking documents updated.
- Scope per plan: all manifest rows and refactor docs; final `"use client"` audit; final runtime code-splitting review; remove obsolete barrels/shims only after proving usage.

### Manifest reconciliation

- Eligible source files on disk (`app`, `components`, `context`, `features`, `lib`, `types`, `utils`; `.ts`/`.tsx`/`.js`/`.mjs`/`.css`, excluding `node_modules`): **153**.
- Manifest rows: **162 IDs** = 153 current source-file rows + 9 historical `DELETED:` rows (`WEB-045`, `WEB-051`, `WEB-052`, `WEB-053`, `WEB-136` from B03; `WEB-068`, `WEB-069`, `WEB-070`, `WEB-071` from B08).
- Status tally: `DONE` 123, `KEEP` 38, `BLOCKED` 1. **Zero `PENDING`, zero `IN_PROGRESS`.**
- Disk-vs-manifest diff: 0 files on disk without a row; 0 current rows without a file — after the one fix below.
- Fix applied: `WEB-068` "Current File" cell showed the live backtick path `` `apps/web/context/ModalContextProvider.tsx` `` although the file was deleted in B08.2. Changed to `DELETED: apps/web/context/ModalContextProvider.tsx` to match the other deletion rows. This removed a phantom current row (154 → 153) so the count now matches disk exactly. No other manifest row content changed.
- `WEB-039` (`apps/web/app/app-theme.css`) remains `BLOCKED` by deliberate decision from B03: safe CSS cascade extraction still requires cascade mapping and visual-regression coverage that do not exist. `BLOCKED` is an allowed terminal state (it is neither `PENDING` nor `IN_PROGRESS`); B10 does not force a high-risk CSS split.

### `"use client"` audit

- 37 files carry `"use client"`. Every one is justified: React state/effects/refs, custom hooks, `useSession`/`useRouter`/`usePathname`/`useSearchParams`, `createContext`, event handlers, browser APIs (`window`/`document`/`localStorage`/`navigator`/`MediaRecorder`/canvas), or a client-only third-party dependency.
- Two files have `"use client"` without a direct in-file client signal; both were reviewed and deliberately retained:
  - `features/chat/components/message-composer/EmojiPickerPanel.tsx` (`WEB-162`) — renders the client-only `emoji-picker-react` and is an `ssr: false` `next/dynamic` target; the directive is correct.
  - `features/direct-call/lib/service.ts` (`WEB-096`) — operates on a live `StreamVideoClient` instance and orchestrates browser-side call creation; retained as an explicit client boundary marker, consistent with the B05 direct-call client-directive review.
- No route file or layout is a Client Component. No unnecessary `"use client"` found; no server/client boundary regression.

### Barrel / shim audit

- `components/layout/index.ts` (`WEB-063`) — consumed by `app/(main)/layout.tsx` and `features/chat/components/chat-screen.tsx`. Retain.
- `components/ui/index.ts` (`WEB-065`) — 16 consumers. Retain.
- `features/dashboard-feed/index.ts` (`WEB-101`) — consumed by `dashboard-screen.tsx`. Retain.
- `features/learning/index.ts` (`WEB-104`) — consumed by 12 route pages. Retain.
- No obsolete barrels. No compatibility shims remain (`ChatStateProviderLayer` was removed in B08.3; no other bridge modules exist).

### Runtime code-splitting final review

- The only `next/dynamic` boundaries in `apps/web` are `CaptureAudio` (`wavesurfer.js`) and `EmojiPickerPanel` (`emoji-picker-react`), both in `MessageSendBar`, both `ssr: false` with a `loading` fallback and chat ownership. No trivial dynamic imports remain (`.next/react-loadable-manifest.json` lists exactly these two).
- `@stream-io/video-react-sdk` remains scoped by App Router route-level splitting plus the communication-layout provider (`CS-007`/`CS-008`, reviewed and kept eager in B09; unmeasured provider-splitting is High risk and out of scope).
- Observation only, no action (out of B10 scope, not an architecture issue): `framer-motion` is declared in `apps/web/package.json` but has zero source imports. Recommend the product team drop it in a dependency-cleanup change.

### Orphaned code — account profile-media cluster

- Files: `WEB-046` `profile-avatar-editor.tsx`, `WEB-058` `profile-media/ProfileAvatar.tsx`, `WEB-057` `profile-media/CropEasy.tsx`, `WEB-049` `profile-media/CapturePhoto.tsx`, `WEB-055` `profile-media/PhotoLibrary.tsx`, `WEB-060` `profile-media/Slider.tsx`, `WEB-061` `profile-media/slider.css`, `WEB-059` `lib/cropImage.ts` (all under `features/account-profile`).
- Proof of non-use (per AGENTS.md): no direct imports, no dynamic imports, no barrel exports (`features/account-profile` has no `index.ts`), no tests, no config, no route usage, no server actions. `git log -S "profile-avatar-editor"` across all history returns nothing — the editor entrypoint has never been referenced in any commit. `git log -S "ProfileAvatar"` shows only its own definition. `account-page-content.tsx` (and its pre-B06 predecessor `AccountPageContent.tsx`, from its first commit) has always rendered `Avatar` from `@/components/ui` with its own `handleAvatarChange`/`avatarPreview` logic.
- Conclusion: this is a pre-existing dead cluster, not a refactor regression. No batch B02–B09 disconnected it.
- Decision: **KEEP.** The files are correctly feature-owned (the B03/B06 ownership MOVE is complete and `DONE`) and form a coherent avatar-editing capability. Per the repeated protocol constraint not to delete code on unused-status alone and not to escalate a reconciliation batch into feature removal, they are retained. They carry zero runtime cost — B09 confirmed they are in no route bundle.
- Recommendation recorded for the product team: either wire the editor into `features/account-profile/components/account-page-content.tsx`, or remove the eight-file cluster together with the now-unused `react-easy-crop` dependency, as a dedicated product change outside the architecture refactor.
- `components/shared/ContextMenu.tsx` (`WEB-050`) and `components/shared/media/PhotoPicker.tsx` (`WEB-056`) are **not** orphaned — both have live chat consumers (`ChatListHeader`, `ChatHeaderMenuActions`, `MessageSendBar`). They remain correctly classified as shared components.

### Directory cleanup

- Removed the empty `apps/web/context/` directory. Its files were moved/deleted across B06 (`AuthProvider.tsx`) and B08 (`ModalContextProvider.tsx`, `StateContext.tsx`, `StateReducers.ts`, `constants.ts`); the directory was left behind. Removal matches the "empty legacy directories removed" convention applied in B03–B08. Git does not track empty directories, so this does not appear in `git status`; no code references `@/context/*`.

### Validation (B10)

- Typecheck: `bunx tsc -p apps/web/tsconfig.json --noEmit` — passed (exit 0).
- Lint: `bun run --cwd apps/web lint` — passed (exit 0), 46 warnings — identical to the post-B07/B08/B09 baseline; no new warnings.
- Tests: `bun run --cwd apps/web test` — passed, 12 tests across 4 files.
- Production build: `bun run --cwd apps/web build` — passed (exit 0). All 27 routes unchanged; `/chat` remains statically prerendered. Emitted the baseline Next.js middleware/proxy deprecation warning and the known Browserslist stale-data warning.
- Turbo root `lint`/`test`/`build` remain the known ENVIRONMENT failure (exit 101 before task execution) documented in the baseline; not rerun.
- New regressions: none.
- Blocked items: `WEB-039` (`app-theme.css`) — documented `BLOCKED`, carried as a known limitation, not a migration blocker.

### Migration close-out

- Global Definition of Done — met: every eligible file has a manifest row with a stable ID, classification, action, status, risk, server/client assessment, and batch; every non-`KEEP`/non-`BLOCKED` row belongs to an implementation batch (B02–B09); every production batch after B01 has at least one manifest item; every runtime split candidate (`CS-001`–`CS-013`) has an owner feature and a batch with a terminal disposition; no production route, URL, API contract, or user-visible behavior changed without per-batch validation; final checks pass and the one pre-existing environment failure plus the one `BLOCKED` CSS item are documented separately.
- B01–B10 complete. The `apps/web` feature-oriented architecture migration is closed.

