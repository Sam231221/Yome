import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ZodError, type ZodTypeAny } from "zod";

type RequestSchemas = {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
};

function formatPath(path: PropertyKey[]): string {
  if (path.length === 0) return "request";
  return path
    .map((segment) =>
      typeof segment === "number"
        ? `[${segment}]`
        : typeof segment === "symbol"
          ? segment.toString()
          : segment
    )
    .join(".");
}

export function validateRequest(schemas: RequestSchemas): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as Request["params"];
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as Request["query"];
      }
      if (schemas.body) {
        req.body = schemas.body.parse(req.body ?? {}) as Request["body"];
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          ok: false,
          error: "validation_failed",
          details: "Request validation failed",
          issues: error.issues.map((issue) => ({
            path: formatPath(issue.path),
            message: issue.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
}
