import { z } from "zod";

/** REAL-002 — Universal connection lifecycle for every connector. */
export const CONNECTION_LIFECYCLE_STATES = [
  "DISCOVERED",
  "CONFIGURED",
  "CREDENTIALS_REQUIRED",
  "AUTHORIZATION_REQUIRED",
  "CONNECTED",
  "VERIFIED",
  "READY",
  "ACTIVE",
  "DEGRADED",
  "DISCONNECTED",
  "REVOKED",
  "ERROR",
] as const;

export type ConnectionLifecycleState = (typeof CONNECTION_LIFECYCLE_STATES)[number];

export const connectionLifecycleTransitionSchema = z.object({
  from: z.enum(CONNECTION_LIFECYCLE_STATES),
  to: z.enum(CONNECTION_LIFECYCLE_STATES),
  trigger: z.string(),
  requiresHumanApproval: z.boolean().default(false),
});

export type ConnectionLifecycleTransition = z.infer<typeof connectionLifecycleTransitionSchema>;

export const CONNECTION_LIFECYCLE_TRANSITIONS: ConnectionLifecycleTransition[] = [
  { from: "DISCOVERED", to: "CONFIGURED", trigger: "provider_selected", requiresHumanApproval: false },
  { from: "CONFIGURED", to: "CREDENTIALS_REQUIRED", trigger: "setup_initiated", requiresHumanApproval: false },
  { from: "CREDENTIALS_REQUIRED", to: "AUTHORIZATION_REQUIRED", trigger: "oauth_flow_started", requiresHumanApproval: true },
  { from: "CREDENTIALS_REQUIRED", to: "CONNECTED", trigger: "api_key_stored", requiresHumanApproval: false },
  { from: "AUTHORIZATION_REQUIRED", to: "CONNECTED", trigger: "oauth_token_received", requiresHumanApproval: false },
  { from: "CONNECTED", to: "VERIFIED", trigger: "validation_passed", requiresHumanApproval: false },
  { from: "VERIFIED", to: "READY", trigger: "readiness_confirmed", requiresHumanApproval: false },
  { from: "READY", to: "ACTIVE", trigger: "production_enabled", requiresHumanApproval: true },
  { from: "ACTIVE", to: "DEGRADED", trigger: "health_degraded", requiresHumanApproval: false },
  { from: "DEGRADED", to: "ACTIVE", trigger: "health_restored", requiresHumanApproval: false },
  { from: "CONNECTED", to: "ERROR", trigger: "validation_failed", requiresHumanApproval: false },
  { from: "ACTIVE", to: "DISCONNECTED", trigger: "user_disconnect", requiresHumanApproval: true },
  { from: "CONNECTED", to: "DISCONNECTED", trigger: "user_disconnect", requiresHumanApproval: true },
  { from: "DISCONNECTED", to: "REVOKED", trigger: "credentials_revoked", requiresHumanApproval: false },
  { from: "ERROR", to: "CREDENTIALS_REQUIRED", trigger: "reconnect_attempt", requiresHumanApproval: false },
];

export function isTerminalLifecycleState(state: ConnectionLifecycleState): boolean {
  return state === "DISCONNECTED" || state === "REVOKED";
}

export function isOperationalLifecycleState(state: ConnectionLifecycleState): boolean {
  return state === "VERIFIED" || state === "READY" || state === "ACTIVE";
}

export function mapLifecycleToHealthState(
  lifecycle: ConnectionLifecycleState,
): "HEALTHY" | "WARNING" | "FAILED" | "DISABLED" {
  switch (lifecycle) {
    case "VERIFIED":
    case "READY":
    case "ACTIVE":
    case "CONNECTED":
      return "HEALTHY";
    case "DEGRADED":
    case "CONFIGURED":
    case "CREDENTIALS_REQUIRED":
    case "AUTHORIZATION_REQUIRED":
      return "WARNING";
    case "ERROR":
      return "FAILED";
    case "DISCOVERED":
    case "DISCONNECTED":
    case "REVOKED":
    default:
      return "DISABLED";
  }
}

export function initialLifecycleForAuth(authentication: string): ConnectionLifecycleState {
  if (authentication === "oauth2" || authentication === "oauth2_refresh") {
    return "AUTHORIZATION_REQUIRED";
  }
  return "CREDENTIALS_REQUIRED";
}
