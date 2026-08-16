/**
 * Executive request / task contract.
 *
 * Structured obligations derived from Grand King's message that must survive
 * truth/epistemic/decision release. Prevents safe-summary collapse from
 * silently dropping requested work.
 *
 * Does NOT encode sealed examination prompts or expected answers.
 */

import type { ExecutiveTruthSnapshot } from "./executive-truth-types.js";

export type ExecutiveTaskKind =
  | "operating_briefing"
  | "premise_audit"
  | "temporal_reconciliation"
  | "recommendation"
  | "evidence_explanation"
  | "inference"
  | "uncertainty"
  | "multipart_unit"
  | "general";

export type ExecutiveTaskUnit = {
  id: string;
  kind: ExecutiveTaskKind;
  text: string;
  required: boolean;
};

export type ExecutiveTaskContract = {
  requestIntent: string;
  tasks: ExecutiveTaskUnit[];
  requiresRecommendation: boolean;
  requiresEvidenceExplanation: boolean;
  requiresPremiseAudit: boolean;
  requiresTemporalReconciliation: boolean;
  multipart: boolean;
};

export type TaskCoverageStatus =
  | "completed"
  | "partial"
  | "unavailable"
  | "silent_drop";

export type TaskCoverageReport = {
  requiredTasks: number;
  completedTasks: number;
  partialTasks: number;
  unavailableTasks: number;
  silentlyDroppedTasks: number;
  byTask: Array<{
    id: string;
    kind: ExecutiveTaskKind;
    status: TaskCoverageStatus;
    reason?: string;
  }>;
};

const STOP = new Set([
  "the",
  "and",
  "for",
  "that",
  "with",
  "this",
  "from",
  "your",
  "what",
  "when",
  "where",
  "which",
  "into",
  "about",
  "have",
  "does",
  "should",
  "would",
  "could",
  "please",
  "briefly",
  "each",
  "them",
  "their",
  "then",
  "than",
  "only",
  "also",
  "just",
  "very",
  "into",
  "over",
  "under",
  "after",
  "before",
  "among",
  "across",
]);

function significantTokens(text: string): string[] {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 4 && !STOP.has(t))
    .slice(0, 24);
}

function splitMultipartUnits(message: string): string[] {
  const text = String(message || "").trim();
  if (!text) return [];
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const numbered: string[] = [];
  for (const line of lines) {
    const m = line.match(/^(?:\d{1,2}[\).\:]|[A-H][\).\:]|Q\d{1,2}[\).\:]|Part\s+\d+[\).:]?)\s*(.+)$/i);
    if (m?.[1]) numbered.push(m[1].trim());
  }
  if (numbered.length >= 2) return numbered;
  const bullets: string[] = [];
  for (const line of lines) {
    const m = line.match(/^[-*•]\s+(\S.+)$/);
    if (m?.[1]) bullets.push(m[1].trim());
  }
  if (bullets.length >= 3) return bullets;
  return [];
}

