/**
 * Permitted / prohibited action kinds for a Shadow CEO request.
 * Prohibited work is rejected before it becomes an episode record.
 */

export type ShadowCeoActionKind =
  | "synthetic_candidate_evaluation"
  | "fulfilment_monitor"
  | "supplier_spending"
  | "approval_request"
  | "product_listing"
  | "purchase"
  | "advertisement"
  | "supplier_contact"
  | "order"
  | "payment"
  | "profit_experiment"
  | "financial_ledger"
  | "vertical_slice_demo"
  | "other";

export const ALL_PROHIBITED_BY_DEFAULT: ShadowCeoActionKind[] = [
  "fulfilment_monitor",
  "supplier_spending",
  "approval_request",
  "product_listing",
  "purchase",
  "advertisement",
  "supplier_contact",
  "order",
  "payment",
  "profit_experiment",
  "financial_ledger",
  "vertical_slice_demo",
  "other",
];

export const CANDIDATE_EVAL_ONLY: ShadowCeoActionKind[] = [
  "synthetic_candidate_evaluation",
];

const TITLE_KIND_MAP: Array<{ re: RegExp; kind: ShadowCeoActionKind }> = [
  { re: /fulfil?l?ment\s+monitor/i, kind: "fulfilment_monitor" },
  { re: /supplier\s+spend/i, kind: "supplier_spending" },
  { re: /approval\s+request|spend\s+request/i, kind: "approval_request" },
  { re: /\blisting\b/i, kind: "product_listing" },
  { re: /\bpurchase\b|\bbuy\b/i, kind: "purchase" },
  { re: /\bads?\b|\badvertis/i, kind: "advertisement" },
  { re: /supplier\s+contact/i, kind: "supplier_contact" },
  { re: /\border\b/i, kind: "order" },
  { re: /\bpayment\b/i, kind: "payment" },
  { re: /profit\s+experiment|synthetic\s+profit/i, kind: "profit_experiment" },
  { re: /financial\s+ledger|ledger\s+movement/i, kind: "financial_ledger" },
  { re: /vertical\s+slice|demo\s+catalog/i, kind: "vertical_slice_demo" },
  {
    re: /candidate\s+evaluation|synthetic\s+candidate/i,
    kind: "synthetic_candidate_evaluation",
  },
];

export function classifyActionFromTitle(title: string): ShadowCeoActionKind {
  const t = String(title || "");
  for (const row of TITLE_KIND_MAP) {
    if (row.re.test(t)) return row.kind;
  }
  return "other";
}

export type ActionPermitDecision =
  | { allowed: true; kind: ShadowCeoActionKind }
  | { allowed: false; kind: ShadowCeoActionKind; reason: string };

export function assertActionPermitted(
  kind: ShadowCeoActionKind,
  permitted: ShadowCeoActionKind[],
  prohibited: ShadowCeoActionKind[],
  stage: "task_create" | "approve" | "execute" | "financial",
): ActionPermitDecision {
  if (prohibited.includes(kind) || !permitted.includes(kind)) {
    return {
      allowed: false,
      kind,
      reason: `ACTION_REJECTED_BEFORE_EPISODE at ${stage}: ${kind} is not permitted for this request`,
    };
  }
  if (stage === "financial" && kind !== "synthetic_candidate_evaluation") {
    return {
      allowed: false,
      kind,
      reason: `ACTION_REJECTED_BEFORE_EPISODE at financial: diagnostic evaluation forbids ledger movement`,
    };
  }
  return { allowed: true, kind };
}

export function parsePermittedActionsFromMessage(message: string): {
  permitted: ShadowCeoActionKind[];
  prohibited: ShadowCeoActionKind[];
} {
  const t = String(message || "");
  const onlyEval =
    /\b(?:only\s+)?(?:permitted\s+action|one\s+permitted\s+action)\s*[:=]?\s*synthetic\s+candidate\s+evaluation\b/i.test(
      t,
    ) ||
    /\bsynthetic\s+candidate\s+evaluation\s+only\b/i.test(t) ||
    /\bperform\s+only\s+one\s+synthetic\s+candidate\s+evaluation\b/i.test(t) ||
    (/\bcandidate\s+evaluation\b/i.test(t) &&
      /\b(?:only|sole|single)\b/i.test(t) &&
      /\b(?:permitted|allowed|must\s+not|do\s+not)\b/i.test(t));

  if (onlyEval || isSuppliedCandidateEvaluationAsk(t)) {
    return {
      permitted: [...CANDIDATE_EVAL_ONLY],
      prohibited: ALL_PROHIBITED_BY_DEFAULT.filter(
        (k) => k !== "synthetic_candidate_evaluation",
      ),
    };
  }

  // Default chat: no automatic demo / spend / ledger.
  return {
    permitted: [...CANDIDATE_EVAL_ONLY],
    prohibited: ALL_PROHIBITED_BY_DEFAULT.filter(
      (k) => k !== "synthetic_candidate_evaluation",
    ),
  };
}

export function isSuppliedCandidateEvaluationAsk(message: string): boolean {
  const t = String(message || "");
  const hasCandidates =
    /\b(?:candidates?|suppliers?|options?)\b/i.test(t) ||
    /:\s*\n\s*[-*]?\s*contribution\b/i.test(t);
  const hasRules =
    /\beligib(?:le|ility)\b/i.test(t) ||
    /\b(?:at\s+least|no\s+more\s+than|>=|<=)\b/i.test(t);
  const hasSelect =
    /\b(?:select|eligible\s+candidates?|candidate\s+selected)\b/i.test(t);
  return hasCandidates && hasRules && (hasSelect || /\bapproval\b/i.test(t));
}
