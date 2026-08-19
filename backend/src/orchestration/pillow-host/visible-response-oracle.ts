/**
 * Shared visible-surface certification oracle (backend mirror of empireai-web).
 * Grades Grand-King-visible text — not raw HTTP/API alone.
 */
export type VisibleOracleInput = {
  httpStatus: number;
  apiMessage: string;
  kind?: string | null;
  alreadyVisible?: boolean;
  require?: RegExp[];
  forbid?: RegExp[];
  minChars?: number;
  minSections?: number;
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

const FORBIDDEN_LIFECYCLE = [
  /deliberation may still be catching up/i,
  /full deliberation may still/i,
  /do not need to resubmit/i,
  /i will not ask you to resubmit/i,
  /you do not need to send it again/i,
  /verified operating state now/i,
  /can answer from verified operating state/i,
  /continuing from this (?:same )?request/i,
  /no need to resend/i,
  /bringing Executive Intelligence fully online/i,
];

const INFRA_LEAK = [
  /constitutional gate/i,
  /brain assistant fallback/i,
  /digital soul unavailable/i,
  /worker proxy timed out/i,
  /executive pipeline unavailable/i,
];

export const EXECUTIVE_TERMINAL =
  "I accepted your request, but a completed executive answer was not produced within the infrastructure budget. This is a temporary system limit — not a judgment on your ask. The system retains ownership of this accepted request for internal recovery.";

function hasForbiddenLifecycle(text: string): boolean {
  return FORBIDDEN_LIFECYCLE.some((r) => r.test(text));
}

export function isTerminalInfrastructureSurface(text: string): boolean {
  const t = String(text ?? "");
  if (!t.trim()) return true;
  if (/completed executive answer was not produced/i.test(t)) return true;
  if (/deep reasoning path could not finish after bounded recovery/i.test(t)) return true;
  if (/temporary (?:system|infrastructure) limit/i.test(t) && /not (?:a judgment|a question about your task)/i.test(t)) {
    return true;
  }
  return false;
}

export function toVisibleGrandKingText(apiMessage: string): string {
  const text = String(apiMessage ?? "").trim();
  if (!text) return EXECUTIVE_TERMINAL;
  if (hasForbiddenLifecycle(text)) return EXECUTIVE_TERMINAL;
  if (/ask again|please send the same ask|try again later|resubmit/i.test(text)) {
    return EXECUTIVE_TERMINAL;
  }
  if (isTerminalInfrastructureSurface(text)) {
    // Normalize legacy terminal variants to the Repair-2 surface.
    return EXECUTIVE_TERMINAL;
  }
  if (INFRA_LEAK.some((r) => r.test(text))) {
    const stripped = text
      .split(/(?<=[.!?])\s+|\n+/)
      .map((s) => s.trim())
      .filter((s) => s && !INFRA_LEAK.some((r) => r.test(s)))
      .join("\n")
      .trim();
    if (stripped.length >= 80) return stripped;
    return EXECUTIVE_TERMINAL;
  }
  return text;
}

const GOV = /sit behind Grand King approval|constitutional limits — I will not bypass/i;
const LIVE = /\b(?:Mini Fan|Brief verified note|realised revenue remain zero)\b/i;
const DELEGATION = /###\s*Delegation reading/i;
const CLONE_VERDICT = /(\*\*Verdict:\*\*\s*Unsupported as realised result[\s\S]{0,220}){3,}/i;

export function gradeVisibleExecutiveResponse(input: VisibleOracleInput): VisibleOracleResult {
  const failed: VisibleOracleDimension[] = [];
  const reasons: string[] = [];
  const visible = input.alreadyVisible
    ? String(input.apiMessage ?? "").trim()
    : toVisibleGrandKingText(input.apiMessage);

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
    visible === EXECUTIVE_TERMINAL;

  if (terminal) {
    failed.push("FIRST_REQUEST_COMPLETED");
    failed.push("USEFUL_SEMANTIC_ANSWER");
    reasons.push("terminal_infrastructure_surface");
  }
  if (hasForbiddenLifecycle(visible)) {
    failed.push("NO_FORBIDDEN_FALLBACK");
    failed.push("NO_RECOVERY_RESIDUE");
    reasons.push("forbidden_lifecycle_residue");
  }

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
  if (input.require?.length) {
    for (const r of input.require) {
      if (!r.test(visible)) {
        failed.push("USEFUL_SEMANTIC_ANSWER");
        failed.push("NO_MATERIAL_TASK_OMISSION");
        reasons.push(`missing:${r}`);
      }
    }
  }
  if (input.firstTurnVisible != null) {
    const first = gradeVisibleExecutiveResponse({
      ...input,
      apiMessage: input.firstTurnVisible,
      alreadyVisible: true,
      firstTurnVisible: null,
    });
    if (!first.ok) {
      failed.push("FIRST_REQUEST_COMPLETED");
      reasons.push("second_turn_cannot_rescue_first_turn");
    }
  }

  const uniqFailed = [...new Set(failed)];
  return { ok: uniqFailed.length === 0, visible, failed: uniqFailed, reasons: [...new Set(reasons)] };
}

export const NEGATIVE_CONTROL_FIXTURES: Array<{ id: string; input: VisibleOracleInput }> = [
  {
    id: "degraded_soft_fallback",
    input: {
      httpStatus: 200,
      alreadyVisible: true,
      apiMessage:
        "I received your executive request and can answer from verified operating state now. Full deliberation may still be catching up on part of the ask; I will not ask you to resubmit.",
      require: [/forecast/i],
    },
  },
  {
    id: "recovery_residue",
    input: {
      httpStatus: 200,
      alreadyVisible: true,
      apiMessage: "### Forecast\nEstimate.\nI will continue from this same request — you do not need to send it again.",
      require: [/forecast/i],
    },
  },
  { id: "empty_response", input: { httpStatus: 200, apiMessage: "", require: [/forecast/i] } },
  {
    id: "partial_multipart",
    input: {
      httpStatus: 200,
      alreadyVisible: true,
      apiMessage: "### 1) Forecast\nEstimate only.\n",
      require: [/forecast/i, /identity/i],
      minSections: 6,
    },
  },
  {
    id: "duplicate_sections",
    input: {
      httpStatus: 200,
      alreadyVisible: true,
      apiMessage: [
        "### A\n**Verdict:** Unsupported as realised result\nx",
        "### B\n**Verdict:** Unsupported as realised result\nx",
        "### C\n**Verdict:** Unsupported as realised result\nx",
        "### D\n**Verdict:** Unsupported as realised result\nx",
      ].join("\n"),
      require: [/forecast/i],
    },
  },
  {
    id: "authority_contamination",
    input: {
      httpStatus: 200,
      alreadyVisible: true,
      apiMessage: "### Forecast\nEstimate.\n### Delegation reading\nSit behind Grand King approval.",
      require: [/forecast/i],
    },
  },
  {
    id: "synthetic_live_contamination",
    input: {
      httpStatus: 200,
      alreadyVisible: true,
      apiMessage: "### Forecast\nEstimate.\nMini Fan realised revenue remain zero.",
      require: [/forecast/i],
    },
  },
  {
    id: "http_200_useless",
    input: { httpStatus: 200, alreadyVisible: true, apiMessage: "Okay.", require: [/forecast/i] },
  },
  {
    id: "late_second_only",
    input: {
      httpStatus: 200,
      alreadyVisible: true,
      apiMessage: "### Forecast\n$4200 is an estimate.\n### Identity\nunproven\n### Supersession\nlater ledger",
      require: [/forecast|estimate/i],
      firstTurnVisible:
        "I received your executive request and can answer from verified operating state now. Full deliberation may still be catching up.",
    },
  },
  {
    id: "bff_degraded",
    input: {
      httpStatus: 200,
      kind: "terminal_infrastructure",
      apiMessage: EXECUTIVE_TERMINAL,
      require: [/forecast/i],
    },
  },
];
