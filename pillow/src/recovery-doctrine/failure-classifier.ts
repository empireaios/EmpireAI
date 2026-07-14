import type { RecoveryIssueKind, RecoveryTrigger } from "../recovery/types.js";
import type { StallSignal } from "../supervisor/types.js";
import type { FailureClassification } from "./types.js";

export function classifyFailure(input: {
  trigger: RecoveryTrigger;
  issueKind?: RecoveryIssueKind;
  stallSignals?: StallSignal[];
  repositoryIntegrityOk?: boolean;
  recoveryAttempts?: number;
}): FailureClassification {
  const { trigger, issueKind, stallSignals = [], repositoryIntegrityOk = true, recoveryAttempts = 0 } =
    input;

  if (!repositoryIntegrityOk) return "repository";
  if (recoveryAttempts >= 3) return "human_approval_required";

  const stallText = stallSignals.map((s) => s.message).join(" ").toLowerCase();

  if (/production|railway|vercel|deploy/i.test(stallText)) return "production";
  if (/dependency|blocked by|prerequisite/i.test(stallText)) return "dependency";
  if (/architecture|structural|doctrine/i.test(stallText)) return "architecture";
  if (/config|env|credential/i.test(stallText)) return "configuration";
  if (/infrastructure|network|timeout|provider/i.test(stallText)) return "infrastructure";
  if (/external|api|third.?party/i.test(stallText)) return "external_service";

  switch (trigger) {
    case "repository_interruption":
      return "repository";
    case "interrupted_validation":
    case "interrupted_executive_audit":
      return issueKind === "validation" ? "engineering" : "engineering";
    case "detached_background_process":
    case "dead_agent":
    case "stalled_mission":
    case "unexpected_cursor_termination":
      return "transient";
    case "lost_mission_state":
      return "engineering";
    case "supervisor_invocation":
      return "unknown";
    default:
      return issueKind === "repository"
        ? "repository"
        : issueKind === "architecture"
          ? "architecture"
          : "transient";
  }
}
