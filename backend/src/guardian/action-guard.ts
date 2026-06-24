import type { AuthorityLevel } from "../brain/types.js";
import type { DatabaseGuardian } from "./database-guardian.js";
import type { GuardianAssessmentContext, GuardianVerdict } from "./types.js";

const DESTRUCTIVE_PAYLOAD_KEYS = ["drop", "truncate", "deleteAll", "wipe"];
const HIGH_RISK_ACTIONS = new Set([
  "manufacture",
  "optimize",
  "build",
  "resolve",
  "health",
]);
/** Module view loads (e.g. dashboard:load) are L0 read-only tools — no domain writes. */
const READ_ONLY_ACTIONS = new Set(["load"]);
/** Founder explicitly signing off on a pending decision — payload founderApproved is implicit. */
const FOUNDER_SIGNATURE_ACTIONS = new Set(["approve", "approve_all"]);

export class ActionGuard {
  constructor(private readonly dbGuardian: DatabaseGuardian) {}

  assess(context: GuardianAssessmentContext): GuardianVerdict {
    if (!context.workspaceId?.trim()) {
      return blocked("EMPTY_WORKSPACE", "Workspace ID is required for Brain dispatch");
    }

    if (!READ_ONLY_ACTIONS.has(context.action)) {
      try {
        this.dbGuardian.assertSafeForWrite(`dispatch:${context.module}:${context.action}`);
      } catch (error) {
        return blocked(
          "DATABASE_INTEGRITY",
          error instanceof Error ? error.message : "Database integrity check failed",
        );
      }
    }

    for (const key of DESTRUCTIVE_PAYLOAD_KEYS) {
      if (key in context.payload) {
        return blocked(
          "DESTRUCTIVE_PAYLOAD",
          `Payload contains blocked key: ${key}`,
        );
      }
    }

    const authority = context.toolAuthorityLevel as AuthorityLevel | undefined;
    if (authority === "L3" || authority === "L4") {
      const approved =
        Boolean(context.payload.founderApproved) ||
        FOUNDER_SIGNATURE_ACTIONS.has(context.action);
      if (!approved) {
        return blocked(
          "AUTHORITY_GATE",
          `${authority} action requires founderApproved in payload`,
        );
      }
    }

    if (HIGH_RISK_ACTIONS.has(context.action) && !context.payload.confirmed) {
      return blocked(
        "CONFIRMATION_REQUIRED",
        `Action '${context.action}' requires payload.confirmed=true`,
      );
    }

    return {
      allowed: true,
      reason: "Action passed Guardian safety checks",
      code: "ALLOWED",
    };
  }
}

function blocked(code: string, reason: string): GuardianVerdict {
  return { allowed: false, reason, code };
}
