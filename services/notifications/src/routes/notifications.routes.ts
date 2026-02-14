import express, { type Request, type Response } from "express";

const router = express.Router();

interface SendBody {
  channel?: string;
  to?: string;
  template?: string;
  payload?: Record<string, unknown>;
}

/**
 * Stub: accepts send request and returns 202. Implement actual delivery
 * (email, push, in-app) in a future iteration.
 */
router.post("/send", (req: Request, res: Response) => {
  const { channel = "email", to, template, payload } = (req.body ?? {}) as SendBody;
  if (!to || !template) {
    return res.status(400).json({
      ok: false,
      error: "to and template are required",
    });
  }
  return res.status(202).json({
    ok: true,
    accepted: true,
    channel,
    to,
    template,
    payload: payload ?? {},
  });
});

export default router;
