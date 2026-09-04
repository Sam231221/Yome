import type { NextFunction, Request, Response } from "express";

/**
 * Seed mutations are only ever safe against a disposable/local database. Both conditions
 * must hold: the operator has explicitly opted in, and the process is not running in
 * production.
 */
export function canRunSeedMutations(): boolean {
  return (
    process.env.ENABLE_DEV_SEED_ROUTES === "true" &&
    process.env.NODE_ENV !== "production"
  );
}

/**
 * Route-level guard for a seed router. Mount once with `router.use(devSeedGuard)` rather
 * than checking `canRunSeedMutations()` inside every handler.
 */
export function devSeedGuard(_req: Request, res: Response, next: NextFunction): void {
  if (canRunSeedMutations()) {
    next();
    return;
  }
  res.status(404).json({
    ok: false,
    error: "Not found",
    details: "Seed endpoints are disabled",
  });
}
