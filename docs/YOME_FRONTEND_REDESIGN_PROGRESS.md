# Yome Frontend Redesign Progress

## Goal

Redesign the Yome frontend to follow the attached `yome-react` reference design: learning-first content, compact social UI, navy/blue/teal/amber/violet palette, white card surfaces, full desktop rails, and responsive mobile navigation.

## Phase Checklist

- [x] Phase 1: Audit current Next routes, auth/profile/chat integration, and the attached reference app.
- [x] Phase 2: Add shared Yome design system classes, typed frontend fixtures, and progress tracker.
- [x] Phase 3: Replace public landing, login/register, onboarding, dashboard, and app shell UI.
- [x] Phase 4: Add real routes for explore, groups, connections, study rooms, resources, projects, events, notifications, and settings.
- [x] Phase 5: Restyle live account and chat surfaces while preserving existing API/socket behavior.
- [x] Phase 6: Remove dead dashboard/Facebook-style code after replacement routes compile.
- [x] Phase 7: Run tests, build, and browser-check desktop/mobile layouts.
- [x] Chat responsive hardening: desktop details rail, compact two-column inbox/chat, single-pane mobile navigation, and stable composer sizing across narrow and short viewports.

## Completed Pages

- `/`
- `/login`
- `/onboarding`
- `/dashboard`
- `/explore`
- `/groups`
- `/groups/[id]`
- `/connections`
- `/chat`
- `/study-rooms`
- `/resources`
- `/resources/[id]`
- `/projects`
- `/projects/[id]`
- `/events`
- `/notifications`
- `/settings`
- `/account`

## Pending Cleanup

- OAuth provider labels still include Facebook because that is a real authentication provider.
- `/userfeeds` remains as a legacy protected route outside the requested redesign surface.

## Known Risks

- The reference project is a static single-page demo; the production app uses Next routes, NextAuth, sockets, and service APIs.
- New learning surfaces are frontend fixtures in this pass, so resources, projects, events, study rooms, reports, and learning preferences are not persisted yet.
- Existing live chat internals remain in place and are wrapped with Yome shell colors; deeper chat-message component restyling can continue without changing socket behavior.

## Verification

- `bun test lib/**/*.test.ts` in `apps/web`: passed.
- `bun --env-file=../../.env next build` in `apps/web`: passed.
- Browser smoke: landing, login redirect behavior, desktop dashboard, mobile dashboard, and mobile project detail checked with no horizontal overflow.

## Backend Recommendations

- Extend `UserProfile` with `educationLevel`, `interests`, `topics`, `learningGoals`, and optional academic links.
- Add persisted models and APIs for resources, projects, events, study rooms, accepted answers, saved items, reports, and notification preferences.
- Replace general-purpose seed groups with STEM/learning seed groups while preserving the current group membership APIs.