function detectKindsInText(text: string): ExecutiveTaskKind[] {
  const m = text;
  const kinds: ExecutiveTaskKind[] = [];
  if (
    /\b(premise|assumption|assumptions|audit (?:each|these|the)|evaluate (?:each|whether)|classify (?:each|these)|supported|contradicted|unverif)/i.test(
      m,
    )
  ) {
    kinds.push("premise_audit");
  }
  if (
    /\b(temporal|reconcil|histor(?:y|ical)|yesterday|today|tomorrow|superseded|was true|now true|future (?:state|hypothetical)|how (?:does|do) (?:this|that|the conclusion) change)/i.test(
      m,
    )
  ) {
    kinds.push("temporal_reconciliation");
  }
  if (
    /\b(recommend|what should (?:we|i) do|next (?:step|move)|priorit|play to win|bounded (?:test|experiment)|defer)\b/i.test(
      m,
    )
  ) {
    kinds.push("recommendation");
  }
  if (
    /\b(how do you know|show (?:me )?the evidence|provenance|where did (?:that|this) come from|prove it|source for)\b/i.test(
      m,
    )
  ) {
    kinds.push("evidence_explanation");
  }
  if (
    /\b(infer|inference|hypothesis|what do you think|best assessment|separate inference)\b/i.test(m)
  ) {
    kinds.push("inference");
  }
  if (
    /\b(what (?:don'?t|do not) we know|uncertain|unknown|missing evidence|what would falsify)\b/i.test(
      m,
    )
  ) {
    kinds.push("uncertainty");
  }
  if (
    /\b(briefing|operating (?:posture|state)|where are we|current state|status|facts only)\b/i.test(
      m,
    )
  ) {
    kinds.push("operating_briefing");
  }
  return kinds;
}

/**
 * Parse Grand King message into an internal task contract.
 */
export function parseExecutiveTaskContract(userMessage: string | undefined): ExecutiveTaskContract {
  const text = String(userMessage || "").trim();
  const parts = splitMultipartUnits(text);
  const globalKinds = detectKindsInText(text);
  const tasks: ExecutiveTaskUnit[] = [];

  if (parts.length >= 2) {
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]!;
      const local = detectKindsInText(part);
      const kind =
        local[0] ??
        (globalKinds.includes("premise_audit")
          ? "premise_audit"
          : globalKinds.includes("temporal_reconciliation")
            ? "temporal_reconciliation"
            : "multipart_unit");
      tasks.push({
        id: `t${i + 1}`,
        kind,
        text: part.slice(0, 280),
        required: true,
      });
    }
  } else if (globalKinds.length > 0) {
    for (let i = 0; i < globalKinds.length; i++) {
      tasks.push({
        id: `t${i + 1}`,
        kind: globalKinds[i]!,
        text: text.slice(0, 280),
        required: true,
      });
    }
  } else {
    tasks.push({
      id: "t1",
      kind: "general",
      text: text.slice(0, 280) || "Respond to the executive request.",
      required: true,
    });
  }

  // Cross-cutting obligations even when multipart already listed units.
  const requiresRecommendation =
    globalKinds.includes("recommendation") ||
    /\b(recommend|what should (?:we|i) do|next (?:step|move))\b/i.test(text);
  const requiresEvidenceExplanation =
    globalKinds.includes("evidence_explanation") ||
    /\b(how do you know|provenance|show (?:me )?the evidence)\b/i.test(text);
  const requiresPremiseAudit =
    globalKinds.includes("premise_audit") ||
    /\b(premise|assumption)\b/i.test(text);
  const requiresTemporalReconciliation =
    globalKinds.includes("temporal_reconciliation") ||
    /\b(reconcil|histor(?:y|ical)|yesterday|tomorrow|superseded)\b/i.test(text);

  const ensureKind = (kind: ExecutiveTaskKind, label: string) => {
    if (tasks.some((t) => t.kind === kind)) return;
    tasks.push({
      id: `tx_${kind}`,
      kind,
      text: label,
      required: true,
    });
  };
  if (requiresRecommendation) ensureKind("recommendation", "Provide a recommendation or conditional next move.");
  if (requiresEvidenceExplanation)
    ensureKind("evidence_explanation", "Explain how you know / provenance for key claims.");
  if (requiresPremiseAudit && parts.length < 2)
    ensureKind("premise_audit", "Audit supplied premises individually.");
  if (requiresTemporalReconciliation && !tasks.some((t) => t.kind === "temporal_reconciliation"))
    ensureKind("temporal_reconciliation", "Reconcile historical, current, and future evidence.");

  const primary =
    globalKinds[0] ??
    (parts.length >= 2 ? "multipart_executive_request" : "general_executive_request");

  return {
    requestIntent: primary,
    tasks,
    requiresRecommendation,
    requiresEvidenceExplanation,
    requiresPremiseAudit,
    requiresTemporalReconciliation,
    multipart: parts.length >= 2,
  };
}

