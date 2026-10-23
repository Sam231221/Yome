/**
 * Development-only database seeding: fixtures + the runners that write them. Must never be
 * imported from a runtime request path — only from a dev-guarded route (see `devSeedGuard`).
 * See docs/services_packages_refactoring/architecture-plan.md (B04).
 */
export { canRunSeedMutations, devSeedGuard } from "./guard.js";
export {
  createDashboardDemoData,
  createEducationGroups,
  createLearningResources,
  createMultipleUsersWithProfiles,
  deleteAllRecords,
} from "./runners.js";
