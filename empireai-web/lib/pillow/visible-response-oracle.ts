/**
 * Certification integrity — grade the Grand-King-visible surface, not raw API alone.
 * Repair 2: FIRST accepted request is authoritative; soft fallbacks cannot PASS.
 */
import {
  EXECUTIVE_TERMINAL_INFRASTRUCTURE_REPLY,
  hasForbiddenLifecycleResidue,
  isTerminalInfrastructureSurface,
  toExecutiveChatMessage,
} from "./executive-surface";

export type VisibleOracleInput = {
  httpStatus: number;
  /** Raw API / BFF message before surface sanitizer. */
  apiMessage: string;
  /** Optional explicit kind from BFF/backend. */
  kind?: string | null;
  /** When true, caller already applied frontend sanitizer. */
  alreadyVisible?: boolean;
  /** Required semantic signals (at least these many must match). */
  require?: RegExp[];
  /** Forbidden patterns beyond global residue rules. */
  forbid?: RegExp[];
  minChars?: number;
  minSections?: number;
  /** If set, second-turn text must not rescue a failed first turn. */
  firstTurnVisible?: string | null;
};

export type VisibleOracleDimension =
  | "HTTP_SUCCESS"
  | "FIRST_REQUEST_COMPLETED"
  | "USEFUL_SEMANTIC_ANSWER"
  | "REQUESTED_STRUCTURE_COMPLETED"
  | "NO_FORBIDDEN_FALLBACK"
  | "NO_RECOVERY_RESIDUE"
  | "NO_IRRELEVANT_GOVERNANCE"
  | "NO_SYNTHETIC_LIVE_CONTAMINATION"
  | "NO_MATERIAL_TASK_OMISSION"
  | "NO_DUPLICATE_TEMPLATE_COLLAPSE"
  | "FINAL_VISIBLE_RESPONSE_GRADED";

export type VisibleOracleResult = {
  ok: boolean;
  visible: string;
  failed: VisibleOracleDimension[];
  reasons: string[];
};

const GOV = /sit behind Grand King approval|constitutional limits — I will not bypass/i;
const LIVE = /\b(?:Mini Fan|Brief verified note|realised revenue remain zero)\b/i;
const DELEGATION = /###\s*Delegation reading/i;
const CLONE_VERDICT = /(\*\*Verdict:\*\*\s*Unsupported as realised result[\s\S]{0,220}){3,}/i;

export function toVisibleGrandKingText(apiMessage: string): string {
  return toExecutiveChatMessage(apiMessage, EXECUTIVE_TERMINAL_INFRASTRUCTURE_REPLY);
}

