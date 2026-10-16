/**
 * Structured JSON logger for services. Use for consistent log format and correlation.
 */
export function createLogger(service: string) {
  const base = (level: string) => (msg: string, meta?: Record<string, unknown>) => {
    const payload = {
      level,
      service,
      msg,
      ts: new Date().toISOString(),
      ...meta,
    };
    console.log(JSON.stringify(payload));
  };
  return {
    info: base("info"),
    warn: base("warn"),
    error: (msg: string, err?: Error | unknown, meta?: Record<string, unknown>) => {
      const payload: Record<string, unknown> = {
        level: "error",
        service,
        msg,
        ts: new Date().toISOString(),
        ...meta,
      };
      if (err instanceof Error) {
        payload.error = err.message;
        if (err.stack) payload.stack = err.stack;
      } else if (err !== undefined) payload.error = String(err);
      console.error(JSON.stringify(payload));
    },
    debug: base("debug"),
  };
}
