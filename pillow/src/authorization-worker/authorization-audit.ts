import { getAuthorizationLogEvents, logAuthorizationEvent } from "./azw-logging.js";
import type { AuthorizationDecision } from "./types.js";
export class AuthorizationAudit {
  recordDecision(decision: AuthorizationDecision) { return logAuthorizationEvent("authorization_decision", decision.principalId, decision.decision, `${decision.resource}:${decision.action}; ${decision.reason}`); }
  record(type: string, principalId: string | null, details: string) { return logAuthorizationEvent(type, principalId, "info", details); }
  list(limit = 100) { return getAuthorizationLogEvents(limit); }
}
