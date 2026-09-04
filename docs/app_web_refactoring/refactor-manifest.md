# apps/web Refactor Manifest

Every eligible `.ts`, `.tsx`, `.js`, `.mjs`, and `.css` file under the requested `apps/web` source directories is listed below. IDs follow sorted path order and are stable for this planning pass.

B01 verification completed on 2026-09-02: the eligible source count is 141 and matches the 141 manifest entries. No production source files were changed, no production implementation rows are assigned to B01, and no production manifest rows were marked `DONE` because B01 is the documentation foundation batch only.

B02 completed on 2026-09-02: the current eligible source count is 146 and matches the 146 manifest entries. B02-created files use `WEB-142` through `WEB-146`.

B03 completed on 2026-09-02: the current eligible source count is 143. The manifest now has 143 current source-file rows plus 5 historical B03 deletion rows. B03-created files use `WEB-147` and `WEB-148`; deleted rows keep their stable IDs with `DELETED:` paths for audit history.

B04 completed and audited on 2026-09-02: the current eligible source count is 146. The manifest now has 146 current source-file rows plus 5 historical B03 deletion rows. B04-created files use `WEB-149` through `WEB-151`.

B05 completed on 2026-09-02: the current eligible source count is 148. The manifest now has 148 current source-file rows plus 5 historical B03 deletion rows. B05-created files use `WEB-152` and `WEB-153`.

B06 completed on 2026-09-02: the current eligible source count is 150. The manifest now has 150 current source-file rows plus 5 historical B03 deletion rows. B06-created files use `WEB-154` and `WEB-155`.

B07 completed and audited on 2026-09-02: the current eligible source count remains 150. The manifest now has 150 current source-file rows plus 5 historical B03 deletion rows. B07 moved dashboard/feed and learning/resource ownership without adding runtime dynamic imports.

B08.1 (WEB-062: AppShell Dependency Correction) completed on 2026-09-02: the current eligible source count is 153. B08.1-created files use `WEB-156` through `WEB-158`. This sub-stage resolved the architecture violation where shared AppShell imported from feature modules by: (1) creating a feature-neutral app-shell data contract layer (`lib/app-shell/data-types.ts`), (2) creating a feature-aware container component (`YomeAppShellContainer.tsx`) that fetches and orchestrates data, (3) refactoring AppShell to a pure presentational component receiving all data as props, (4) updating all consumers to use the container instead of the shell directly. All shared code now has zero feature dependencies.

B08.2 (WEB-068: ModalContextProvider Review) completed on 2026-09-02: the current eligible source count is 152. WEB-068 deletion reduces provider nesting. Analysis found that `ModalContextProvider` exports `useModalContext()` hook but has **zero consumers** in the entire codebase—the hook is never called anywhere. The provider was wrapping the app in `app/layout.tsx` but adding no functional value. Decision: DELETE as dead provider that only adds unnecessary nesting overhead without serving any application purpose.

B08.3 (WEB-069/070/071: StateContext Decomposition) completed on 2026-09-03: the current eligible source count is 152. B08.3 split the monolithic app state into scoped feature providers: `AuthStateProvider` owns auth session user info, `ChatStateProvider` owns chat reducer state, and root `app/layout.tsx` now composes only app-wide providers. Legacy `StateContext`, `StateReducers`, and `constants` were removed after all consumers migrated to feature hooks.

B09 (Runtime Code Splitting) completed on 2026-09-04: the current eligible source count is 153. The manifest now has 153 current source-file rows plus 5 historical B03 deletion rows. B09-created files use `WEB-162` (`features/chat/components/message-composer/EmojiPickerPanel.tsx`). B09 implemented the two justified `/chat` splits (`CS-003` emoji picker via a new lazy wrapper, `CS-001` recorder now has a `loading` fallback), normalized the trivial pre-existing `CS-002` dynamic import back to an eager import (`VoiceMessage` has no heavy dependency), and reviewed `CS-004`/`CS-005`/`CS-006`/`CS-007`/`CS-008`/`CS-009` without implementing a split because they are either orphaned (account profile-media flow has no route reachability), trivial, or dominated by an already-eager provider cost. No files were moved or removed.

B10 (Final Reconciliation) completed on 2026-09-04: the eligible source count is 153 and every one has exactly one current manifest row (162 IDs = 153 current rows + 9 historical `DELETED:` rows). Every row is `DONE` (123), `KEEP` (38), or documented `BLOCKED` (1); no `PENDING` or `IN_PROGRESS` rows remain. B10 changed no production code. Reconciliation actions:

