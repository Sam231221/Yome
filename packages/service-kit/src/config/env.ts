/**
 * Throws if the environment variable is missing. Use for required config at startup.
 */
export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function toPort(value: string | undefined, fallback: number): number {
  const port = Number(value ?? fallback);
  return Number.isFinite(port) ? port : fallback;
}

export const servicePorts = {
  get gateway() {
    return toPort(process.env.GATEWAY_PORT, 4100);
  },
  /** Renamed from `auth` in B05. Reads `IDENTITY_SERVICE_PORT` (was `AUTH_SERVICE_PORT`). */
  get identity() {
    return toPort(process.env.IDENTITY_SERVICE_PORT, 4101);
  },
  get chat() {
    return toPort(process.env.CHAT_SERVICE_PORT, 4103);
  },
  get media() {
    return toPort(process.env.MEDIA_SERVICE_PORT, 4104);
  },
  get notifications() {
    return toPort(process.env.NOTIFICATIONS_SERVICE_PORT, 4105);
  },
  /** The consolidated service introduced in B06 (community, then learning + resources in
   * B07, then dashboard in B08 — services/user no longer exists). */
  get core() {
    return toPort(process.env.CORE_SERVICE_PORT, 4107);
  },
} as const;
