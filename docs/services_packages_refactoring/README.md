# services/ and packages/ Refactor — Document Index

Planning set for re-architecting the Yome backend. Sibling of `docs/app_web_refactoring/`
(which covered `apps/web` and is complete).

**Status: planning only.** Phase 1 batch B01 (documentation) is complete. No `services/*` or
`packages/*` source has been changed. Branch: `refactor/services-packages-architecture`.

## Read in this order

| # | Document | Answers |
| --- | --- | --- |
| 1 | [architecture-plan.md](./architecture-plan.md) | **Where does the code live?** Current assessment, domain → owner map, target directory structure, architecture rules, Phase 1 batches B01–B10. |
| 2 | [service-decomposition-plan.md](./service-decomposition-plan.md) | **What runs as its own process?** Runtime-driver audit per domain, why most domains are modules rather than services, gateway route map before/after, shared-package extraction. |
| 3 | [data-architecture-plan.md](./data-architecture-plan.md) | **Where does the data live?** Target store per model, trigger definitions T-01…T-07 with thresholds, Redis introduction, database-split mechanics, cross-domain reads that break under a split. |
| 4 | [event-architecture-plan.md](./event-architecture-plan.md) | **How do domains share data asynchronously?** Transactional outbox + Redis Streams, event envelope, 25-event catalogue, consumer map, delivery guarantees, schema evolution. |
| 5 | [api-and-dataflow-plan.md](./api-and-dataflow-plan.md) | **What is the synchronous surface?** Every endpoint with owner and models touched, sync-vs-async rules, service-to-service call rules, resilience requirements, end-to-end flow diagrams. |
| 6 | [refactor-manifest.md](./refactor-manifest.md) | **What happens to each file?** All 78 eligible files with ID, action, destination, batch, risk, status. |
| 7 | [migration-log.md](./migration-log.md) | **What has actually happened?** Batch execution history, pre-existing issue inventory, trigger measurements, validation results. |

## The phase model

| Phase | Theme | Batches | Gate |
| --- | --- | --- | --- |
| **P1** | Code + process boundaries, one PostgreSQL database | B01–B10 | — |
| **P2** | Redis: presence, socket fan-out, rate limiting, cache | B11–B12 | P1 complete |
| **P3** | Event backbone (outbox → Redis Streams), still one DB | B13–B14 | P2 complete |
| **P4** | Read models + search index | B15–B16 | P3 complete + trigger fired |
| **P5/P6** | Database extraction / polyglot persistence | B17+, B18+ | Trigger measured and recorded |

Two principles the set is built on:

1. **You cannot split a database along boundaries that do not exist yet.** P1 establishes one
   writer per table; that is the unit of any later extraction.
2. **A store change requires a trigger, not an aspiration.** Every move in
   `data-architecture-plan.md` names a signal, a threshold, and a measurement. Nothing moves
   because a technology feels right for a workload shape.

**Most systems should stop at P4.** P1–P4 remove the real pain — unscalable presence,
uncacheable reads, a seven-query dashboard fan-out, unindexed search — without paying for
eventual consistency, lost foreign keys, or a second operational surface.

## Target topology (end of P1)

7 services → 6 deployable units:

- `gateway` — edge (routing, auth, rate limiting)
- `identity` — credentials + profile (renamed from `auth`, absorbs profile from `user`)
- `core` — modules: `community`, `learning`, `feed`, `dashboard` (absorbs `user` + `resources`)
- `messaging` — messages, calls, realtime (renamed from `chat`)
- `media` — object storage uploads (loses its `@repo/database` dependency)
- `notifications` — stub in P1, first event consumer in P3

`packages/shared` → `service-kit` + `storage` + `contracts` + `seed`.

## Already-fired triggers

Two are correctness defects, not optimisations, and are why P2 is not optional:

- **T-01** — presence is a process-local `Map` (`services/chat/src/state/online-users.ts:2`)
  and socket fan-out targets local socket ids. A second `messaging` replica silently breaks
  message delivery.
- **T-02** — rate-limit buckets are a process-local `Map`
  (`services/gateway/src/index.ts:79`). N `gateway` replicas grant N× the configured limit.
