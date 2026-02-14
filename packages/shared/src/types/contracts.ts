export type ServiceName =
  | "gateway"
  | "auth"
  | "chat"
  | "media"
  | "notifications";

export type HealthResponse = {
  ok: boolean;
  service: ServiceName;
};

export type ErrorEnvelope = {
  ok: false;
  error: string;
  details?: string;
  requestId?: string;
};
