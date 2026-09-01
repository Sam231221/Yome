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
  get auth() {
    return toPort(process.env.AUTH_SERVICE_PORT, 4101);
  },
  get user() {
    return toPort(process.env.USER_SERVICE_PORT, 4102);
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
  get resources() {
    return toPort(process.env.RESOURCES_SERVICE_PORT, 4106);
  },
} as const;