1. Fixed the `WEB-068` "Current File" cell — it still showed a live backtick path though `ModalContextProvider.tsx` was deleted in B08.2; it now uses the `DELETED:` form like the other deletion rows. This corrects a phantom-file count mismatch (154 → 153 current rows).
2. `"use client"` audit — 37 files carry the directive; every one is justified by state, effects, hooks, browser APIs, event handlers, context creation, or a client-only third-party dependency. Two files with no direct client signal were reviewed and retained deliberately: `features/chat/components/message-composer/EmojiPickerPanel.tsx` (renders the client-only `emoji-picker-react`; also an `ssr: false` dynamic target) and `features/direct-call/lib/service.ts` (client boundary marker for `StreamVideoClient` call-creation orchestration, consistent with the B05 decision).
3. Barrel / shim audit — `components/layout/index.ts`, `components/ui/index.ts`, `features/dashboard-feed/index.ts`, and `features/learning/index.ts` are all actively consumed (routes and feature screens); none are obsolete. No compatibility shims remain (`ChatStateProviderLayer` was already removed in B08.3).
4. Runtime code-splitting final review — the only `next/dynamic` boundaries are `CaptureAudio` (`wavesurfer.js`) and `EmojiPickerPanel` (`emoji-picker-react`), both justified with `ssr: false` and a `loading` fallback; no trivial dynamic imports remain. `@stream-io/video-react-sdk` stays route-isolated via App Router splitting plus the communication-layout provider (`CS-007`/`CS-008`, reviewed in B09). Observation only (out of scope, no action): `framer-motion` is declared in `apps/web/package.json` but has zero source imports.
5. Orphaned code — the account profile-media avatar-editing cluster (`WEB-046`, `WEB-049`, `WEB-055`, `WEB-057`, `WEB-058`, `WEB-059`, `WEB-060`, `WEB-061`) is provably route-unreachable: nothing imports `profile-avatar-editor.tsx` or `ProfileAvatar.tsx` (confirmed across direct/dynamic imports, barrels, tests, config, routes, server actions, and full git history — `profile-avatar-editor` has never been referenced in any commit). This is a pre-existing condition, not a refactor regression; the account page has always used `Avatar` from `@/components/ui`. Decision: **KEEP** — the files are correctly feature-owned and form a coherent capability; per AGENTS.md they are not deleted on unused-status alone. Recommendation recorded for the product team: either wire the editor into `features/account-profile/components/account-page-content.tsx` or remove the cluster (and the `react-easy-crop` dependency) in a dedicated product change. Their rows stay `DONE` (the B03/B06 ownership MOVE is complete).
6. Removed the empty `apps/web/context/` directory left behind after B06/B08 moved and deleted its files, matching the "empty legacy directories removed" convention used in B03–B08. Not git-tracked (Git does not track empty directories); no code impact.

