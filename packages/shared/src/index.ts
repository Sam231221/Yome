/**
 * COMPATIBILITY SHIM — do not add code here.
 *
 * `@repo/shared` was split in B03 into:
 *   - `@repo/contracts`   service names, error envelope, shared helpers + zod primitives
 *   - `@repo/service-kit` express middleware, logger, env/ports, url helper
 *   - `@repo/storage`     S3 upload helpers
 *
 * This file only re-exports them so existing `import ... from "@repo/shared"` sites keep
 * working during the migration. Import sites are repointed to the specific package in
 * B05–B09, and this shim is deleted in B10 (see docs/services_packages_refactoring).
 */
export * from "@repo/contracts";
export * from "@repo/service-kit";
export * from "@repo/storage";
export { groupData } from "./data/groups.js";