export function gradeVisibleExecutiveResponse(input: VisibleOracleInput): VisibleOracleResult {
  const failed: VisibleOracleDimension[] = [];
  const reasons: string[] = [];

  const visible = input.alreadyVisible
    ? String(input.apiMessage ?? "").trim()
    : toVisibleGrandKingText(input.apiMessage);

  // Always grade final visible surface.
  if (!visible) {
    failed.push("FINAL_VISIBLE_RESPONSE_GRADED");
    reasons.push("empty_visible");
  }

  if (!(input.httpStatus >= 200 && input.httpStatus < 300)) {
    failed.push("HTTP_SUCCESS");
    reasons.push(`http_${input.httpStatus}`);
  }

  const kind = String(input.kind ?? "");
  const terminal =
    kind === "terminal_infrastructure" ||
    isTerminalInfrastructureSurface(visible) ||
    visible === EXECUTIVE_TERMINAL_INFRASTRUCTURE_REPLY;

  if (terminal) {
    failed.push("FIRST_REQUEST_COMPLETED");
    failed.push("USEFUL_SEMANTIC_ANSWER");
    reasons.push("terminal_infrastructure_surface");
  }

  if (hasForbiddenLifecycleResidue(visible)) {
    failed.push("NO_FORBIDDEN_FALLBACK");
    failed.push("NO_RECOVERY_RESIDUE");
    reasons.push("forbidden_lifecycle_residue");
  }

  // HTTP 200 with useless prose / short fluff
  const minChars = input.minChars ?? 80;
  if (!terminal && visible.length < minChars) {
    failed.push("USEFUL_SEMANTIC_ANSWER");
    reasons.push(`too_short:${visible.length}`);
  }

  if (GOV.test(visible) || DELEGATION.test(visible)) {
    failed.push("NO_IRRELEVANT_GOVERNANCE");
    reasons.push("governance_contamination");
  }

  if (LIVE.test(visible)) {
    failed.push("NO_SYNTHETIC_LIVE_CONTAMINATION");
    reasons.push("live_commerce_contamination");
  }

  if (CLONE_VERDICT.test(visible)) {
    failed.push("NO_DUPLICATE_TEMPLATE_COLLAPSE");
    reasons.push("duplicate_template_collapse");
  }

  if (input.minSections) {
    const sections = (visible.match(/^#{1,3}\s+/gm) || []).length;
    if (sections < input.minSections) {
      failed.push("REQUESTED_STRUCTURE_COMPLETED");
      failed.push("NO_MATERIAL_TASK_OMISSION");
      reasons.push(`sections:${sections}<${input.minSections}`);
    }
  }

  for (const f of input.forbid ?? []) {
    if (f.test(visible)) {
      failed.push("NO_MATERIAL_TASK_OMISSION");
      reasons.push(`forbidden:${f}`);
    }
  }

  if (input.require && input.require.length > 0) {
    const missing = input.require.filter((r) => !r.test(visible));
    if (missing.length > 0) {
      failed.push("USEFUL_SEMANTIC_ANSWER");
      failed.push("NO_MATERIAL_TASK_OMISSION");
      for (const m of missing) reasons.push(`missing:${m}`);
    }
  }

  // Second turn cannot rescue first-turn certification.
  if (input.firstTurnVisible != null) {
    const firstGrade = gradeVisibleExecutiveResponse({
      ...input,
      apiMessage: input.firstTurnVisible,
      alreadyVisible: true,
      firstTurnVisible: null,
    });
    if (!firstGrade.ok) {
      failed.push("FIRST_REQUEST_COMPLETED");
      reasons.push("second_turn_cannot_rescue_first_turn");
    }
  }

  const uniqFailed = [...new Set(failed)];
  return {
    ok: uniqFailed.length === 0,
    visible,
    failed: uniqFailed,
    reasons: [...new Set(reasons)],
  };
}

/** Negative-control fixtures — every one must FAIL the oracle. */
export const NEGATIVE_CONTROL_FIXTURES: Array<{
  id: string;
  input: VisibleOracleInput;
}> = [
  {
    id: "degraded_soft_fallback",
    input: {
      httpStatus: 200,
      apiMessage:
        "I received your executive request and can answer from verified operating state now. Full deliberation may still be catching up on part of the ask; I will not ask you to resubmit, and I will keep claims bounded to what we can verify.",
      alreadyVisible: true,
      require: [/forecast|estimate/i],
    },
  },
  {
    id: "recovery_residue",
    input: {
      httpStatus: 200,
      apiMessage:
        "### Forecast\nEstimate only.\nI will continue from this same request — you do not need to send it again.",
      alreadyVisible: true,
      require: [/forecast|estimate/i],
    },
  },
  {
    id: "empty_response",
    input: { httpStatus: 200, apiMessage: "", require: [/forecast/i] },
  },
  {
    id: "partial_multipart",
    input: {
      httpStatus: 200,
      apiMessage: "### 1) Forecast\nEstimate only.\n",
      alreadyVisible: true,
      require: [/forecast/i, /identity/i, /supersed/i],
      minSections: 6,
    },
  },
  {
    id: "duplicate_sections",
    input: {
      httpStatus: 200,
      apiMessage: [
        "### A\n**Verdict:** Unsupported as realised result\nAn expected figure is not realised.",
        "### B\n**Verdict:** Unsupported as realised result\nAn expected figure is not realised.",
        "### C\n**Verdict:** Unsupported as realised result\nAn expected figure is not realised.",
        "### D\n**Verdict:** Unsupported as realised result\nAn expected figure is not realised.",
      ].join("\n"),
      alreadyVisible: true,
      require: [/forecast/i],
    },
  },
  {
    id: "authority_contamination",
    input: {
      httpStatus: 200,
      apiMessage:
        "### Forecast\nEstimate.\n### Delegation reading\nSit behind Grand King approval for spend.",
      alreadyVisible: true,
      require: [/forecast|estimate/i],
    },
  },
  {
    id: "synthetic_live_contamination",
    input: {
      httpStatus: 200,
      apiMessage: "### Forecast\nEstimate.\nMini Fan realised revenue remain zero. Brief verified note.",
      alreadyVisible: true,
      require: [/forecast|estimate/i],
    },
  },
  {
    id: "http_200_useless_prose",
    input: {
      httpStatus: 200,
      apiMessage: "Okay.",
      alreadyVisible: true,
      require: [/forecast|estimate/i],
    },
  },
  {
    id: "late_second_attempt_only",
    input: {
      httpStatus: 200,
      apiMessage:
        "### Forecast\n$4200 is an estimate.\n### Identity\nCo-occurrence is unproven.\n### Supersession\nLater ledger updates the realised line.",
      alreadyVisible: true,
      require: [/forecast|estimate/i, /identity|co-occurr/i, /supersed/i],
      firstTurnVisible:
        "I received your executive request and can answer from verified operating state now. Full deliberation may still be catching up.",
    },
  },
  {
    id: "bff_degraded_ask_again",
    input: {
      httpStatus: 200,
      kind: "terminal_infrastructure",
      apiMessage:
        "I accepted your request, but the deep reasoning path could not finish after bounded recovery. Please send the same ask once more in a moment.",
      require: [/forecast/i],
    },
  },
];