function kindSignals(kind: ExecutiveTaskKind): RegExp {
  switch (kind) {
    case "premise_audit":
      return /\b(premise|assumption|supported|contradict|unverified|stale|inferred|cannot (?:establish|verify)|not established)\b/i;
    case "temporal_reconciliation":
      return /\b(histor(?:y|ical)|current(?:ly)?|future|superseded|was (?:true|correct)|now (?:true|verified)|yesterday|today|tomorrow|reconcil|changes? (?:the|our) conclusion)\b/i;
    case "recommendation":
      return /\b(recommend|should|next (?:step|move)|verify first|bounded|defer|conditional|priorit)\b/i;
    case "evidence_explanation":
      return /\b(because|source|provenance|how I know|from (?:live|verified|commissioning)|I can stand on|don't (?:yet )?have|not retrieved)\b/i;
    case "inference":
      return /\b(infer|hypothesis|assessment|suspect|likely|unproven)\b/i;
    case "uncertainty":
      return /\b(unknown|unproven|missing|uncertain|not (?:yet )?(?:verified|established)|would (?:falsify|change))\b/i;
    case "operating_briefing":
      return /\b(live|product|orders?|revenue|birth|commerce|focus|posture|status)\b/i;
    case "multipart_unit":
    case "general":
    default:
      return /\b(live|product|orders?|birth|verified|unproven|recommend|because|premise|current|focus)\b/i;
  }
}

function tokenOverlapHit(taskText: string, answer: string): boolean {
  const tokens = significantTokens(taskText);
  if (tokens.length === 0) return false;
  const a = answer.toLowerCase();
  let hits = 0;
  for (const t of tokens) {
    if (a.includes(t)) hits += 1;
  }
  return hits >= Math.min(2, tokens.length);
}

/**
 * Deterministic coverage of the task contract against a draft answer.
 */
export function assessTaskCoverage(
  answer: string,
  contract: ExecutiveTaskContract,
): TaskCoverageReport {
  const text = String(answer || "");
  const byTask = contract.tasks.map((task) => {
    const signal = kindSignals(task.kind).test(text);
    const overlap =
      task.kind === "multipart_unit" || contract.multipart
        ? tokenOverlapHit(task.text, text)
        : false;
    // Unavailable must be local to the answer content — never use task.text signals
    // (that falsely classified global "I don't have…" as covering typed obligations).
    const localUnavailableMarked =
      /\b(cannot (?:establish|verify|complete)|unavailable for this part|open for this part|not address(?:ed)? (?:in|for) this (?:part|turn)|remain(?:s)? open)\b/i.test(
        text,
      ) && (signal || overlap);
    const globalDontHaveOnly =
      /\b(don'?t (?:yet )?have enough|not enough (?:solid )?evidence|cannot answer that confidently)\b/i.test(
        text,
      ) && !signal && !overlap;

    const multiMaterial =
      contract.tasks.length >= 2 ||
      contract.multipart ||
      contract.requiresPremiseAudit ||
      contract.requiresTemporalReconciliation ||
      contract.requiresRecommendation ||
      contract.requiresEvidenceExplanation;

    let status: TaskCoverageStatus;
    let reason: string | undefined;
    if (signal && (task.kind !== "multipart_unit" || overlap || contract.tasks.length <= 3)) {
      status = "completed";
    } else if (overlap && signal) {
      status = "completed";
    } else if (overlap || signal) {
      status = "partial";
      reason = "Partial topical coverage without full obligation signal.";
    } else if (localUnavailableMarked && !multiMaterial) {
      status = "unavailable";
      reason = "Explicitly marked unavailable.";
    } else if (globalDontHaveOnly && multiMaterial) {
      // Global UNKNOWN collapse must not terminate distinct material obligations.
      status = task.required ? "silent_drop" : "unavailable";
      reason = "Global evidence collapse does not cover this obligation.";
    } else if (localUnavailableMarked) {
      status = "unavailable";
      reason = "Explicitly marked unavailable for this part.";
    } else {
      status = task.required ? "silent_drop" : "unavailable";
      reason = task.required ? "Required task not addressed in released answer." : undefined;
    }
    return { id: task.id, kind: task.kind, status, reason };
  });

  // Multipart: if answer has numbered coverage matching many parts, lift silent drops.
  if (contract.multipart) {
    const numbered = (text.match(/(?:^|\n)\s*\d+\s*[\).:]/gm) || []).length;
    if (numbered >= Math.min(3, contract.tasks.filter((t) => t.kind === "multipart_unit").length)) {
      for (const row of byTask) {
        if (row.kind === "multipart_unit" && row.status === "silent_drop") {
          row.status = "partial";
          row.reason = "Numbered multi-part structure present.";
        }
      }
    }
  }

  const requiredTasks = byTask.length;
  const completedTasks = byTask.filter((t) => t.status === "completed").length;
  const partialTasks = byTask.filter((t) => t.status === "partial").length;
  const unavailableTasks = byTask.filter((t) => t.status === "unavailable").length;
  const silentlyDroppedTasks = byTask.filter((t) => t.status === "silent_drop").length;

  return {
    requiredTasks,
    completedTasks,
    partialTasks,
    unavailableTasks,
    silentlyDroppedTasks,
    byTask,
  };
}

