# apps/web Code Splitting Plan

## Summary

This document audits real runtime code-splitting opportunities for `apps/web`. Source-file splitting, feature moves, and CSS reorganization are not runtime code splitting. Next.js App Router route-level splitting remains the default. Use `next/dynamic` or dynamic `import()` only for modules that are heavy, optional, route-scoped, interaction-gated, or browser-only.

B01 verification completed on 2026-09-02: the existing dynamic imports and all runtime split candidates were re-checked. Existing dynamic imports currently use `ssr: false` without explicit `loading` props; B09 owns any fallback changes. No dynamic imports were added or changed during B01.

B02 completed on 2026-09-02: route files remain eagerly loaded through normal App Router route-level splitting. No runtime dynamic imports were added, removed, or changed.

B03 completed on 2026-09-02: no new runtime dynamic imports were introduced. The existing `CaptureAudio` dynamic import now points to the chat-owned module path after the ownership move; profile media candidates remain deferred to B09.

B04 completed on 2026-09-02: no runtime dynamic imports were added or removed. `ChatHeader` was source-split into call and menu action leaves, and those always-visible controls remain eager under `CS-010`.

B05 completed on 2026-09-02: direct-call and Stream modules moved to `features/direct-call`, and `DirectCallRouteClient` was source-split into route, room, and state components. No runtime dynamic imports were added or removed; `CS-007` and `CS-008` remain B09 candidates.

B06 completed on 2026-09-02: auth, account-profile, and onboarding ownership moves did not add, remove, or change runtime dynamic imports. Account profile media candidates `CS-004`, `CS-005`, and `CS-006` remain B09 candidates.

B07 completed on 2026-09-02: dashboard/feed and learning/resource ownership moves did not add, remove, or change runtime dynamic imports. Learning routes remain covered by App Router route-level splitting under `CS-012`; no learning component currently has a measured heavy optional dependency that justifies a new B07 runtime split.

B07 audit completed on 2026-09-02: no B07 dynamic imports were found or added. The study-room ownership fix moved API/type usage into learning-owned code and did not create a runtime split candidate.

