/**
 * Authoritative multi-candidate decision case state.
 * ONE authority for: gates → eligibility → eligible set → recommendation.
 * Does not encode sealed examination content (Pioneer etc.).
 */
import type { DecisionGateStatus } from "./executive-decision-constraints.js";

export type CommercialGateId =
  | "cost_ceiling"
  | "margin_floor"
  | "delivery_sla"
  | "delivery_max_days"
  | "approval"
  | "stock"
  | "policy"
  | "quality"
  | "capacity"
  | "evidence"
  | "return_threshold"
  | "contribution_min"
  | "other";

export type CommercialGate = {
  id: CommercialGateId;
  label: string;
  status: DecisionGateStatus;
  /** Soft preference only — never overrides FAIL/UNKNOWN on hard gates. */
  soft?: boolean;
  raw?: string;
};

export type CandidateDecisionState = {
  candidateId: string;
  displayName: string;
  gates: CommercialGate[];
  failedGates: CommercialGate[];
  unknownGates: CommercialGate[];
  currentlyEligible: boolean;
  potentiallyAttractiveIfChanged: boolean;
  supportedMetric: number | null;
  evidenceNote: string | null;
};

export type DecisionObjective =
  | "select_sole_eligible"
  | "select_cheapest_eligible"
  | "select_highest_metric_eligible"
  | "select_none_unless_eligible"
  | "unresolved";

export type DecisionCaseState = {
  caseId: string;
  objective: DecisionObjective;
  tieBreak: string | null;
  mandatoryGateIds: CommercialGateId[];
  candidates: CandidateDecisionState[];
  eligibleSet: string[];
  /** Canonical current action — never invent per-section. */
  recommendation: {
    status: "SELECT" | "DO_NOT_SELECT" | "UNRESOLVED";
    selectedId: string | null;
    rationale: string;
  };
  reversalConditions: string[];
  decisionConfidence: "high" | "medium" | "low";
};