function verifiedFactsBlock(truth: ExecutiveTruthSnapshot): {
  product: string;
  orders: number;
  revenue: number;
  live: boolean;
  birthNull: boolean;
} {
  return {
    product:
      truth.product.productName ??
      (truth.product.asin ? `bound product (${truth.product.asin})` : "our bound product"),
    orders: truth.financial.orders,
    revenue: truth.financial.realisedRevenueUsd,
    live:
      Boolean(truth.deploy.gitCommitSha) ||
      truth.deploy.serviceOnlineHint === "assume_online_if_answering",
    birthNull: truth.birth.birthTimestamp == null,
  };
}

/**
 * Natural per-task completion from verified state only — no invented evidence.
 */
export function synthesizeTaskUnitAnswer(
  task: ExecutiveTaskUnit,
  truth: ExecutiveTruthSnapshot,
): string {
  const f = verifiedFactsBlock(truth);
  const live = f.live
    ? "EmpireAI is live and answering in production."
    : "I'm answering through the active Brain process.";
  const commerce =
    f.orders === 0 && f.revenue === 0
      ? "Realised orders and realised revenue remain zero."
      : `Realised orders are ${f.orders}; realised revenue is about ${f.revenue} USD.`;

  switch (task.kind) {
    case "operating_briefing":
      return [
        live,
        `Current product focus is ${f.product}.`,
        commerce,
        f.birthNull ? "Birth has not been authorised." : "Birth timestamp is set in verified state.",
      ].join(" ");
    case "premise_audit": {
      return [
        "Premise audit:",
        `From verified state I can support focus on ${f.product} and ${commerce.toLowerCase()}`,
        f.birthNull ? "Birth remains unauthorised." : "",
        "Premises that assert realised sales volume, demand strength, or unverified market facts stay unestablished — I will not treat those as supported.",
      ]
        .filter(Boolean)
        .join(" ");
    }
    case "temporal_reconciliation":
      return [
        "Temporal read:",
        "Historically, earlier pre-launch waiting language may have been true at the time.",
        f.live
          ? "Currently verified: we are live and answering now — that supersedes older pre-launch waiting claims."
          : "Currently verified service state is limited to this process answer.",
        "Future or hypothetical states (projected sales, unrun experiments) remain unresolved until evidenced.",
        "Conclusions that depended on being offline should change; conclusions that depend on unrealised demand should not.",
      ].join(" ");
    case "recommendation":
      return [
        "Recommendation:",
        f.orders === 0
          ? `I recommend a verification-first next step on ${f.product}: confirm the open commercial unknowns with a bounded check before any irreversible spend.`
          : `I recommend deepening what is already working on ${f.product} with a bounded experiment before irreversible spend.`,
        f.birthNull ? "Birth remains a Grand King decision." : "",
      ]
        .filter(Boolean)
        .join(" ");
    case "evidence_explanation":
      return [
        "How I know:",
        "Product focus and realised commerce come from live commissioning and KPI state for this workspace.",
        live,
        "I did not retrieve external systems this turn — so claims that need those sources stay open.",
      ].join(" ");
    case "inference":
      return [
        `Inference (labeled, not established): commercial demand for ${f.product} is still unproven given ${commerce.toLowerCase()}`,
        "What would change that: realised sales traction or independently retrieved demand evidence.",
      ].join(" ");
    case "uncertainty":
      return [
        "Material unknowns: commercial demand strength and anything not present in verified commissioning/KPI state.",
        commerce,
      ].join(" ");
    case "multipart_unit":
    case "general":
    default:
      return [
        `For “${task.text.slice(0, 100)}${task.text.length > 100 ? "…" : ""}”:`,
        `from verified state — focus ${f.product}; ${commerce}`,
        "I will not invent unsupported specifics for this part, and I will not repeat unverified quantity claims as fact.",
      ].join(" ");
  }
}

