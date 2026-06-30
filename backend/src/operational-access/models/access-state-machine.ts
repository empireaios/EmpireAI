import { z } from "zod";

/** OAR-002 — Canonical access state machine (Version 1). */
export const ACCESS_STATE_VALUES = [
  "NOT_CONNECTED",
  "AUTH_REQUIRED",
  "CONNECTED",
  "VERIFIED",
  "READY",
  "ACTIVE",
  "DEGRADED",
  "REVOKED",
  "BLOCKED",
] as const;

export type AccessState = (typeof ACCESS_STATE_VALUES)[number];

export const accessStateTransitionSchema = z.object({
  from: z.enum(ACCESS_STATE_VALUES),
  to: z.enum(ACCESS_STATE_VALUES),
  requiresHumanApproval: z.boolean().optional(),
  description: z.string(),
});

export type AccessStateTransition = z.infer<typeof accessStateTransitionSchema>;

export const ACCESS_STATE_TRANSITIONS: AccessStateTransition[] = [
  { from: "NOT_CONNECTED", to: "AUTH_REQUIRED", description: "Platform discovered; credentials or OAuth required" },
  { from: "AUTH_REQUIRED", to: "CONNECTED", description: "Credentials stored in vault; connection established" },
  { from: "CONNECTED", to: "VERIFIED", description: "Connector validation passed; permissions confirmed" },
  { from: "VERIFIED", to: "READY", description: "Capability matrix satisfied; automation eligible" },
  { from: "READY", to: "ACTIVE", description: "Founder approved activate_runtime; live automation enabled" },
  { from: "ACTIVE", to: "DEGRADED", description: "Health failure or partial permission loss" },
  { from: "DEGRADED", to: "VERIFIED", description: "Recovery after re-validation" },
  { from: "CONNECTED", to: "BLOCKED", description: "Governance or missing approval blocks access" },
  { from: "READY", to: "BLOCKED", description: "Founder approval revoked or policy block" },
  { from: "NOT_CONNECTED", to: "BLOCKED", description: "Architecture-only until credentials available" },
  { from: "ACTIVE", to: "REVOKED", description: "Credentials revoked or account terminated" },
  { from: "REVOKED", to: "NOT_CONNECTED", description: "Re-authorization required" },
];

/** Map Reality Integration / Live Commerce lifecycle to OAR-002 states. */
export function mapToAccessState(input: {
  lifecycle: string | null | undefined;
  blocked: boolean;
  hasCredentials: boolean;
}): AccessState {
  if (input.blocked && !input.hasCredentials) return "BLOCKED";
  if (!input.lifecycle || input.lifecycle === "NOT_CONNECTED" || input.lifecycle === "DISCOVERED") {
    return input.hasCredentials ? "CONNECTED" : "NOT_CONNECTED";
  }
  if (input.lifecycle === "AUTHORIZATION_REQUIRED" || input.lifecycle === "CREDENTIALS_REQUIRED") {
    return "AUTH_REQUIRED";
  }
  if (input.lifecycle === "DISCONNECTED") return "NOT_CONNECTED";
  if (input.lifecycle === "REVOKED") return "REVOKED";
  if (input.lifecycle === "DEGRADED" || input.lifecycle === "ERROR") return "DEGRADED";
  if (input.lifecycle === "ACTIVE") return input.blocked ? "BLOCKED" : "ACTIVE";
  if (input.lifecycle === "READY") return input.blocked ? "BLOCKED" : "READY";
  if (input.lifecycle === "VERIFIED") return input.blocked ? "BLOCKED" : "VERIFIED";
  if (input.lifecycle === "CONNECTED") return input.blocked ? "BLOCKED" : "CONNECTED";
  if (input.blocked) return "BLOCKED";
  return "NOT_CONNECTED";
}

export function isOperationalAccessState(state: AccessState): boolean {
  return state === "VERIFIED" || state === "READY" || state === "ACTIVE";
}
