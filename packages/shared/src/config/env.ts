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

export const servicePorts = {
  gateway: Number(process.env.GATEWAY_PORT || 4100),
  auth: Number(process.env.AUTH_SERVICE_PORT || 4101),
  chat: Number(process.env.CHAT_SERVICE_PORT || 4103),
  media: Number(process.env.MEDIA_SERVICE_PORT || 4104),
  notifications: Number(process.env.NOTIFICATIONS_SERVICE_PORT || 4105),
} as const;