| ID | Current File | Domain | Classification | Action | Proposed Destination | Batch | Server/Client | Runtime Split Candidate | Risk | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| WEB-001 | `apps/web/features/direct-call/actions/stream.actions.ts` | direct-call | SERVER_ACTION | MOVE | moved from `apps/web/actions/stream.actions.ts` | B05 | Server | No | High | DONE |
| WEB-002 | `apps/web/app/(communication)/chat/[id]/call/[callId]/page.tsx` | direct-call | ROUTE | KEEP | same | B05 | Server | No | Low | KEEP |
| WEB-003 | `apps/web/app/(communication)/chat/[id]/page.tsx` | chat | ROUTE | KEEP | same | B02 | Server | No | Low | KEEP |
| WEB-004 | `apps/web/app/(communication)/chat/page.tsx` | chat | ROUTE | REFACTOR | route wrapper plus `features/chat/components/chat-screen.tsx` | B02 | Server wrapper | No | Medium | DONE |
| WEB-005 | `apps/web/app/(communication)/layout.tsx` | communication | LAYOUT | REFACTOR | same, imports scoped direct-call provider composition | B05 | Server | No | Medium | DONE |
| WEB-006 | `apps/web/features/auth/components/LoginContainer.tsx` | auth | FEATURE_COMPONENT | MOVE | same | B02 | Client via `login-screen.tsx` | No | Medium | DONE |
| WEB-007 | `apps/web/features/auth/components/RegisterContainer.tsx` | auth | FEATURE_COMPONENT | MOVE | same | B02 | Client via `login-screen.tsx` | No | Medium | DONE |
| WEB-008 | `apps/web/app/(general)/(authentication)/login/page.tsx` | auth | ROUTE | REFACTOR | route wrapper plus `features/auth/components/login-screen.tsx` | B02 | Server wrapper | No | Medium | DONE |
| WEB-009 | `apps/web/app/(general)/onboarding/page.tsx` | onboarding | ROUTE | REFACTOR | route wrapper plus `features/onboarding/components/onboarding-client.tsx` | B02 | Server wrapper | No | Medium | DONE |
| WEB-010 | `apps/web/app/(general)/page.tsx` | landing | ROUTE | KEEP | same | B02 | Server | No | Low | KEEP |
| WEB-011 | `apps/web/features/account-profile/lib/inputs.ts` | account-profile | FEATURE_LIB | MOVE | same | B02 | Shared | No | Low | DONE |
| WEB-012 | `apps/web/app/(main)/(dashboard)/account/page.tsx` | account-profile | ROUTE | KEEP | same | B02 | Server | No | Low | KEEP |
| WEB-013 | `apps/web/app/(main)/(dashboard)/dashboard/page.tsx` | dashboard-feed | ROUTE | REFACTOR | route wrapper plus `features/dashboard-feed/components/dashboard-screen.tsx` | B02 | Server wrapper | No | High | DONE |
| WEB-014 | `apps/web/app/(main)/(dashboard)/userfeeds/page.tsx` | dashboard-feed | ROUTE | REFACTOR | route wrapper plus `features/dashboard-feed/components/user-feeds-screen.tsx` | B02 | Server wrapper | No | Low | DONE |
| WEB-015 | `apps/web/app/(main)/connections/page.tsx` | learning | ROUTE | KEEP | same | B07 | Server | No | Low | KEEP |
| WEB-016 | `apps/web/app/(main)/events/page.tsx` | learning | ROUTE | KEEP | same | B07 | Server | No | Low | KEEP |
| WEB-017 | `apps/web/app/(main)/explore/page.tsx` | learning | ROUTE | KEEP | same | B07 | Server | No | Low | KEEP |
| WEB-018 | `apps/web/app/(main)/groups/[id]/page.tsx` | learning | ROUTE | KEEP | same | B07 | Server | No | Low | KEEP |
| WEB-019 | `apps/web/app/(main)/groups/page.tsx` | learning | ROUTE | KEEP | same | B07 | Server | No | Low | KEEP |
| WEB-020 | `apps/web/app/(main)/layout.tsx` | app-shell | LAYOUT | KEEP | same | B08 | Server | No | Low | KEEP |
| WEB-021 | `apps/web/app/(main)/notifications/page.tsx` | learning | ROUTE | KEEP | same | B07 | Server | No | Low | KEEP |
| WEB-022 | `apps/web/app/(main)/projects/[id]/page.tsx` | learning | ROUTE | KEEP | same | B07 | Server | No | Low | KEEP |
| WEB-023 | `apps/web/app/(main)/projects/page.tsx` | learning | ROUTE | KEEP | same | B07 | Server | No | Low | KEEP |
| WEB-024 | `apps/web/app/(main)/resources/[id]/page.tsx` | learning | ROUTE | KEEP | same | B07 | Server | No | Low | KEEP |
| WEB-025 | `apps/web/app/(main)/resources/page.tsx` | learning | ROUTE | KEEP | same | B07 | Server | No | Low | KEEP |
| WEB-026 | `apps/web/app/(main)/settings/page.tsx` | learning | ROUTE | KEEP | same | B07 | Server | No | Low | KEEP |
| WEB-027 | `apps/web/app/(main)/study-rooms/page.tsx` | learning | ROUTE | KEEP | same | B07 | Server | No | Low | KEEP |
| WEB-028 | `apps/web/features/auth/lib/nextauth-options.ts` | auth | FEATURE_LIB | MOVE | moved from `apps/web/app/api/auth/[...nextauth]/options.ts` | B06 | Server | No | Medium | DONE |
| WEB-029 | `apps/web/app/api/auth/[...nextauth]/route.ts` | auth | API | REFACTOR | same route handler importing auth-owned NextAuth options | B06 | Server | No | Low | DONE |
| WEB-030 | `apps/web/app/api/auth/session/route.ts` | auth | API | REFACTOR | same route handler importing auth-owned NextAuth options | B06 | Server | No | Low | DONE |
| WEB-031 | `apps/web/app/api/auth/socket-token/route.ts` | chat-socket-auth | API | REVIEW | keep route-stable; not Stream/direct-call-specific | B05 | Server | No | Medium | KEEP |
| WEB-032 | `apps/web/app/api/auth/sync-user/route.ts` | auth | API | REFACTOR | same route handler delegating OAuth user sync to `features/auth/api/sync-user.ts` | B06 | Server | No | Medium | DONE |
| WEB-033 | `apps/web/app/api/dev/db/_lib/devDbProxy.ts` | dev-db | FEATURE_LIB | KEEP | same | B02 | Server | No | Low | KEEP |
| WEB-034 | `apps/web/app/api/dev/db/reset/route.ts` | dev-db | API | KEEP | same | B02 | Server | No | Low | KEEP |
| WEB-035 | `apps/web/app/api/dev/db/seed-dashboard/route.ts` | dev-db | API | KEEP | same | B02 | Server | No | Low | KEEP |
| WEB-036 | `apps/web/app/api/dev/db/seed-groups/route.ts` | dev-db | API | KEEP | same | B02 | Server | No | Low | KEEP |
| WEB-037 | `apps/web/app/api/dev/db/seed-resources/route.ts` | dev-db | API | KEEP | same | B02 | Server | No | Low | KEEP |
| WEB-038 | `apps/web/app/api/dev/db/seed-users/route.ts` | dev-db | API | KEEP | same | B02 | Server | No | Low | KEEP |
| WEB-039 | `apps/web/app/app-theme.css` | styling | STYLE | SPLIT_FILE | BLOCKED: requires cascade mapping and visual regression coverage before safe extraction | B03 | Global CSS | No | High | BLOCKED |
| WEB-040 | `apps/web/features/chat/styles/chat.css` | chat | STYLE | MOVE | same | B03 | Global CSS imported by root layout | No | Medium | DONE |
| WEB-041 | `apps/web/app/globals.css` | styling | STYLE | KEEP | same | B03 | Global CSS | No | Medium | KEEP |
| WEB-042 | `apps/web/app/layout.tsx` | app-shell | LAYOUT | REFACTOR | same with app-wide providers only | B08 | Server | No | High | DONE |
| WEB-043 | `apps/web/features/chat/components/empty-chat-state.tsx` | chat | FEATURE_COMPONENT | MOVE | same | B03 | Server-safe | No | Low | DONE |
| WEB-044 | `apps/web/features/chat/components/loading/ProfileSkeleton.tsx` | chat | FEATURE_COMPONENT | MOVE | same | B03 | Client-safe | No | Low | DONE |
| WEB-045 | DELETED: apps/web/components/Loading/Spinner.tsx | unknown-unused | OTHER | DELETE_CANDIDATE | removed after import, barrel, dynamic, test, and route scans found no usage | B03 | Server-safe | No | Low | DONE |
| WEB-046 | `apps/web/features/account-profile/components/profile-avatar-editor.tsx` | account-profile | FEATURE_COMPONENT | MOVE | same; display-only avatar split to `components/shared/media/Avatar.tsx` | B03 | Client | CS-006 | High | DONE |
| WEB-047 | `apps/web/features/chat/components/avatar-with-status.tsx` | chat | FEATURE_COMPONENT | MOVE | same | B03 | Server-safe | No | Medium | DONE |
| WEB-048 | `apps/web/features/chat/components/message-composer/CaptureAudio.tsx` | chat | FEATURE_COMPONENT | MOVE | same | B03 | Client | CS-001 | Medium | DONE |
| WEB-049 | `apps/web/features/account-profile/components/profile-media/CapturePhoto.tsx` | account-profile | FEATURE_COMPONENT | MOVE | same | B03 | Client | CS-005 | Medium | DONE |
| WEB-050 | `apps/web/components/shared/ContextMenu.tsx` | shared-ui | SHARED_COMPONENT | MOVE | same | B03 | Client | No | Medium | DONE |
| WEB-051 | DELETED: apps/web/components/common/DropZoneUploader.tsx | unknown-unused | OTHER | DELETE_CANDIDATE | removed after import, barrel, dynamic, test, and route scans found no usage | B03 | Client | No | Medium | DONE |
| WEB-052 | DELETED: apps/web/components/common/Input.tsx | unknown-unused | OTHER | DELETE_CANDIDATE | removed after import, barrel, dynamic, test, and route scans found no usage | B03 | Client-safe | No | Low | DONE |
| WEB-053 | DELETED: apps/web/components/common/Loader.tsx | unknown-unused | OTHER | DELETE_CANDIDATE | removed after import, barrel, dynamic, test, and route scans found no usage | B03 | Server-safe | No | Low | DONE |
| WEB-054 | `apps/web/features/chat/components/message-status.tsx` | chat | FEATURE_COMPONENT | MOVE | same | B03 | Server-safe | No | Medium | DONE |
| WEB-055 | `apps/web/features/account-profile/components/profile-media/PhotoLibrary.tsx` | account-profile | FEATURE_COMPONENT | MOVE | same | B03 | Client | CS-006 | Medium | DONE |
| WEB-056 | `apps/web/components/shared/media/PhotoPicker.tsx` | shared-media | SHARED_COMPONENT | MOVE | same | B03 | Client | CS-006 | Medium | DONE |
| WEB-057 | `apps/web/features/account-profile/components/profile-media/CropEasy.tsx` | account-profile | FEATURE_COMPONENT | MOVE | same | B03 | Client | CS-004 | Medium | DONE |
| WEB-058 | `apps/web/features/account-profile/components/profile-media/ProfileAvatar.tsx` | account-profile | FEATURE_COMPONENT | MOVE | same | B03 | Client | CS-004 | Medium | DONE |
| WEB-059 | `apps/web/features/account-profile/lib/cropImage.ts` | account-profile | FEATURE_UTILITY | MOVE | same | B03 | Client utility | No | Medium | DONE |
| WEB-060 | `apps/web/features/account-profile/components/profile-media/Slider.tsx` | account-profile | FEATURE_COMPONENT | MOVE | same | B03 | Client | No | Low | DONE |
| WEB-061 | `apps/web/features/account-profile/components/profile-media/slider.css` | account-profile | STYLE | MOVE | same | B03 | CSS | No | Low | DONE |
| WEB-062 | `apps/web/components/layout/AppShell.tsx` | app-shell | SHARED_COMPONENT | REFACTOR | `components/layout/AppShell.tsx` with feature-neutral dependencies | B08 | Client | No | High | DONE |
| WEB-063 | `apps/web/components/layout/index.ts` | app-shell | OTHER | REVIEW | same narrow barrel retained | B03 | Shared | No | Low | DONE |
| WEB-064 | `apps/web/components/ui/icons.tsx` | shared-ui | UI_PRIMITIVE | REFACTOR | same after removing learning type import | B03 | Server-safe | No | Medium | DONE |
| WEB-065 | `apps/web/components/ui/index.ts` | shared-ui | OTHER | REVIEW | same narrow barrel retained with UI type exports | B03 | Shared | No | Low | DONE |
| WEB-066 | `apps/web/components/ui/primitives.tsx` | shared-ui | UI_PRIMITIVE | REFACTOR | same after extracting tone type and removing unnecessary client boundary | B03 | Server-safe | No | Medium | DONE |
| WEB-067 | `apps/web/features/auth/providers/AuthProvider.tsx` | auth | PROVIDER | MOVE | moved from `apps/web/context/AuthProvider.tsx` | B06 | Client | No | Medium | DONE |
| WEB-068 | DELETED: apps/web/context/ModalContextProvider.tsx | shared-ui | PROVIDER | DELETE | DELETED: dead provider with zero consumers | B08 | Client | No | Medium | DONE |
| WEB-069 | DELETED: apps/web/context/StateContext.tsx | app-state | CONTEXT | SPLIT_FILE | split into `features/auth/providers/AuthStateProvider.tsx` and `features/chat/state/ChatStateContext.tsx` | B08 | Client | No | High | DONE |
| WEB-070 | DELETED: apps/web/context/StateReducers.ts | app-state | CONTEXT | MOVE | moved to `features/chat/state/chat-reducer.ts` | B08 | Shared client state | No | High | DONE |
| WEB-071 | DELETED: apps/web/context/constants.ts | app-state | CONTEXT | MOVE | moved to `features/chat/state/chat-reducer.ts` as `chatReducerCases` | B08 | Shared client state | No | High | DONE |
| WEB-072 | `apps/web/features/account-profile/components/account-page-content.tsx` | account-profile | FEATURE_COMPONENT | MOVE | moved from `features/account/AccountPageContent.tsx`; existing controller/primitives split retained | B06 | Client | No | Medium | DONE |
| WEB-073 | `apps/web/features/account-profile/lib/account-settings.tsx` | account-profile | FEATURE_LIB | MOVE | moved from `features/account/accountSettings.tsx` | B06 | Shared client-safe constants | No | Low | DONE |
| WEB-074 | `apps/web/features/account-profile/components/settings-primitives.tsx` | account-profile | FEATURE_COMPONENT | MOVE | moved from `features/account/settingsPrimitives.tsx` | B06 | Client | No | Low | DONE |
| WEB-075 | `apps/web/features/account-profile/hooks/useAccountSettingsController.ts` | account-profile | FEATURE_HOOK | MOVE | moved from `features/account/useAccountSettingsController.ts` | B06 | Client | No | Medium | DONE |
| WEB-076 | `apps/web/features/auth/components/social-auth.tsx` | auth | FEATURE_COMPONENT | MOVE | moved from `features/auth/socialAuth.tsx` | B06 | Client | No | Low | DONE |
| WEB-077 | `apps/web/features/chat/components/ChatLeftBar/components/AllContactsList.tsx` | chat | FEATURE_COMPONENT | KEEP | same | B04 | Client | No | Medium | KEEP |
| WEB-078 | `apps/web/features/chat/components/ChatLeftBar/components/ChatListHeader.tsx` | chat | FEATURE_COMPONENT | KEEP | same | B04 | Client | No | Medium | KEEP |
| WEB-079 | `apps/web/features/chat/components/ChatLeftBar/components/ChatListItem.tsx` | chat | FEATURE_COMPONENT | KEEP | same | B04 | Client | No | Medium | KEEP |
| WEB-080 | `apps/web/features/chat/components/ChatLeftBar/components/List.tsx` | chat | FEATURE_COMPONENT | KEEP | same | B04 | Client | No | Medium | KEEP |
| WEB-081 | `apps/web/features/chat/components/ChatLeftBar/components/SearchBar.tsx` | chat | FEATURE_COMPONENT | KEEP | same | B04 | Client | No | Low | KEEP |
| WEB-082 | `apps/web/features/chat/components/ChatLeftBar/index.tsx` | chat | FEATURE_COMPONENT | KEEP | same | B04 | Client | No | Medium | KEEP |
| WEB-083 | `apps/web/features/chat/components/ChatRightBar/Chat/ChatContainer/ImageMessage.tsx` | chat | FEATURE_COMPONENT | KEEP | same | B04 | Client | No | Medium | KEEP |
| WEB-084 | `apps/web/features/chat/components/ChatRightBar/Chat/ChatContainer/VoiceMessage.tsx` | chat | FEATURE_COMPONENT | CODE_SPLIT | verified: no heavy dependency (React + `react-icons` + native `<audio>` only); pre-existing `next/dynamic` boundary removed and `ChatContainer` now imports it eagerly | B09 | Client | CS-002 (resolved: keep eager) | Medium | DONE |
| WEB-085 | `apps/web/features/chat/components/ChatRightBar/Chat/ChatContainer/index.tsx` | chat | FEATURE_COMPONENT | REFACTOR | same, hook order fixed | B04 | Client | No | High | DONE |
| WEB-086 | `apps/web/features/chat/components/ChatRightBar/Chat/ChatHeader.tsx` | chat | FEATURE_COMPONENT | SPLIT_FILE | call actions and menu/search/details actions split into B04 leaf components | B04 | Client | No | High | DONE |
| WEB-087 | `apps/web/features/chat/components/ChatRightBar/Chat/MessageSendBar.tsx` | chat | FEATURE_COMPONENT | CODE_SPLIT | emoji picker moved behind lazy `EmojiPickerPanel` wrapper (`CS-003`); `CaptureAudio` dynamic import gained a `loading` fallback (`CS-001`); `PhotoPicker` kept eager (`CS-006`: trivial `react-dom` portal input, no bundle cost) | B09 | Client | CS-001, CS-003 (done); CS-006 (keep eager) | Medium | DONE |
| WEB-088 | `apps/web/features/chat/components/ChatRightBar/Chat/index.tsx` | chat | FEATURE_COMPONENT | KEEP | same | B04 | Client | No | Low | KEEP |
| WEB-089 | `apps/web/features/chat/components/ChatRightBar/SearchMessagesRightMostChatContainer.tsx` | chat | FEATURE_COMPONENT | CODE_SPLIT | reviewed for `CS-009`: no heavy dependency (icon-only panel, `react-icons` + `calculateTime`); always mounted inside the `ChatRightBar` client boundary and toggled by CSS; runtime split not justified, kept eager | B09 | Client | CS-009 (keep eager) | Medium | DONE |
| WEB-090 | `apps/web/features/chat/components/ChatRightBar/index.tsx` | chat | FEATURE_COMPONENT | KEEP | same | B04 | Client | No | Medium | KEEP |
| WEB-091 | `apps/web/features/direct-call/providers/DirectCallProviderLayer.tsx` | direct-call | PROVIDER | MOVE | moved from `features/chat/direct-call/DirectCallProviderLayer.tsx` | B05 | Client | CS-008 | High | DONE |
| WEB-092 | `apps/web/features/direct-call/components/DirectCallRouteClient.tsx` | direct-call | FEATURE_COMPONENT | SPLIT_FILE | moved and split into route client, room, and state components | B05 | Client | CS-007 | High | DONE |
| WEB-093 | `apps/web/features/direct-call/components/IncomingDirectCallOverlay.tsx` | direct-call | FEATURE_COMPONENT | MOVE | moved from `features/chat/direct-call/IncomingDirectCallOverlay.tsx`; runtime deferral remains `CS-008` in B09 | B05 | Client | CS-008 | Medium | DONE |
| WEB-094 | `apps/web/features/direct-call/lib/guards.ts` | direct-call | FEATURE_LIB | MOVE | moved from `features/chat/direct-call/guards.ts` | B05 | Shared | No | Medium | DONE |
| WEB-095 | `apps/web/features/direct-call/lib/routing.ts` | direct-call | FEATURE_LIB | MOVE | moved from `features/chat/direct-call/routing.ts` | B05 | Shared | No | Low | DONE |
| WEB-096 | `apps/web/features/direct-call/lib/service.ts` | direct-call | FEATURE_LIB | MOVE | moved from `features/chat/direct-call/service.ts` | B05 | Client | No | High | DONE |
| WEB-097 | `apps/web/features/direct-call/lib/storage.ts` | direct-call | FEATURE_UTILITY | MOVE | moved from `features/chat/direct-call/storage.ts` | B05 | Client-safe guarded | No | Low | DONE |
| WEB-098 | `apps/web/features/direct-call/types.ts` | direct-call | FEATURE_TYPE | MOVE | moved from `features/chat/direct-call/types.ts` | B05 | Shared | No | Medium | DONE |
| WEB-099 | `apps/web/features/chat/hooks/useChatPageController.ts` | chat | FEATURE_HOOK | KEEP | same | B04 | Client | No | High | KEEP |
| WEB-100 | `apps/web/features/dashboard-feed/components/feed.tsx` | dashboard-feed | FEATURE_COMPONENT | MOVE | moved from `features/feed/components.tsx` | B07 | Client | No | Medium | DONE |
| WEB-101 | `apps/web/features/dashboard-feed/index.ts` | dashboard-feed | OTHER | MOVE | moved from `features/feed/index.ts`; narrow dashboard-feed barrel retained | B07 | Shared | No | Low | DONE |
| WEB-102 | `apps/web/features/landing/components/HomePageContent.tsx` | landing | FEATURE_COMPONENT | MOVE | same | B02 | Client | No | Medium | DONE |
| WEB-103 | `apps/web/features/learning/data/index.ts` | learning | FEATURE_LIB | MOVE | moved from `features/learning/data.ts`; further data splitting deferred because the module is static feature data | B07 | Shared | No | Medium | DONE |
| WEB-104 | `apps/web/features/learning/index.ts` | learning | OTHER | REVIEW | same narrow route-facing barrel retained | B07 | Shared | No | Medium | DONE |
| WEB-105 | `apps/web/features/learning/components/connections.tsx` | learning | FEATURE_COMPONENT | MOVE | moved from `features/learning/pages/connections.tsx` | B07 | Client | No | Medium | DONE |
| WEB-106 | `apps/web/features/learning/components/events.tsx` | learning | FEATURE_COMPONENT | MOVE | moved from `features/learning/pages/events.tsx`; unused imports removed | B07 | Client | No | Medium | DONE |
| WEB-107 | `apps/web/features/learning/components/explore.tsx` | learning | FEATURE_COMPONENT | MOVE | moved from `features/learning/pages/explore.tsx`; unused imports removed | B07 | Client | No | Medium | DONE |
| WEB-108 | `apps/web/features/learning/components/group-detail.tsx` | learning | FEATURE_COMPONENT | MOVE | moved from `features/learning/pages/group-detail.tsx` | B07 | Client | No | Medium | DONE |
| WEB-109 | `apps/web/features/learning/components/groups.tsx` | learning | FEATURE_COMPONENT | MOVE | moved from `features/learning/pages/groups.tsx` | B07 | Client | No | Medium | DONE |
| WEB-110 | `apps/web/features/learning/components/notifications.tsx` | learning | FEATURE_COMPONENT | MOVE | moved from `features/learning/pages/notifications.tsx`; unnecessary client directive removed | B07 | Server | No | Medium | DONE |
| WEB-111 | `apps/web/features/onboarding/components/OnboardingReferencePage.tsx` | onboarding | FEATURE_COMPONENT | MOVE | moved from `features/learning/pages/onboarding.tsx` | B06 | Client | No | Medium | DONE |
| WEB-112 | `apps/web/features/learning/components/projects.tsx` | learning | FEATURE_COMPONENT | MOVE | moved from `features/learning/pages/projects.tsx`; further source split deferred until behavior coverage improves | B07 | Client | No | Medium | DONE |
| WEB-113 | `apps/web/features/learning/components/resources.tsx` | learning | FEATURE_COMPONENT | MOVE | moved from `features/learning/pages/resources.tsx`; runtime split not justified without heavier preview code | B07 | Client | No | Medium | DONE |
| WEB-114 | `apps/web/features/learning/components/settings.tsx` | learning | FEATURE_COMPONENT | MOVE | moved from `features/learning/pages/settings.tsx`; unnecessary client directive removed | B07 | Server | No | Medium | DONE |
| WEB-115 | `apps/web/features/learning/components/shared.tsx` | learning | FEATURE_COMPONENT | MOVE | moved from `features/learning/pages/shared.tsx`; kept feature-owned shared learning helpers | B07 | Client | No | Medium | DONE |
| WEB-116 | `apps/web/features/learning/components/study-rooms.tsx` | learning | FEATURE_COMPONENT | MOVE | moved from `features/learning/pages/study-rooms.tsx`; runtime split deferred to B09 only if measured | B07 | Client | Maybe | High | DONE |
| WEB-117 | `apps/web/features/chat/hooks/useChatSocket.ts` | chat | FEATURE_HOOK | MOVE | moved from `apps/web/hooks/useChatSocket.ts` | B04 | Client | No | Medium | DONE |
| WEB-118 | `apps/web/features/account-profile/api/accountApi.ts` | account-profile | FEATURE_LIB | MOVE | moved from `apps/web/lib/account/accountApi.ts` | B06 | Client API | No | Medium | DONE |
| WEB-119 | `apps/web/lib/api/clientErrors.test.ts` | shared-infra | OTHER | KEEP | same | B03 | Test | No | Low | KEEP |
| WEB-120 | `apps/web/lib/api/clientErrors.ts` | shared-infra | SHARED_INFRA | KEEP | same | B03 | Shared | No | Low | KEEP |
| WEB-121 | `apps/web/lib/auth/formValidation.ts` | auth-account-shared | SHARED_UTILITY | REVIEW | same shared credential/profile validation used by auth and account-profile | B06 | Shared | No | Medium | DONE |
| WEB-122 | `apps/web/lib/auth/sessionToken.ts` | auth-shared | SHARED_INFRA | REVIEW | same shared server session-token reader used by auth and chat socket routes | B06 | Server | No | Medium | DONE |
| WEB-123 | `apps/web/lib/auth/userInfo.test.ts` | auth-shared | OTHER | REVIEW | same beside shared user-info infrastructure | B06 | Test | No | Low | DONE |
| WEB-124 | `apps/web/lib/auth/userInfo.ts` | auth-shared | SHARED_INFRA | REVIEW | same shared user-info loader/mapper consumed across chat, dashboard, learning, direct-call, and app state | B06 | Mixed | No | High | DONE |
| WEB-125 | `apps/web/features/chat/api/chatApi.ts` | chat | FEATURE_LIB | MOVE | moved from `apps/web/lib/chat/chatApi.ts` | B04 | Client API | No | High | DONE |
| WEB-126 | `apps/web/features/chat/lib/notificationSound.ts` | chat | FEATURE_UTILITY | MOVE | moved from `apps/web/lib/chat/notificationSound.ts` | B04 | Client-safe guarded | No | Low | DONE |
| WEB-127 | `apps/web/features/dashboard-feed/api/dashboardApi.test.ts` | dashboard-feed | OTHER | MOVE | moved from `lib/dashboard/dashboardApi.test.ts` | B07 | Test | No | Low | DONE |
| WEB-128 | `apps/web/features/dashboard-feed/api/dashboardApi.ts` | dashboard-feed | FEATURE_LIB | MOVE | moved from `lib/dashboard/dashboardApi.ts` | B07 | Client API | No | Medium | DONE |
| WEB-129 | `apps/web/features/dashboard-feed/types.ts` | dashboard-feed | FEATURE_TYPE | MOVE | moved from `lib/dashboard/types.ts` | B07 | Shared | No | Medium | DONE |
| WEB-130 | `apps/web/lib/debug/browserLogger.ts` | shared-infra | SHARED_INFRA | KEEP | same | B03 | Client-safe guarded | No | Low | KEEP |
| WEB-131 | `apps/web/features/learning/api/learningApi.ts` | learning | FEATURE_LIB | MOVE | moved from `lib/learning/learningApi.ts` | B07 | Client API | No | Medium | DONE |
| WEB-132 | `apps/web/features/learning/api/learningContentApi.ts` | learning | FEATURE_LIB | MOVE | moved from `lib/learning/learningContentApi.ts`; also owns learning study-room DTOs to avoid dashboard-feed imports | B07 | Client API | No | Medium | DONE |
| WEB-133 | `apps/web/features/learning/api/resourcesApi.test.ts` | learning | OTHER | MOVE | moved from `lib/resources/resourcesApi.test.ts` | B07 | Test | No | Low | DONE |
| WEB-134 | `apps/web/features/learning/api/resourcesApi.ts` | learning | FEATURE_LIB | MOVE | moved from `lib/resources/resourcesApi.ts` | B07 | Client API | No | Medium | DONE |
| WEB-135 | `apps/web/features/learning/types/resources.ts` | learning | FEATURE_TYPE | MOVE | moved from `lib/resources/types.ts` | B07 | Shared | No | Low | DONE |
| WEB-136 | DELETED: apps/web/lib/utils.ts | shared-utility | OTHER | DELETE_CANDIDATE | removed after moving `cn` to chat consumer and confirming URL helpers had no app usage | B03 | Shared | No | Low | DONE |
| WEB-137 | `apps/web/features/direct-call/providers/StreamClientProvider.tsx` | direct-call | PROVIDER | MOVE | moved from `apps/web/providers/StreamClientProvider.tsx` | B05 | Client | CS-007 | High | DONE |
| WEB-138 | `apps/web/features/direct-call/providers/stream-client-status.ts` | direct-call | PROVIDER | MOVE | moved from `apps/web/providers/stream-client-status.ts` | B05 | Client | No | Medium | DONE |
| WEB-139 | `apps/web/features/chat/types.ts` | chat | FEATURE_TYPE | MOVE | feature-facing chat type exports backed by shared contract `WEB-149` | B04 | Shared imports socket type | No | High | DONE |
| WEB-140 | `apps/web/utils/ApiRoutes.ts` | shared-infra | SHARED_INFRA | REVIEW | kept shared endpoint registry because unrelated auth, account, chat, dashboard, learning, resources, and call clients consume it | B07 | Shared | No | High | DONE |
| WEB-141 | `apps/web/features/chat/lib/calculateTime.ts` | chat | FEATURE_UTILITY | MOVE | moved from `apps/web/utils/CalculateTime.ts` | B04 | Shared | No | Low | DONE |
| WEB-142 | `apps/web/features/chat/components/chat-screen.tsx` | chat | FEATURE_COMPONENT | KEEP | same | B02 | Client | No | Medium | DONE |
| WEB-143 | `apps/web/features/auth/components/login-screen.tsx` | auth | FEATURE_COMPONENT | KEEP | same | B02 | Client | No | Medium | DONE |
| WEB-144 | `apps/web/features/onboarding/components/onboarding-client.tsx` | onboarding | FEATURE_COMPONENT | KEEP | same | B02 | Client | No | Medium | DONE |
| WEB-145 | `apps/web/features/dashboard-feed/components/dashboard-screen.tsx` | dashboard-feed | FEATURE_COMPONENT | KEEP | same | B02 | Client | No | High | DONE |
| WEB-146 | `apps/web/features/dashboard-feed/components/user-feeds-screen.tsx` | dashboard-feed | FEATURE_COMPONENT | KEEP | same | B02 | Server | No | Low | DONE |
| WEB-147 | `apps/web/components/shared/media/Avatar.tsx` | shared-media | SHARED_COMPONENT | KEEP | same display-only avatar split from legacy common avatar | B03 | Server-safe | No | Low | DONE |
| WEB-148 | `apps/web/types/yome-ui.ts` | shared-ui | SHARED_TYPE | KEEP | same tone/icon type contract for UI primitives and learning data | B03 | Shared | No | Low | DONE |
| WEB-149 | `apps/web/types/chat-contracts.ts` | shared-chat-contract | SHARED_TYPE | KEEP | shared chat identity/message ID contract used by chat, dashboard, actions, and app state | B04 | Shared | No | Medium | DONE |
| WEB-150 | `apps/web/features/chat/components/ChatRightBar/Chat/ChatHeaderCallActions.tsx` | chat | FEATURE_COMPONENT | KEEP | split from `ChatHeader.tsx` for direct call controls | B04 | Client | No | Medium | DONE |
| WEB-151 | `apps/web/features/chat/components/ChatRightBar/Chat/ChatHeaderMenuActions.tsx` | chat | FEATURE_COMPONENT | KEEP | split from `ChatHeader.tsx` for search/details/menu controls | B04 | Client | No | Medium | DONE |
| WEB-152 | `apps/web/features/direct-call/components/DirectCallRoom.tsx` | direct-call | FEATURE_COMPONENT | KEEP | split from `DirectCallRouteClient.tsx` for Stream room UI and device controls | B05 | Client | CS-007 | High | DONE |
| WEB-153 | `apps/web/features/direct-call/components/DirectCallStates.tsx` | direct-call | FEATURE_COMPONENT | KEEP | split from `DirectCallRouteClient.tsx` for loading/error states | B05 | Client | No | Low | DONE |
| WEB-154 | `apps/web/features/auth/api/sync-user.ts` | auth | FEATURE_LIB | KEEP | auth-owned OAuth user sync implementation extracted from API route | B06 | Server | No | Medium | DONE |
| WEB-155 | `apps/web/features/onboarding/data/onboarding-options.ts` | onboarding | FEATURE_LIB | KEEP | onboarding-owned interest and goal options extracted from learning dependency | B06 | Shared | No | Low | DONE |
| WEB-156 | `apps/web/lib/app-shell/data-types.ts` | app-shell | SHARED_TYPE | KEEP | feature-neutral data contract for AppShell props containing dashboard profile and sidebar groups | B08 | Shared | No | Low | DONE |
| WEB-157 | `apps/web/lib/app-shell/navigation.ts` | app-shell | SHARED_LIB | KEEP | feature-neutral navigation configuration extracted from learning feature | B08 | Shared | No | Low | DONE |
| WEB-158 | `apps/web/components/layout/YomeAppShellContainer.tsx` | app-shell | FEATURE_CONTAINER | KEEP | feature-aware wrapper component that fetches dashboard data and orchestrates AppShell composition | B08 | Client | No | Medium | DONE |
| WEB-159 | `apps/web/features/auth/providers/AuthStateProvider.tsx` | auth | PROVIDER | KEEP | scoped auth session user-info provider extracted from global state | B08 | Client | No | Medium | DONE |
| WEB-160 | `apps/web/features/chat/state/ChatStateContext.tsx` | chat | CONTEXT | KEEP | scoped chat state provider extracted from global state | B08 | Client | No | High | DONE |
| WEB-161 | `apps/web/features/chat/state/chat-reducer.ts` | chat | CONTEXT | KEEP | chat reducer and action constants extracted from global state | B08 | Shared client state | No | High | DONE |
| WEB-162 | `apps/web/features/chat/components/message-composer/EmojiPickerPanel.tsx` | chat | FEATURE_COMPONENT | KEEP | lazy wrapper that owns the `emoji-picker-react` dependency so `MessageSendBar` can load the picker on first open (`CS-003`) | B09 | Client | CS-003 | Low | DONE |
