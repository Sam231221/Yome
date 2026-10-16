const isDevelopment = process.env.NODE_ENV !== "production";

export function logBrowserWarning(message: string) {
  if (!isDevelopment) return;
  console.warn(message);
}