function key(s: string): string {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function parseMoney(raw: string): number | null {
  const m = String(raw || "").replace(/,/g, "").match(/(-?\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function parsePct(raw: string): number | null {
  const m = String(raw || "").match(/(\d+(?:\.\d+)?)\s*%/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

/** Explicit PASS/FAIL/PENDING tokens in a candidate line. */
function explicitStatus(fragment: string): DecisionGateStatus | null {
  if (/\bPENDING\b/i.test(fragment) && !/\b(?:granted|cleared|PASS)\b/i.test(fragment)) {
    return "FAIL"; // pending mandatory approval ≠ PASS
  }
  if (/\bFAIL(?:ED|S|URE)?\b/i.test(fragment)) return "FAIL";
  if (/\bPASS(?:ED|ES)?\b/i.test(fragment) || /\bgranted\b/i.test(fragment)) return "PASS";
  if (/\bUNKNOWN\b|\bmissing\b|\bunstated\b|\bnot\s+(?:yet\s+)?(?:known|established)\b/i.test(fragment)) {
    return "UNKNOWN";
  }
  return null;
}

export type ParsedRule = {
  costCeiling: number | null;
  costOp: "<=" | "<";
  deliveryFloor: number | null;
  deliveryOp: ">=" | ">";
  /** Max delivery days (e.g. delivery <= 6). */
  deliveryMaxDays: number | null;
  approvalRequired: boolean;
  marginFloor: number | null;
  /** Min contribution/score when supplied as a gate (e.g. contribution >= 10). */
  contributionMin: number | null;
  /** Min stock/inventory units (e.g. stock >= 900). */
  stockMin: number | null;
  objective: DecisionObjective;
};

export function parseDecisionRules(userMessage: string): ParsedRule {
  const t = String(userMessage || "");
  let costCeiling: number | null = null;
  let costOp: "<=" | "<" = "<=";
  const costM =
    /(?:cost|procurement\s+cost|expenditure|budget)\s*(?:ceiling|cap|limit)?\s*(?:<=|≤|<|no\s+more\s+than|at\s+most)\s*(?:S\$|SGD|\$)?\s*([\d,]+(?:\.\d+)?)/i.exec(
      t,
    );
  // Do NOT treat delivery/stock/contribution inequalities as cost ceilings.
  if (costM) costCeiling = parseMoney(costM[1]!);
  if (/\bcost\b[^.\n]{0,40}<\s*(?:S\$|\$)?\s*\d/i.test(t) && !/<=|≤|at\s+most|no\s+more/i.test(t)) {
    costOp = "<";
  }

  let deliveryFloor: number | null = null;
  let deliveryOp: ">=" | ">" = ">=";
  const delM =
    /(?:on[- ]?time\s+delivery|delivery(?:\s+SLA)?|OTD)\s*(?:>=|≥|>|at\s+least)\s*(\d+(?:\.\d+)?)\s*%/i.exec(
      t,
    );
  if (delM) deliveryFloor = Number(delM[1]);
  if (/\bdelivery\b[^.\n]{0,30}>\s*\d/i.test(t) && !/>=|≥|at\s+least/i.test(t)) deliveryOp = ">";

  let deliveryMaxDays: number | null = null;
  const delDays =
    /delivery(?:\s*days?)?\s*(?:<=|≤|at\s+most|no\s+more\s+than)\s*(\d+(?:\.\d+)?)/i.exec(t) ||
    /delivery(?:\s*days?)?\s*(?:<=|≤)\s*(\d+(?:\.\d+)?)/i.exec(t);
  if (delDays) deliveryMaxDays = Number(delDays[1]);

  const approvalRequired =
    /\b(?:NO\s+mandatory\s+(?:compliance\s+)?approval\s+pending|approval\s+(?:must\s+be\s+)?(?:granted|cleared)|no\s+pending\s+approval|mandatory\s+(?:compliance\s+)?approval|eligible\s+(?:only\s+)?if\s+approval\s+granted|approval\s+granted)\b/i.test(
      t,
    );

  let marginFloor: number | null = null;
  const marM = /(?:margin|contribution)\s*(?:floor|min(?:imum)?)?\s*(?:>=|≥|at\s+least)\s*(\d+(?:\.\d+)?)\s*%/i.exec(
    t,
  );
  if (marM) marginFloor = Number(marM[1]);

  let contributionMin: number | null = null;
  const cMin =
    /(?:contribution|margin|profit|score)\s*(?:>=|≥|at\s+least|min(?:imum)?)\s*(?:US\$|S\$|USD|SGD|\$)?\s*(-?\d+(?:\.\d+)?)/i.exec(
      t,
    );
  // Absolute floors (margin US$ / score) — not percentage margin floor.
  if (cMin && !/%/.test(cMin[0]!)) contributionMin = Number(cMin[1]);

  let stockMin: number | null = null;
  const sMin =
    /(?:stock|inventory)\s*(?:>=|≥|at\s+least|min(?:imum)?)\s*([\d,]+(?:\.\d+)?)/i.exec(t);
  if (sMin) stockMin = parseMoney(sMin[1]!);

  let objective: DecisionObjective = "select_sole_eligible";
  if (/\bcheapest\s+eligible\b|\blowest\s+(?:eligible\s+)?cost\b/i.test(t)) {
    objective = "select_cheapest_eligible";
  } else if (
    /\bhighest\s+(?:supported\s+)?(?:contribution|margin|profit|metric|score)\b|\bbest\s+eligible\b|\bhighest contribution\b/i.test(
      t,
    )
  ) {
    objective = "select_highest_metric_eligible";
  } else if (
    /\bif\s+exactly\s+one\s+eligible|\bselect\s+that\s+(?:supplier|candidate|option)\b|\bsole\s+eligible\b/i.test(
      t,
    )
  ) {
    objective = "select_sole_eligible";
  } else if (
    /\bno\s+selection\s+unless|\bdo\s+not\s+select\s+any\s+unless|\bunless\s+two\s+independent\b/i.test(t)
  ) {
    objective = "select_none_unless_eligible";
  } else if (!/\beligible\b|\bselect\b|\brecommend\b|\bchoose\b/i.test(t)) {
    objective = "unresolved";
  }

  return {
    costCeiling,
    costOp,
    deliveryFloor,
    deliveryOp,
    deliveryMaxDays,
    approvalRequired,
    marginFloor,
    contributionMin,
    stockMin,
    objective,
  };
}

const SKIP_CANDIDATE_NAMES =
  /^(?:ANSWER|AUDIT|RULE|NOTE|PACK|CLAIM|SECTION|SNAPSHOT|CLOSING|ALSO|THEN|GIVEN|ASSESS|SYNTHETIC|CONTINUE|NOW|ONLY|CURRENT|SUPPLIER|SUPPLIERS)$/i;

const COMMERCIAL_BODY =
  /\b(?:cost|delivery|approval|margin|stock|contribution|profit|score|policy|PASS|FAIL|PENDING|eligible|gate|inventory)\b/i;

/** Split same-line peers: `ALPHA: … BETA: …` or `Juniper: … Lotus: …` into blocks. */
function splitInlineNamedPeers(segment: string): Array<{ name: string; body: string }> {
  const line = String(segment || "");
  // Title Case + ALL-CAPS + lowercase supplier tags (forensic GK packs).
  const re = /\b([A-Za-z][A-Za-z0-9_-]{1,32})\s*:\s*/g;
  const hits: Array<{ name: string; bodyStart: number; index: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    const name = m[1]!;
    if (SKIP_CANDIDATE_NAMES.test(name)) continue;
    if (
      /^(?:Eligibility|Answer|Rules?|Gates?|Objective|Note|Pack|Claim|Section|Also|Then|Given|Assess|Architecture|Three|Choose|Available|Suppliers?|Bounded|Decision|Checkpoint|Only|Current)$/i.test(
        name,
      )
    ) {
      continue;
    }
    hits.push({ name, index: m.index, bodyStart: m.index + m[0].length });
  }
  if (hits.length === 0) return [];
  const parts: Array<{ name: string; body: string }> = [];
  for (let i = 0; i < hits.length; i++) {
    const end = i + 1 < hits.length ? hits[i + 1]!.index : line.length;
    const body = line.slice(hits[i]!.bodyStart, end).trim();
    if (!COMMERCIAL_BODY.test(body)) continue;
    // Canonicalize display: Juniper / JUNIPER / juniper → Juniper with leading capital
    const raw = hits[i]!.name;
    const display = raw.charAt(0).toUpperCase() + raw.slice(1);
    parts.push({
      name: display,
      body,
    });
  }
  return parts;
}

/**
 * Extract named candidate blocks:
 * FLINT: cost 360000 PASS; delivery 96% PASS; approval granted PASS.
 * ALPHA: approval granted PASS. BETA: approval PENDING FAIL.
 * Juniper: / Lotus: multiline Title Case supplier packs.
 * Candidate A: ...
 */
export function extractNamedCandidateBlocks(userMessage: string): Array<{ name: string; body: string }> {
  const text = String(userMessage || "");
  const out: Array<{ name: string; body: string }> = [];
  const seen = new Set<string>();

  const push = (name: string, body: string) => {
    if (SKIP_CANDIDATE_NAMES.test(name)) return;
    if (!COMMERCIAL_BODY.test(body)) return;
    const k = key(name);
    if (seen.has(k)) return;
    seen.add(k);
    out.push({ name, body: body.trim() });
  };

  // Multiline Title-Case / ALL-CAPS / lowercase headers: "Juniper:" or "juniper:" ...
  const lines = text.split(/\n/);
  const headerRe = /^(?:###\s*)?([A-Za-z][A-Za-z0-9_-]{1,32})\s*:\s*(.*)$/;
  const skipHeaders =
    /^(?:Eligibility|Answer|Rules?|Gates?|Objective|Note|Pack|Claim|Section|Also|Then|Given|Assess|Architecture|Three|Choose|Available|Suppliers?|Bounded|Decision|Checkpoint|Only|Current)$/i;
  for (let i = 0; i < lines.length; i++) {
    const hm = headerRe.exec(lines[i]!.trim());
    if (!hm) continue;
    const nameRaw = hm[1]!;
    if (skipHeaders.test(nameRaw) || SKIP_CANDIDATE_NAMES.test(nameRaw)) continue;
    if (nameRaw.length < 2) continue;
    const name = nameRaw.charAt(0).toUpperCase() + nameRaw.slice(1);
    const firstRest = (hm[2] || "").trim();
    const bodyParts: string[] = [];
    if (firstRest) bodyParts.push(firstRest);
    let j = i + 1;
    for (; j < lines.length; j++) {
      const nxt = lines[j]!.trim();
      if (!nxt) {
        // blank line ends block only if we already have commercial body
        if (bodyParts.length > 0 && COMMERCIAL_BODY.test(bodyParts.join(" "))) break;
        continue;
      }
      if (headerRe.test(nxt) || /^(?:Eligibility|Answer|Rules?|Gates?)\b/i.test(nxt)) break;
      bodyParts.push(nxt);
    }
    const body = bodyParts.join("; ");
    if (COMMERCIAL_BODY.test(body)) {
      push(name, body);
      i = j - 1;
    }
  }

  // Line-oriented ALL-CAPS NAME: blocks (also split inline peers on the same line)
  for (const rawLine of text.split(/\n/)) {
    const peers = splitInlineNamedPeers(rawLine);
    if (peers.length === 0) continue;
    for (const p of peers) push(p.name, p.body);
  }

  // Light eligibility peers: "NEXO granted. PICO pending." (no colon required)
  // Only when an eligibility/approval rule is present — avoids inventing candidates.
  // Do NOT use the /i flag on the name capture — it would match the word "approval".
  if (
    /\b(?:eligible\s+if|approval\s+granted|rule\s*:)\b/i.test(text) ||
    /\beligible\b/i.test(text)
  ) {
    const lightRe =
      /\b([A-Z][A-Z0-9_-]{1,24})\b\s+(granted|pending|cleared|PASS|FAIL|PENDING|Granted|Pending|Cleared)\b/g;
    let lm: RegExpExecArray | null;
    while ((lm = lightRe.exec(text)) !== null) {
      const name = lm[1]!;
      const status = lm[2]!;
      if (SKIP_CANDIDATE_NAMES.test(name)) continue;
      if (/^(?:PASS|FAIL|PENDING|GRANTED|CLEARED|APPROVAL|ELIGIBLE|RULE|SELECT)$/i.test(name)) {
        continue;
      }
      push(name, `approval ${status}`);
    }
  }

  // Candidate A / Candidate B blocks — only when commercial gate language is present
  const candRe =
    /\bCandidate\s+([A-Z0-9_-]+)\b\s*:?\s*([\s\S]{0,500}?)(?=\bCandidate\s+[A-Z0-9_-]+\b|$)/gi;
  let m: RegExpExecArray | null;
  while ((m = candRe.exec(text)) !== null) {
    const name = `Candidate ${m[1]}`;
    const body = m[2]!.trim();
    push(name, body);
  }

  return out.slice(0, 50);
}

function evaluateCandidateGates(
  body: string,
  rules: ParsedRule,
): CommercialGate[] {
  const gates: CommercialGate[] = [];
  const t = body;

  // Cost
  if (rules.costCeiling != null || /\bcost\b/i.test(t)) {
    const costTok =
      /cost\s*[:=]?\s*(?:S\$|SGD|\$)?\s*([\d,]+(?:\.\d+)?)(?:\s*(PASS|FAIL|PENDING|UNKNOWN))?/i.exec(t);
    const explicit = costTok?.[2] ? explicitStatus(costTok[2]) : explicitStatus(
      /cost[^;\n]{0,40}/i.exec(t)?.[0] || "",
    );
    let status: DecisionGateStatus = "UNKNOWN";
    const val = costTok ? parseMoney(costTok[1]!) : null;
    if (explicit) status = explicit;
    else if (val != null && rules.costCeiling != null) {
      status =
        rules.costOp === "<"
          ? val < rules.costCeiling
            ? "PASS"
            : "FAIL"
          : val <= rules.costCeiling
            ? "PASS"
            : "FAIL";
    } else if (val != null) status = "PASS";
    gates.push({
      id: "cost_ceiling",
      label: "cost ceiling",
      status,
      raw: costTok?.[0],
    });
  }

  // Delivery SLA (% OTD) — do not treat "delivery N days" as a % SLA gate.
  const hasDeliveryPct =
    /(?:on[- ]?time\s+)?delivery\s*[:=]?\s*\d+(?:\.\d+)?\s*%/i.test(t) ||
    /\bOTD\b/.test(t);
  if (rules.deliveryFloor != null || hasDeliveryPct) {
    const delTok =
      /(?:on[- ]?time\s+)?delivery\s*[:=]?\s*(\d+(?:\.\d+)?)\s*%(?:\s*(PASS|FAIL|PENDING|UNKNOWN))?/i.exec(
        t,
      );
    const explicit = delTok?.[2]
      ? explicitStatus(delTok[2])
      : explicitStatus(/(?:delivery|OTD)[^;\n]{0,40}/i.exec(t)?.[0] || "");
    let status: DecisionGateStatus = "UNKNOWN";
    const val = delTok ? Number(delTok[1]) : parsePct(t);
    if (explicit) status = explicit;
    else if (val != null && rules.deliveryFloor != null) {
      status =
        rules.deliveryOp === ">"
          ? val > rules.deliveryFloor
            ? "PASS"
            : "FAIL"
          : val >= rules.deliveryFloor
            ? "PASS"
            : "FAIL";
    } else if (val != null) status = "PASS";
    gates.push({
      id: "delivery_sla",
      label: "on-time delivery SLA",
      status,
      raw: delTok?.[0],
    });
  }

  // Delivery lead time in days (e.g. delivery 5 days vs delivery <= 6)
  if (rules.deliveryMaxDays != null || /\bdelivery\s*[:=]?\s*\d+(?:\.\d+)?\s*days?\b/i.test(t)) {
    const daysTok =
      /delivery\s*[:=]?\s*(\d+(?:\.\d+)?)\s*days?\b/i.exec(t) ||
      /(\d+(?:\.\d+)?)\s*days?\b/i.exec(t);
    let status: DecisionGateStatus = "UNKNOWN";
    const val = daysTok ? Number(daysTok[1]) : null;
    if (val != null && rules.deliveryMaxDays != null) {
      status = val <= rules.deliveryMaxDays ? "PASS" : "FAIL";
    } else if (val != null) status = "PASS";
    gates.push({
      id: "delivery_max_days",
      label: "delivery lead-time max days",
      status,
      raw: daysTok?.[0],
    });
  }

  // Approval (mandatory pending = FAIL)
  if (rules.approvalRequired || /\bapproval\b/i.test(t)) {
    const frag = /approval[^;\n]{0,60}/i.exec(t)?.[0] || t;
    let status = explicitStatus(frag);
    if (!status) {
      if (/\b(?:granted|cleared|approved|obtained)\b/i.test(frag)) status = "PASS";
      else if (/\bpending\b/i.test(frag)) status = "FAIL";
      else status = "UNKNOWN";
    }
    // Pending never counts as PASS for mandatory approval
    if (/\bpending\b/i.test(frag) && rules.approvalRequired) status = "FAIL";
    gates.push({
      id: "approval",
      label: "mandatory compliance approval",
      status,
      raw: frag.slice(0, 80),
    });
  }

  // Margin floor (% only — absolute contribution uses contribution_min)
  if (rules.marginFloor != null || /\bmargin\s*[:=]?\s*\d+(?:\.\d+)?\s*%/i.test(t)) {
    const marTok =
      /(?:margin|contribution)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*%(?:\s*(PASS|FAIL|UNKNOWN))?/i.exec(t);
    if (marTok || rules.marginFloor != null) {
      const explicit = marTok?.[2] ? explicitStatus(marTok[2]) : null;
      let status: DecisionGateStatus = "UNKNOWN";
      const val = marTok ? Number(marTok[1]) : null;
      if (explicit) status = explicit;
      else if (val != null && rules.marginFloor != null) {
        status = val >= rules.marginFloor ? "PASS" : "FAIL";
      }
      gates.push({
        id: "margin_floor",
        label: "margin floor",
        status,
        soft: false,
      });
    }
  }

  // Absolute contribution/margin/profit/score floor (given metric vs >= N)
  if (
    rules.contributionMin != null ||
    /(?:contribution|margin|profit|score)\s*(?:US\$|S\$|USD|SGD|\$)?\s*-?\d/i.test(t)
  ) {
    const cTok =
      /(?:contribution|margin|profit|score)\s*(?:US\$|S\$|USD|SGD|\$)?\s*(-?\d+(?:\.\d+)?)/i.exec(
        t,
      ) ||
      /(?:contribution|margin|profit|score)\s*[:=]\s*(?:US\$|S\$|USD|SGD|\$)?\s*(-?\d+(?:\.\d+)?)/i.exec(
        t,
      );
    // Skip % margins — those belong to margin_floor
    if (cTok && /%\s*$/.test(t.slice(cTok.index ?? 0, (cTok.index ?? 0) + cTok[0].length + 2))) {
      /* percentage handled above */
    } else {
      let status: DecisionGateStatus = "UNKNOWN";
      const val = cTok ? Number(cTok[1]) : null;
      if (val != null && rules.contributionMin != null) {
        status = val >= rules.contributionMin ? "PASS" : "FAIL";
      } else if (val != null) status = "PASS";
      gates.push({
        id: "contribution_min",
        label: "contribution minimum",
        status,
        raw: cTok?.[0],
      });
    }
  }

  // Stock / inventory — numeric floor when present; else availability language
  if (rules.stockMin != null || /\bstock\b|\binventory\b/i.test(t)) {
    const stockTok =
      /(?:stock|inventory)\s*[:=]?\s*([\d,]+(?:\.\d+)?)/i.exec(t);
    const frag = /(?:stock|inventory)[^;\n]{0,50}/i.exec(t)?.[0] || "";
    let status: DecisionGateStatus = "UNKNOWN";
    const val = stockTok ? parseMoney(stockTok[1]!) : null;
    if (val != null && rules.stockMin != null) {
      status = val >= rules.stockMin ? "PASS" : "FAIL";
    } else if (val != null) {
      status = "PASS";
    } else {
      status =
        explicitStatus(frag) ||
        (/unavailable|zero|out\s+of\s+stock/i.test(frag)
          ? "FAIL"
          : /available|in\s+stock/i.test(frag)
            ? "PASS"
            : "UNKNOWN");
    }
    gates.push({ id: "stock", label: "stock availability", status, raw: stockTok?.[0] });
  }

  // Policy
  if (/\bpolicy\b/i.test(t)) {
    const frag = /policy[^;\n]{0,50}/i.exec(t)?.[0] || "";
    let status =
      explicitStatus(frag) ||
      (/clear|ok|PASS|compliant/i.test(frag)
        ? "PASS"
        : /fail|violat|block/i.test(frag)
          ? "FAIL"
          : "UNKNOWN");
    gates.push({ id: "policy", label: "policy", status });
  }

  return gates;
}

function metricFromBody(body: string): number | null {
  const contrib =
    /(?:contribution|margin|score|metric)\s*(?:US\$|S\$|USD|SGD|\$)?\s*(-?\d+(?:\.\d+)?)/i.exec(
      body,
    ) ||
    /(?:contribution|margin|score|metric)\s*[:=]\s*(?:US\$|S\$|USD|SGD|\$)?\s*(-?\d+(?:\.\d+)?)/i.exec(
      body,
    );
  if (contrib) return Number(contrib[1]);
  const cost = /cost\s*[:=]?\s*(?:S\$|\$)?\s*([\d,]+(?:\.\d+)?)/i.exec(body);
  if (cost) return -parseMoney(cost[1]!)!; // lower cost → higher attractiveness when negated
  return null;
}

export function buildDecisionCaseState(userMessage: string): DecisionCaseState | null {
  const text = String(userMessage || "");
  const rules = parseDecisionRules(text);
  const blocks = extractNamedCandidateBlocks(text);
  if (blocks.length < 1) return null;

  const mandatory: CommercialGateId[] = [];
  if (rules.costCeiling != null) mandatory.push("cost_ceiling");
  if (rules.deliveryFloor != null) mandatory.push("delivery_sla");
  if (rules.deliveryMaxDays != null) mandatory.push("delivery_max_days");
  if (rules.approvalRequired) mandatory.push("approval");
  if (rules.marginFloor != null) mandatory.push("margin_floor");
  if (rules.contributionMin != null) mandatory.push("contribution_min");
  if (rules.stockMin != null) mandatory.push("stock");

  const candidates: CandidateDecisionState[] = blocks.map((b) => {
    const gates = evaluateCandidateGates(b.body, rules);
    // Ensure mandatory gates exist even if line omitted them
    for (const id of mandatory) {
      if (!gates.some((g) => g.id === id)) {
        gates.push({
          id,
          label: id.replace(/_/g, " "),
          status: "UNKNOWN",
        });
      }
    }
    const hard = gates.filter((g) => !g.soft);
    const failedGates = hard.filter((g) => g.status === "FAIL");
    const unknownGates = hard.filter((g) => g.status === "UNKNOWN");
    const currentlyEligible =
      hard.length > 0 && hard.every((g) => g.status === "PASS");
    const potentiallyAttractiveIfChanged =
      !currentlyEligible &&
      (failedGates.some((g) => g.id === "approval") || unknownGates.length > 0);
    return {
      candidateId: key(b.name),
      displayName: b.name,
      gates,
      failedGates,
      unknownGates,
      currentlyEligible,
      potentiallyAttractiveIfChanged,
      supportedMetric: metricFromBody(b.body),
      evidenceNote: null,
    };
  });

  // Do not displace scale / Candidate-A gate engines with empty commercial parses.
  if (candidates.every((c) => c.gates.length === 0)) return null;

  const eligibleSet = candidates.filter((c) => c.currentlyEligible).map((c) => c.displayName);

  let recommendation: DecisionCaseState["recommendation"] = {
    status: "UNRESOLVED",
    selectedId: null,
    rationale: "Insufficient rule/evidence for a unique selection.",
  };

  const objective = rules.objective;
  if (objective !== "unresolved" || eligibleSet.length >= 0) {
    if (eligibleSet.length === 0) {
      recommendation = {
        status: "DO_NOT_SELECT",
        selectedId: null,
        rationale: "No candidate currently passes every mandatory gate.",
      };
    } else if (eligibleSet.length === 1 || objective === "select_sole_eligible") {
      if (eligibleSet.length === 1) {
        recommendation = {
          status: "SELECT",
          selectedId: eligibleSet[0]!,
          rationale: `${eligibleSet[0]} is the sole currently eligible candidate.`,
        };
      } else if (objective === "select_cheapest_eligible" || objective === "select_highest_metric_eligible") {
        // fall through to multi
      } else {
        recommendation = {
          status: "SELECT",
          selectedId: eligibleSet[0]!,
          rationale: `Multiple eligible; defaulting to first eligible under sole-eligible preference is unsafe — applying comparative rule if present.`,
        };
      }
    }

    if (eligibleSet.length > 1) {
      const eligibleObjs = candidates.filter((c) => c.currentlyEligible);
      if (objective === "select_cheapest_eligible") {
        const ranked = [...eligibleObjs].sort(
          (a, b) => (a.supportedMetric ?? 0) - (b.supportedMetric ?? 0),
        );
        // supportedMetric for cost is negated cost; higher = cheaper
        ranked.sort((a, b) => (b.supportedMetric ?? -Infinity) - (a.supportedMetric ?? -Infinity));
        recommendation = {
          status: "SELECT",
          selectedId: ranked[0]!.displayName,
          rationale: `Cheapest eligible among ${eligibleSet.join(", ")}.`,
        };
      } else if (objective === "select_highest_metric_eligible") {
        const ranked = [...eligibleObjs].sort(
          (a, b) => (b.supportedMetric ?? -Infinity) - (a.supportedMetric ?? -Infinity),
        );
        recommendation = {
          status: "SELECT",
          selectedId: ranked[0]!.displayName,
          rationale: `Highest supported metric among eligible: ${eligibleSet.join(", ")}.`,
        };
      } else if (eligibleSet.length === 1) {
        recommendation = {
          status: "SELECT",
          selectedId: eligibleSet[0]!,
          rationale: `${eligibleSet[0]} is the sole currently eligible candidate.`,
        };
      } else {
        // Multiple eligible, sole-eligible objective → still pick first deterministic by name for stability? 
        // Mission: if multiple apply comparison rule; if no comparison → UNRESOLVED
        recommendation = {
          status: "UNRESOLVED",
          selectedId: null,
          rationale: `Multiple eligible (${eligibleSet.join(", ")}) without a comparative rule.`,
        };
      }
    }
  }

  // Fix sole-eligible when length===1 already set above; when length>1 and select_sole_eligible without compare → UNRESOLVED (done)

  if (eligibleSet.length === 1) {
    recommendation = {
      status: "SELECT",
      selectedId: eligibleSet[0]!,
      rationale: `${eligibleSet[0]} is the sole currently eligible candidate.`,
    };
  }

  const reversalConditions: string[] = [];
  for (const c of candidates) {
    if (c.currentlyEligible) continue;
    if (c.failedGates.length + c.unknownGates.length === 0) continue;
    const blockers = [...c.failedGates, ...c.unknownGates].map((g) => g.label);
    reversalConditions.push(
      `${c.displayName} becomes eligible only if ALL remaining blockers clear: ${blockers.join("; ")}.`,
    );
    // Counterfactual selection if blockers clear (given-metric multi-gate decisions).
    if (
      (objective === "select_highest_metric_eligible" ||
        objective === "select_cheapest_eligible") &&
      c.supportedMetric != null
    ) {
      const hypothetic = [
        ...candidates.filter((x) => x.currentlyEligible),
        { ...c, currentlyEligible: true },
      ];
      const ranked = [...hypothetic].sort((a, b) => {
        if (objective === "select_cheapest_eligible") {
          return (b.supportedMetric ?? -Infinity) - (a.supportedMetric ?? -Infinity);
        }
        return (b.supportedMetric ?? -Infinity) - (a.supportedMetric ?? -Infinity);
      });
      const winner = ranked[0]!;
      const current =
        recommendation.status === "SELECT" ? recommendation.selectedId : null;
      if (current && winner.displayName !== current) {
        reversalConditions.push(
          `If ${c.displayName} clears all blockers, selection changes to ${winner.displayName}.`,
        );
      } else if (current) {
        reversalConditions.push(
          `If ${c.displayName} clears all blockers, selection remains ${current}.`,
        );
      } else {
        reversalConditions.push(
          `If ${c.displayName} clears all blockers, select ${winner.displayName}.`,
        );
      }
    }
  }

  return {
    caseId: `decision_${candidates.map((c) => c.candidateId).slice(0, 4).join("_")}`,
    objective,
    tieBreak: null,
    mandatoryGateIds: mandatory,
    candidates,
    eligibleSet,
    recommendation,
    reversalConditions,
    decisionConfidence: candidates.every((c) => c.unknownGates.length === 0) ? "high" : "medium",
  };
}

export function eligibleSetOf(state: DecisionCaseState): string[] {
  return state.candidates.filter((c) => c.currentlyEligible).map((c) => c.displayName);
}

export function isCandidateEligible(state: DecisionCaseState, name: string): boolean | null {
  const k = key(name);
  const c = state.candidates.find((x) => key(x.displayName) === k || x.candidateId === k);
  return c ? c.currentlyEligible : null;
}

export function formatDecisionCaseBrief(state: DecisionCaseState): string {
  const lines = [
    "[Decision state — derive eligibility and recommendation from this; do not reinvent]",
    `- ELIGIBLE_SET=${state.eligibleSet.length ? state.eligibleSet.join(", ") : "(none)"}`,
    `- CURRENT_RECOMMENDATION=${
      state.recommendation.status === "SELECT"
        ? `SELECT ${state.recommendation.selectedId}`
        : state.recommendation.status === "DO_NOT_SELECT"
          ? "DO NOT SELECT ANY"
          : "UNRESOLVED"
    }`,
    `- RATIONALE=${state.recommendation.rationale}`,
  ];
  for (const c of state.candidates) {
    lines.push(
      `- CANDIDATE ${c.displayName}: ELIGIBLE=${c.currentlyEligible ? "YES" : "NO"}; gates=${c.gates
        .map((g) => `${g.id}=${g.status}`)
        .join(", ")}`,
    );
  }
  if (state.reversalConditions.length) {
    lines.push("- REVERSAL_CONDITIONS:");
    for (const r of state.reversalConditions) lines.push(`  - ${r}`);
  }
  return lines.join("\n");
}

/**
 * Detect material contradictions between visible answer and canonical decision state.
 * Returns telemetry codes only — never append these to the user-visible answer.
 */
export function assessDecisionVisibilityConsistency(
  answer: string,
  state: DecisionCaseState,
): { ok: boolean; failures: string[] } {
  const text = String(answer || "");
  const failures: string[] = [];
  const eligible = new Set(state.eligibleSet.map((n) => key(n)));

  for (const c of state.candidates) {
    const name = c.displayName;
    const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const reElig = new RegExp(
      `\\b${esc}\\b[^\\n.]{0,40}\\b(?:is\\s+)?(?:currently\\s+)?eligible\\b`,
      "i",
    );
    const reInelig = new RegExp(
      `\\b${esc}\\b[^\\n.]{0,40}\\b(?:ineligible|not\\s+(?:currently\\s+)?eligible)\\b`,
      "i",
    );
    if (!c.currentlyEligible && reElig.test(text) && !reInelig.test(text)) {
      if (
        !/\b(?:not|never|no\s+longer)\s+(?:currently\s+)?eligible\b/i.test(
          text.match(new RegExp(`[^\\n]{0,120}\\b${esc}\\b[^\\n]{0,120}`, "i"))?.[0] || "",
        )
      ) {
        failures.push(`FALSE_ELIGIBLE_ASSERTION:${name}`);
      }
      if (new RegExp(`${esc}[^\\n]{0,80}eligible[^\\n]{0,40}pending`, "i").test(text)) {
        failures.push(`PENDING_AS_ELIGIBLE:${name}`);
      }
    }
    if (c.currentlyEligible && reInelig.test(text)) {
      failures.push(`FALSE_INELIGIBLE_ASSERTION:${name}`);
    }
  }

  // Eligible set cardinality
  if (state.eligibleSet.length === 1) {
    if (/\bat\s+least\s+two\b[^.\n]{0,40}(?:eligible|qualify)/i.test(text)) {
      failures.push("FALSE_ELIGIBLE_COUNT_GE2");
    }
    if (/\bEligible\s+Suppliers?\s*:\s*([^\n]+)/i.test(text)) {
      const list = /\bEligible\s+Suppliers?\s*:\s*([^\n]+)/i.exec(text)?.[1] || "";
      const named = state.candidates.filter((c) =>
        new RegExp(`\\b${c.displayName}\\b`, "i").test(list),
      );
      for (const n of named) {
        if (!eligible.has(key(n.displayName))) {
          failures.push(`SUMMARY_LIST_INCLUDES_INELIGIBLE:${n.displayName}`);
        }
      }
    }
  }

  // Recommendation action must be present and consistent
  if (state.recommendation.status === "SELECT" && state.recommendation.selectedId) {
    const sel = state.recommendation.selectedId;
    const esc = sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (/\bDO\s+NOT\s+SELECT\s+ANY\b/i.test(text)) {
      failures.push("FALSE_DO_NOT_SELECT_WHILE_SOLE_ELIGIBLE");
    }
    const hasAction =
      new RegExp(`\\bSELECT\\s+${esc}\\b`, "i").test(text) ||
      new RegExp(
        `\\b(?:recommend(?:ing|s)?|choose|select(?:ing)?)\\s+(?:selecting\\s+)?\\*?\\*?${esc}\\b`,
        "i",
      ).test(text) ||
      new RegExp(`\\b${esc}\\b[^\\n]{0,40}(?:only eligible|sole eligible)`, "i").test(text);
    if (!hasAction) failures.push(`MISSING_SELECT_ACTION:${sel}`);
    for (const c of state.candidates) {
      if (
        !c.currentlyEligible &&
        new RegExp(`\\b(?:select|recommend|choose)\\s+${c.displayName}\\b`, "i").test(text)
      ) {
        failures.push(`SELECTS_INELIGIBLE:${c.displayName}`);
      }
    }
  }
  if (state.recommendation.status === "DO_NOT_SELECT") {
    const hasNone =
      /\bDO\s+NOT\s+SELECT(?:\s+ANY)?\b/i.test(text) ||
      /\bselect\s+none\b|\bnone\s+eligible\b|\bno\s+(?:supplier|candidate)s?\s+(?:is|are)\s+eligible\b/i.test(
        text,
      ) ||
      /\bdo\s+not\s+meet\s+(?:the\s+)?eligibility\b/i.test(text);
    if (!hasNone) failures.push("MISSING_DO_NOT_SELECT_ACTION");
    for (const c of state.candidates) {
      if (new RegExp(`\\b(?:select|recommend)\\s+${c.displayName}\\b`, "i").test(text)) {
        failures.push(`SELECT_WHILE_NONE_ELIGIBLE:${c.displayName}`);
      }
    }
  }

  return { ok: failures.length === 0, failures };
}

function ensureRecommendationSection(out: string, actionLine: string): string {
  if (/(#{1,3}|\d+[.)])\s*Recommendation\b/i.test(out)) {
    return out
      .replace(
        /((?:#{1,3}|\d+[.)])\s*Recommendation[^\n]*\n)/i,
        `$1${actionLine}\n`,
      )
      .replace(/\n{3,}/g, "\n\n");
  }
  return `${out.trim()}\n\n### Recommendation\n${actionLine}\n`;
}

/**
 * Repair visible answer to align with canonical decision (no diagnostic append).
 */
export function repairDecisionVisibility(
  answer: string,
  state: DecisionCaseState,
): string {
  let out = String(answer || "");
  const assess = assessDecisionVisibilityConsistency(out, state);

  // Fix eligible-suppliers summary lines whenever list includes ineligibles or assess failed
  if (!assess.ok || /\bEligible\s+Suppliers?\s*:/i.test(out)) {
    out = out.replace(
      /\bEligible\s+Suppliers?\s*:\s*[^\n]+/gi,
      `Eligible Suppliers: ${state.eligibleSet.length ? state.eligibleSet.join(" and ") : "none"}`,
    );
  }

  // Soften false "eligible because pending"
  for (const c of state.candidates) {
    if (c.currentlyEligible) continue;
    const re = new RegExp(
      `(\\b${c.displayName}\\b[^\\n]{0,100})\\beligible\\b([^\\n]{0,60}pending)`,
      "gi",
    );
    out = out.replace(re, `$1not currently eligible$2`);
  }

  // False ineligible for currently eligible candidates
  for (const c of state.candidates) {
    if (!c.currentlyEligible) continue;
    const re = new RegExp(
      `(\\b${c.displayName}\\b[^\\n]{0,60})\\b(?:is\\s+)?not\\s+currently\\s+eligible\\b`,
      "gi",
    );
    out = out.replace(re, `$1is currently eligible`);
  }

  // Lock current recommendation action into the visible surface
  if (state.recommendation.status === "SELECT" && state.recommendation.selectedId) {
    const sel = state.recommendation.selectedId;
    out = out.replace(/\bDO\s+NOT\s+SELECT\s+ANY(?:\s+YET)?\b/gi, `SELECT ${sel}`);
    const hasAction =
      new RegExp(`\\bSELECT\\s+${sel}\\b`, "i").test(out) ||
      new RegExp(
        `\\b(?:recommend(?:ing|s)?|choose|select(?:ing)?)\\s+(?:selecting\\s+)?\\*?\\*?${sel}\\b`,
        "i",
      ).test(out);
    if (!hasAction) {
      out = ensureRecommendationSection(
        out,
        `**Current action:** SELECT ${sel}. ${state.recommendation.rationale}`,
      );
    }
  } else if (state.recommendation.status === "DO_NOT_SELECT") {
    const hasNone =
      /\bDO\s+NOT\s+SELECT(?:\s+ANY)?\b/i.test(out) ||
      /\bselect\s+none\b|\bnone\s+eligible\b/i.test(out);
    if (!hasNone) {
      out = ensureRecommendationSection(
        out,
        `**Current action:** DO NOT SELECT ANY. ${state.recommendation.rationale}`,
      );
    }
  }

  // Re-check; if still inconsistent, force eligible-set line once
  const again = assessDecisionVisibilityConsistency(out, state);
  if (!again.ok && state.eligibleSet.length >= 0) {
    if (!/\bEligible\s+(?:set|Suppliers?)\s*:/i.test(out)) {
      out = `${out.trim()}\n\nEligible Suppliers: ${
        state.eligibleSet.length ? state.eligibleSet.join(" and ") : "none"
      }\n`;
    }
  }

  return out.replace(/\n{3,}/g, "\n\n").trim();
}