B09 completed on 2026-09-04. Implemented splits: `CS-003` — `emoji-picker-react` is now behind a lazy `features/chat/components/message-composer/EmojiPickerPanel.tsx` wrapper that `MessageSendBar` loads with `next/dynamic` (`ssr: false`, `loading` fallback) on first emoji-popover open; `CS-001` — the existing `CaptureAudio` dynamic import gained a `loading` fallback (still `ssr: false`). Resolved without a split: `CS-002` — `VoiceMessage` has no heavy dependency (React + `react-icons` + native `<audio>`), so the pre-existing `next/dynamic` boundary (`EX-002`) was removed and `ChatContainer` imports it eagerly, per the "no trivial dynamic imports" rule. Reviewed and kept eager: `CS-004`/`CS-005`/`CS-006` (account side) — the entire `features/account-profile` profile-media edit flow (`profile-avatar-editor.tsx`, `ProfileAvatar.tsx`, `CropEasy.tsx`, `CapturePhoto.tsx`, `PhotoLibrary.tsx`) has **zero route reachability**; nothing imports `profile-avatar-editor.tsx` or `ProfileAvatar.tsx`, so `react-easy-crop` is not in any route bundle and a dynamic import would have no effect (flagged for B10 KEEP/DELETE reconciliation); `CS-006` (chat side) — `PhotoPicker` is a 16-line `react-dom` portal around a hidden `<input type="file">`, no bundle cost; `CS-007` — `DirectCallRouteClient`/`DirectCallRoom` are already isolated to the call route by App Router route-level splitting, and `@stream-io/video-react-sdk` is pulled onto every communication route by the always-mounted `DirectCallProviderLayer` → `StreamClientProvider`, so a route-client split cannot remove the SDK from `/chat`; a `next/dynamic` `ssr: false` boundary is also not expressible from the server `page.tsx` without adding a client wrapper for marginal, unmeasured benefit at High risk; `CS-008` — provider cost already dominates (matches the plan's stated fallback rationale), overlay itself is `lucide-react` icons plus guards; `CS-009` — `SearchMessagesRightMostChatContainer` is an icon-only panel with no heavy dependency. No files were moved or removed in B09.

B10 final review completed on 2026-09-04. The only `next/dynamic` boundaries in `apps/web` are `EX-001` (`CaptureAudio` + `wavesurfer.js`) and `EX-003` (`EmojiPickerPanel` + `emoji-picker-react`); both are heavy/interaction-gated/browser-only, both use `ssr: false` with a `loading` fallback and a chat owner, and no trivial dynamic import remains. `EX-002` stays retired. `CS-004`/`CS-005`/`CS-006` are resolved as **KEEP EAGER** — B10 confirmed the account profile-media cluster is provably route-unreachable (never wired in any commit), so there is nothing in a route bundle to split; the cluster is retained as feature-owned code with a product recommendation to wire it in or remove it (see the migration log B10 section). `CS-007`/`CS-008`/`CS-009` remain KEEP EAGER as decided in B09. `@stream-io/video-react-sdk` stays route-isolated by App Router route-level splitting plus the communication-layout provider. Out-of-scope observation, no action taken: `framer-motion` is declared in `apps/web/package.json` but has zero source imports. No dynamic imports were added, removed, or changed in B10.

## Existing Dynamic Imports

| Existing Import ID | Component/Module | Route | Owning Feature | Current Import Behavior | Related Candidate |
| --- | --- | --- | --- | --- | --- |
| EX-001 | `features/chat/components/message-composer/CaptureAudio.tsx` | `/chat` | chat | Dynamically imported by `MessageSendBar` when the composer enters audio mode. `ssr: false` with a `loading` fallback (fallback added in B09). | CS-001 |
| EX-002 | `features/chat/components/ChatRightBar/Chat/ChatContainer/VoiceMessage.tsx` | `/chat` | chat | Removed in B09 — `ChatContainer` now imports `VoiceMessage` eagerly because it carries no heavy dependency. | CS-002 |
| EX-003 | `features/chat/components/message-composer/EmojiPickerPanel.tsx` | `/chat` | chat | Added in B09. Dynamically imported by `MessageSendBar` on first emoji-popover open; `ssr: false` with a `loading` fallback. Owns the `emoji-picker-react` dependency. | CS-003 |

## Runtime Split Candidates

| Candidate ID | Component/Module | Route | Owning Feature | Current Import Behavior | Why Heavy/Optional/Deferred | Proposed Loading Mechanism | SSR Requirements | Loading Fallback | Expected Benefit | Risk | Implementation Batch | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CS-001 | `features/chat/components/message-composer/CaptureAudio.tsx` plus `wavesurfer.js` | `/chat` | chat | `next/dynamic` import from `MessageSendBar`, `ssr: false`, now with a `loading` fallback | Uses microphone APIs, `MediaRecorder`, WaveSurfer, upload logic; needed only for audio recording | Keep dynamic import with `ssr: false` | Client-only | `audio-recorder-shell` "Preparing recorder…" placeholder | Keeps WaveSurfer (~43 KB chunk) out of initial chat composer bundle | Medium | B09 | IMPLEMENTED (B09: fallback added) |
| CS-002 | `VoiceMessage` playback UI | `/chat` | chat | Eager static import from `ChatContainer` (B09 removed the pre-existing `next/dynamic` boundary) | No heavy dependency — React, `react-icons`, native `<audio>` only; not optional per message | Keep eager (trivial component) | Client-safe (renders `null` until user/chat present) | n/a | Removing a trivial dynamic boundary avoids an unnecessary chunk + suspense per audio message | Medium | B09 | RESOLVED — KEEP_EAGER (B09) |
| CS-003 | `emoji-picker-react` via `features/chat/components/message-composer/EmojiPickerPanel.tsx` in `MessageSendBar` | `/chat` | chat | B09: lazy `next/dynamic` wrapper, `ssr: false`, loaded on first emoji-popover open | Third-party picker ships a large emoji dataset and is shown only after the user opens the emoji UI | `next/dynamic` of the wrapper component on first open | Client-only, `ssr: false` | `composer-emoji-picker-loading` skeleton box | Removes `emoji-picker-react` from the initial chat composer bundle (now a lazy vendor chunk) | Low | B09 | IMPLEMENTED (B09) |
| CS-004 | `features/account-profile/components/profile-media/CropEasy.tsx` using `react-easy-crop` | `/account` | account-profile | Eager import inside `ProfileAvatar.tsx` | Cropper is only needed while changing profile images | — (no split) | — | — | None — see status | Medium | B09 | REVIEWED — KEEP_EAGER (B09: `ProfileAvatar.tsx` has no consumers; `react-easy-crop` is not in any route bundle. B10: resolved — orphan cluster KEPT as feature-owned code with a product recommendation; not a code split) |
| CS-005 | `features/account-profile/components/profile-media/CapturePhoto.tsx` | `/account` | account-profile | Eager import inside `profile-avatar-editor.tsx` | Uses `navigator.mediaDevices` and canvas only after camera option | — (no split) | — | — | None — see status | Medium | B09 | REVIEWED — KEEP_EAGER (B09: `profile-avatar-editor.tsx` has no consumers; trivial component with no heavy dependency. B10: resolved — orphan cluster KEPT as feature-owned code with a product recommendation; not a code split) |
| CS-006 | Photo library / picker flows | `/account`, `/chat` | account-profile/chat | `PhotoLibrary` in orphaned `profile-avatar-editor.tsx`; `PhotoPicker` eager in `MessageSendBar` and `profile-avatar-editor.tsx` | Media selection is interaction-gated | — (no split) | — | — | None — see status | Medium | B09 | REVIEWED — KEEP_EAGER (B09: `PhotoLibrary` is orphaned; `PhotoPicker` is a 16-line `react-dom` portal input with no bundle cost) |
| CS-007 | `features/direct-call/components/DirectCallRouteClient.tsx` and `DirectCallRoom.tsx` | `/chat/[id]/call/[callId]` | direct-call | Eager within the dedicated call route; also `@stream-io/video-react-sdk` is loaded on every communication route via `DirectCallProviderLayer` | Stream video UI and device controls are route-specific and heavy | Route-level isolation (already provided by App Router) | Client-only | `DirectCallLoadingState` (already rendered while the Stream client resolves) | Route-level splitting already scopes the call-client chunk to the call route | High | B09 | REVIEWED — KEEP_EAGER (B09: route-level split already isolates it; `ssr: false` not expressible from the server `page.tsx` without an extra client wrapper; SDK stays on `/chat` via the provider regardless; unmeasured, High risk) |
| CS-008 | `features/direct-call/components/IncomingDirectCallOverlay.tsx` | communication layout | direct-call | Eager via communication layout provider | Overlay is only useful when the Stream provider reports a ringing call | Keep eager (provider already dominates cost) | Client-only | n/a | Negligible — the heavy `StreamVideoProvider` is already mounted app-wide on communication routes | Medium | B09 | REVIEWED — KEEP_EAGER (B09: matches the plan's stated fallback rationale) |
| CS-009 | Search messages right panel | `/chat` | chat | Eager through `ChatRightBar`, always mounted, toggled by CSS | Optional panel shown only when message search is enabled | — (no split) | Client-only | n/a | Negligible — no heavy dependency, `react-icons` + `calculateTime` only | Low | B09 | REVIEWED — KEEP_EAGER (B09) |

## Keep Eager Decisions

| Candidate ID | Component/Module | Route | Owning Feature | Current Import Behavior | Why Keep Eager | Implementation Batch | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CS-010 | `ChatHeader`, `ChatHeaderCallActions`, `ChatHeaderMenuActions`, `ChatListItem`, `SearchBar`, `MessageStatus`, `AvatarWithStatus` | `/chat` | chat | Static imports | Small atoms or always-visible chat UI; dynamic import overhead is not justified | B04 | KEEP_EAGER |
| CS-011 | `components/ui/index.ts`, `types/yome-ui.ts`, and true shared primitives after cleanup | multiple | shared-ui | Static imports | Small shared primitives should remain readily available once feature imports are removed | B03 | KEEP_EAGER |
| CS-012 | App route pages | all routes | app | App Router route-level splitting | B02 kept route files eager and moved interactive bodies into feature components; extra dynamic route wrappers are not justified | B02 | KEEP_EAGER |
| CS-013 | `app-theme.css`, `features/chat/styles/chat.css`, `globals.css` | multiple | styling/chat | Global CSS imports | CSS needs ownership/cascade refactor first; runtime JS splitting does not apply directly | B03 | KEEP_EAGER |

## Major Route Coverage

| Route | Owning Feature | Runtime Split Decision | Candidate IDs | Notes |
| --- | --- | --- | --- | --- |
| `/` | landing | Keep eager for now | CS-012 | Route-level split is enough until landing bundle is measured. |
| `/login` | auth | Keep route eager; move client form body to feature | CS-012 | Social icon imports are not large enough alone to justify dynamic imports. |
| `/onboarding` | onboarding | Keep eager for now | CS-012 | Local-storage client state should move to feature leaf before any runtime split decision. |
| `/dashboard` | dashboard-feed | Keep eager | CS-012 | Dashboard/feed ownership now lives under `features/dashboard-feed`; no clearly heavy optional dashboard module was found in B07. |
| `/userfeeds` | dashboard-feed | Keep eager | CS-012 | Small placeholder route. |
| `/account` | account-profile | No split needed | CS-004, CS-005, CS-006 | B09: the profile-media edit flow (`profile-avatar-editor.tsx`, `ProfileAvatar.tsx`, `CropEasy.tsx`, `CapturePhoto.tsx`, `PhotoLibrary.tsx`) is orphaned — not reachable from `/account` or any route — so `react-easy-crop` is not in the route bundle and there is nothing to split. Flagged for B10 KEEP/DELETE reconciliation. |
| `/chat` | chat | Emoji picker + audio recorder split | CS-001, CS-003 | B09: `emoji-picker-react` and `wavesurfer.js` load lazily on first interaction; `VoiceMessage` (CS-002), the search panel (CS-009) and `PhotoPicker` (CS-006) stay eager — no heavy dependency. |
| `/chat/[id]` | chat | Keep eager redirect | CS-012 | Redirect route has no runtime split need. |
| `/chat/[id]/call/[callId]` | direct-call | Route-level isolation only | CS-007 | B09: App Router route-level splitting already scopes the Stream call-client chunk to this route; no additional `next/dynamic` split was justified (see CS-007). |
| `/connections` | learning | Keep eager | CS-012 | B07 moved ownership under learning; no heavy optional dependency identified. |
| `/events` | learning | Keep eager | CS-012 | No heavy optional module identified. |
| `/explore` | learning | Keep eager | CS-012 | B07 removed unused imports; remaining UI is route-owned and not a runtime split candidate. |
| `/groups` | learning | Keep eager | CS-012 | API/UI ownership is now learning-owned; no runtime-heavy module identified. |
| `/groups/[id]` | learning | Keep eager | CS-012 | Detail UI remains learning-owned and eager. |
| `/notifications` | learning | Keep eager | CS-012 | B07 removed the unnecessary client directive; route-level splitting is sufficient. |
| `/projects` | learning | Keep eager | CS-012 | No runtime-heavy library identified after B07 ownership move. |
| `/projects/[id]` | learning | Keep eager | CS-012 | Detail UI remains eager; no optional heavy module identified. |
| `/resources` | learning | Keep eager | CS-012 | Resource preview UI is CSS/markup-heavy, not a clear dynamic JS candidate. |
| `/resources/[id]` | learning | Keep eager | CS-012 | Detail UI remains eager; no optional heavy module identified. |
| `/settings` | learning | Keep eager | CS-012 | B07 removed the unnecessary client directive; route-level splitting is sufficient. |
| `/study-rooms` | learning | Keep eager pending measurement | CS-012 | Large page remains client-side for interactive room state; no B07 dynamic import was justified without measurement. |

## Blocked Items

No runtime split candidate is blocked. B09 reviewed every remaining candidate: `CS-001` and `CS-003` were implemented, `CS-002` was resolved by removing a trivial dynamic import, and `CS-004`–`CS-009` were reviewed and deliberately kept eager (orphaned targets, trivial components, or already-eager provider cost). B10 closed the code-splitting plan: the account profile-media orphan cluster (`CS-004`/`CS-005`/`CS-006` targets) is retained as feature-owned but route-unreachable code — resolved as KEEP EAGER with a product recommendation, not a code split. All runtime split candidates now have a terminal disposition.

## Validation

For each implemented runtime split, run:

- `bunx tsc -p apps/web/tsconfig.json --noEmit`
- `bun run --cwd apps/web lint`
- `bun run --cwd apps/web test`
- `bun run --cwd apps/web build`

Each candidate must retain an owning feature, fallback behavior, SSR decision, implementation batch, and status before implementation starts.
