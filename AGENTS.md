# Repository Guidelines

## Project Structure & Module Organization

Yome is a Bun/Turborepo monorepo. The primary production app is the Next.js App Router app in `apps/web`. Backend services live in `services/*` (`gateway`, `auth`, `user`, `chat`, `media`, `notifications`, `resources`). Shared packages live in `packages/*`: `shared`, `database`, `typescript-config`, and `eslint-config`. Cross-service smoke tests live in `tests`, and architecture/refactor notes belong under `docs/refactoring/`.

## Build, Test, and Development Commands

- `bun install`: install workspace dependencies.
- `bun run dev`: start all Turbo development tasks.
- `bun run dev:web`: start only `apps/web`.
- `bun run dev:services`: run gateway and backend services together.
- `bun run build`: build all workspaces through Turbo.
- `bun run check-types` or `bun run check-types:all`: run TypeScript checks.
- `bun run lint`: run configured lint tasks.
- `bun run test`: run workspace test tasks.
- `bun run test:integration`: run contract smoke tests after builds.
- `bun run db:migrate`: apply Prisma migrations from `packages/database`.
- `bun run format`: format `ts`, `tsx`, and Markdown files with Prettier.

## Coding Style & Naming Conventions

Use TypeScript and ES modules. Follow the existing two-space indentation, double-quoted imports, and semicolon style. React components use PascalCase filenames, such as `AvatarWithStatus.tsx`; hooks use `useThing.ts`; tests use `*.test.ts`. Keep shared contracts and middleware in `packages/shared` instead of duplicating service-local types.

## Web Architecture Rules

Use feature-oriented architecture in `apps/web`. Feature-specific components, hooks, types, utilities, state, contexts, providers, actions, API/domain logic, validators, and constants belong under `apps/web/features/<feature>/`. Global directories must contain only genuinely cross-feature code.

`apps/web/app` should primarily contain routes, layouts, metadata, loading/error boundaries, route composition, and server-side orchestration. Avoid implementing full business features in route files. Routes may compose feature implementations, for example `app/(communication)/chat/page.tsx` importing `features/chat/components/chat-screen.tsx`.

Directory ownership:

- `components/ui/`: generic reusable UI primitives.
- `components/layout/`: application shell/layout components.
- `components/shared/`: cross-feature application components.
- `hooks/`: only hooks used by multiple unrelated features.
- `types/`: only truly cross-domain types.
- `lib/`: shared infrastructure such as API clients, auth, database clients, logging, telemetry, configuration, framework adapters, and shared serialization.
- `utils/`: small generic pure utilities used across features.
- `providers/`: only application-wide providers.

A component, hook, type, provider, helper, or library used by only one feature belongs inside that feature. Feature-specific providers should be scoped to their feature or relevant route.

Server Components are the default. Review every `"use client"` directive: it should exist only for state, effects, browser APIs, event handlers, client-only dependencies, or similar requirements. Push client boundaries down the tree; never convert a route or layout to a Client Component solely because one child requires interactivity.

File splitting and runtime code splitting are different. Use Next.js route-level splitting naturally. Use `next/dynamic` or dynamic imports only for meaningful heavy or optional UI, such as rich text editors, charts, maps, large modals, file previewers, dashboards, data visualizations, or client-only third-party libraries. Do not dynamically import trivial components.

Before moving a file, search direct imports, re-exports, dynamic imports, tests, route references, and server actions. Determine whether it is shared or feature-owned and identify server/client boundary implications. Never move a file based only on its filename.

Never delete files or exports because they merely appear unused. Prove they are unused across direct imports, dynamic imports, barrel exports, tests, configuration, route usage, and server actions.

Prefer dependency direction: `app -> features -> shared components/hooks -> shared lib/utils`. Avoid shared code depending on feature implementations, and avoid unnecessary feature-to-feature internal dependencies.

After every logical migration batch, run appropriate TypeScript checks, ESLint, and tests. Run the production Next.js build periodically and at the end. Do not accumulate broken imports across batches.

The authoritative migration state lives under `docs/refactoring/`. Every eligible source file should eventually be classified as `DONE`, `KEEP`, or `BLOCKED`. Do not claim the repository-wide refactor is complete while unresolved `PENDING` or `IN_PROGRESS` items remain.

## Testing Guidelines

Unit tests use Bun’s test runner or Node’s built-in `node:test`, depending on the package. Place tests beside the code they cover, using names like `chat.validation.test.ts` or `s3.test.ts`. Add focused tests for validation, conversation ownership, storage helpers, and API client behavior. Run package-level tests while iterating, then `bun run test` and relevant type checks before a PR.

## Commit & Pull Request Guidelines

Recent history uses concise prefixes such as `feat:`, `fix(chat):`, and `chore:`; keep subjects imperative and scoped when helpful. Pull requests should include a behavior summary, validation commands run, linked issues, and screenshots or recordings for UI changes. Note database migrations, environment variable changes, and service contract changes explicitly.

## Security & Configuration Tips

Keep one root `.env` out of git. Treat `NEXTAUTH_SECRET`, database URLs, S3 credentials, Stream keys, and gateway/internal tokens as secrets. Prefer the S3-backed upload path for new media; legacy Cloudinary URLs are supported only for existing data.