/**
 * Append natural coverage for silently dropped required tasks.
 * Preserves existing safe content; does not replace the whole answer.
 */
export function appendMissingTaskCoverage(
  answer: string,
  contract: ExecutiveTaskContract,
  truth: ExecutiveTruthSnapshot,
): { message: string; appended: number; coverage: TaskCoverageReport } {
  let message = String(answer || "").trim();
  let coverage = assessTaskCoverage(message, contract);
  let appended = 0;

  for (const row of coverage.byTask) {
    if (row.status !== "silent_drop") continue;
    const task = contract.tasks.find((t) => t.id === row.id);
    if (!task) continue;
    const stub = synthesizeTaskUnitAnswer(task, truth);
    message = `${message}${message ? "\n\n" : ""}${stub}`.trim();
    appended += 1;
  }

  coverage = assessTaskCoverage(message, contract);
  // Any remaining silent drops → mark unavailable explicitly (still not silent).
  if (coverage.silentlyDroppedTasks > 0) {
    const leftovers = coverage.byTask.filter((t) => t.status === "silent_drop");
    for (const row of leftovers) {
      const task = contract.tasks.find((t) => t.id === row.id);
      if (!task) continue;
      message = `${message}\n\nFor “${task.text.slice(0, 80)}${task.text.length > 80 ? "…" : ""}”: I cannot complete that part from verified evidence this turn — it remains open rather than invented.`;
      appended += 1;
    }
    coverage = assessTaskCoverage(message, contract);
    // Force silent drops to unavailable after explicit mark.
    for (const row of coverage.byTask) {
      if (row.status === "silent_drop") {
        row.status = "unavailable";
        row.reason = "Explicitly marked unavailable after coverage pass.";
      }
    }
    coverage.silentlyDroppedTasks = coverage.byTask.filter((t) => t.status === "silent_drop").length;
    coverage.unavailableTasks = coverage.byTask.filter((t) => t.status === "unavailable").length;
  }

  return { message, appended, coverage };
}

/**
 * Contract-aware reconstruct: one natural block per required obligation.
 * Used when surgical repair cannot keep the draft — still not a single safe summary.
 */
export function buildContractAwareReconstruct(
  truth: ExecutiveTruthSnapshot,
  contract: ExecutiveTaskContract,
): string {
  const unique = new Map<string, ExecutiveTaskUnit>();
  for (const t of contract.tasks) {
    const key = `${t.kind}:${t.text.slice(0, 40)}`;
    if (!unique.has(key)) unique.set(key, t);
  }
  const units = [...unique.values()].slice(0, 20);
  if (units.length === 0) {
    return synthesizeTaskUnitAnswer(
      { id: "t1", kind: "operating_briefing", text: "briefing", required: true },
      truth,
    );
  }
  if (contract.multipart && units.length >= 2) {
    return units
      .map((t, i) => `${i + 1}) ${synthesizeTaskUnitAnswer(t, truth)}`)
      .join("\n");
  }
  return units.map((t) => synthesizeTaskUnitAnswer(t, truth)).join("\n\n");
}

/** Compact brief for LLM prompt assembly (no internal enum dump to GK). */
export function formatTaskContractBrief(contract: ExecutiveTaskContract): string {
  const lines = [
    "Executive task contract (complete every material ask; do not replace with a single safe summary):",
    `Intent: ${contract.requestIntent}`,
    `Tasks (${contract.tasks.length}):`,
    ...contract.tasks.map((t, i) => `${i + 1}. [${t.kind}] ${t.text}`),
    "If a part cannot be verified, say so for that part only and still complete the others.",
  ];
  return lines.join("\n");
}
