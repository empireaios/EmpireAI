/**
 * Event-state distinction — later economic/service outcomes must not
 * automatically erase established historical occurrence.
 *
 * Layers (kept separate):
 * EVENT_OCCURRED | OPERATIONAL_STATUS_AT_TIME | LATER_SERVICE_OUTCOME |
 * ECONOMIC_OUTCOME | CURRENT_ACCOUNTING_TREATMENT
 *
 * Repair 4: realize the principle in domain-native language — never dump
 * chargeback/sales-history doctrine blocks into hotel/logistics answers.
 *
 * Memory relevance: a retrieved occurrence lesson may inform reasoning without
 * appending lesson prose. Visible doctrine only when the task requires it
 * (occurrence erasure in draft, or user asks occurrence vs economic).
 */

export type EventStateLayer =
  | "EVENT_OCCURRED"
  | "OPERATIONAL_STATUS_AT_TIME"
  | "LATER_SERVICE_OUTCOME"
  | "ECONOMIC_OUTCOME"
  | "CURRENT_ACCOUNTING_TREATMENT";

export type ScenarioDomain =
  | "hospitality"
  | "logistics"
  | "software"
  | "healthcare"
  | "manufacturing"
  | "generic";

export function detectScenarioDomain(userMessage: string): ScenarioDomain {
  const t = String(userMessage || "").toLowerCase();
  if (/\b(hotel|hospitality|room[- ]?nights?|guest|property registry|harbour|hillside)\b/i.test(t)) {
    return "hospitality";
  }
  if (/\b(shipment|logistics|delivery|freight|route completion)\b/i.test(t)) return "logistics";
  if (/\b(subscription|incident|uptime|saas|software)\b/i.test(t)) return "software";
  if (/\b(patient|hospital|clinic|healthcare|care episode)\b/i.test(t)) return "healthcare";
  if (/\b(manufactur|factory|units produced|assembly)\b/i.test(t)) return "manufacturing";
  return "generic";
}

/** Strip negated "no refund/compensation" phrases before economic-reversal detection. */
function stripEconomicNegations(text: string): string {
  return String(text || "")
    .replace(
      /\bno\s+(?:commercial\s+)?(?:refund|return|charge\s*-?back|compensation|reversal)s?\b(?:\s+or\s+(?:refund|return|charge\s*-?back|compensation|reversal)s?)*\b[^.?\n]{0,80}/gi,
      " ",
    )
    .replace(/\b(?:refund|compensation|chargeback)\s+is\s+(?:not\s+)?(?:in\s+scope|discussed|relevant)\b/gi, " ");
}

/**
 * Pack establishes earlier performance/completion AND a later *economic*
 * reversal-class outcome (refund / commercial return / chargeback / compensation).
 *
 * Operational later outcomes alone (SLA alarm, quality failure, process rework return)
 * are NOT economic reversals and must not activate refund doctrine.
 */
export function packEstablishesOccurrenceThenLaterReversal(userMessage: string): boolean {
  const raw = String(userMessage || "");
  const t = stripEconomicNegations(raw);
  const occurred =
    /\b(completed|delivered|performed|shipped|fulfilled|settled|occurred|recorded (?:as )?complete|physically (?:occurred|completed)|service (?:was )?performed|activated|payment (?:was )?settled|stays completed|units completed)\b/i.test(
      t,
    );
  if (!occurred) return false;

  const laterEconomic =
    /\b(?:(?:later|full)\s+)?refunds?\b|\bcharged?\s*-?backs?\b|\b(?:later\s+)?compensat(?:ed|ion)\b|\beconomic\s+revers(?:al|ed)\b|\blater\s+(?:adverse\s+)?economic\s+outcome\b|\blater\s+return(?:ed)?\b|\b(?:purchase|order|product|item|goods|sale|units?)\s+return(?:ed)?\b|\breturn(?:ed)?\s+(?:for\s+)?(?:a\s+)?(?:refund|credit)\b|\bcancell(?:ed|ation)\s+after\b|\bcredit\s+(?:issued|applied)\b/i.test(
      t,
    );
  return laterEconomic;
}

/** Pack supplies evidence that the earlier record itself is void/fraudulent/never executed. */
export function packSuppliesOccurrenceInvalidation(userMessage: string): boolean {
  const t = String(userMessage || "");
  return /\b(fraud(?:ulent)?|never (?:actually )?(?:executed|occurred|shipped|performed)|erroneous (?:record|entry)|void(?:ed)?|duplicated (?:record|entry)|fabricat(?:ed|ion)|record (?:was )?false|did not (?:in fact |actually )?(?:occur|happen|execute))\b/i.test(
    t,
  );
}

const ERASURE_PATTERNS: RegExp[] = [
  /should not be counted as historically (?:completed|occurred|done)/i,
  /(?:did|does) not (?:really )?count as (?:having )?(?:historically )?(?:occurred|completed)/i,
  /(?:never|did not) (?:historically )?(?:occur|happen|complete) because .{0,80}(?:refund|return|chargeback|compensat)/i,
  /refund (?:means|proves|implies) .{0,60}(?:never|did not) (?:occur|happen|complete)/i,
  /later (?:refund|return|reversal) (?:erases|cancels|negates) (?:the )?(?:historical )?(?:occurrence|completion|delivery)/i,
  /(?:cannot|should not) treat .{0,40}as (?:having )?(?:historically )?(?:occurred|completed) (?:solely )?because .{0,40}refund/i,
];

export function answerErasesHistoricalOccurrence(answer: string): boolean {
  return ERASURE_PATTERNS.some((r) => r.test(String(answer || "")));
}

/**
 * User explicitly asks whether later economic outcomes erase historical occurrence,
 * or asks for the occurrence↔economic principle itself.
 * Keyword "historical" alone is insufficient.
 */
export function userAsksOccurrenceVsEconomic(userMessage: string): boolean {
  const t = String(userMessage || "");
  return (
    /\b(?:does|did|can|will)\s+(?:a\s+)?(?:later\s+)?(?:refund|return|charge\s*-?back|compensation|reversal|credit)\b[^.?\n]{0,80}\b(?:erase|negate|cancel|prove|mean|imply).{0,40}(?:occur|complet|histor)/i.test(
      t,
    ) ||
    /\b(?:historically\s+occur(?:red)?|historical\s+occurrence).{0,60}(?:despite|after|vs\.?|versus|or).{0,40}(?:refund|return|charge\s*-?back|compensat|reversal|credit)/i.test(
      t,
    ) ||
    /\b(?:refund|return|charge\s*-?back).{0,40}(?:erase|negate|prove\s+(?:non[- ]?occurrence|never\s+occur))/i.test(
      t,
    ) ||
    /\bkeep\s+historical\s+occurrence\s+distinct\b/i.test(t) ||
    /\bEVENT_OCCURRED\b.*\bECONOMIC_OUTCOME\b/i.test(t)
  );
}

/** Domain-native one-liner — principle applied, not doctrine dumped. */
export function occurrencePreservationNote(domain: ScenarioDomain): string {
  switch (domain) {
    case "hospitality":
      return "A later refund after a service breach changes economic treatment; it does not by itself erase that the completed stays historically occurred.";
    case "logistics":
      return "A later delivery credit or refund changes settlement; it does not by itself erase that the shipment was historically completed.";
    case "software":
      return "A later credit or cancellation after activation changes billing treatment; it does not by itself erase that the activation historically occurred.";
    case "healthcare":
      return "Later compensation or reversal changes financial treatment; it does not by itself erase that the care episode historically occurred.";
    case "manufacturing":
      return "A later return or credit changes economic treatment; it does not by itself erase that the completed units historically occurred.";
    default:
      return "A later refund or reversal changes economic treatment; it does not by itself erase that the earlier verified event historically occurred.";
  }
}

export function occurrenceInvalidationNote(domain: ScenarioDomain): string {
  void domain;
  return "Later verified evidence shows the earlier record itself is invalid (fraudulent, void, erroneous, or never executed) — occurrence may be treated as not established for that reason.";
}

/**
 * Repair answers that collapse later reversal into historical non-occurrence.
 * Prefer in-place phrase repair; append at most one short domain-native sentence
 * only when the draft erased occurrence and the pack establishes economic reversal
 * (or the user explicitly asks occurrence vs economic).
 * Never surface chargeback/sales-history doctrine templates.
 */
export function repairHistoricalOccurrenceErasure(
  answer: string,
  userMessage: string,
): { message: string; repaired: boolean; lessonTextSurfaced: boolean } {
  const text = String(answer || "").trim();
  if (!text) return { message: text, repaired: false, lessonTextSurfaced: false };

  const domain = detectScenarioDomain(userMessage);
  const packReversal = packEstablishesOccurrenceThenLaterReversal(userMessage);
  const packInvalidates = packSuppliesOccurrenceInvalidation(userMessage);
  const erasedOriginally = answerErasesHistoricalOccurrence(text);
  const asksOccurrence = userAsksOccurrenceVsEconomic(userMessage);

  // Strip any prior doctrine dumps (Repair 3 residue).
  let out = text
    .replace(/\n*\*\*Event-state reading:\*\*[^\n]*(?:\n(?!\n)[^\n]*)*/gi, "")
    .replace(/\n*Event-state reading:[^\n]*/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!packReversal && !erasedOriginally) {
    return { message: out, repaired: out !== text, lessonTextSurfaced: false };
  }

  if (packInvalidates) {
    if (!/invalidat|fraud|void|never executed|erroneous/i.test(out)) {
      return {
        message: `${out}\n\n${occurrenceInvalidationNote(domain)}`.trim(),
        repaired: true,
        lessonTextSurfaced: false,
      };
    }
    return { message: out, repaired: out !== text, lessonTextSurfaced: false };
  }

  let repaired = out !== text;
  for (const pattern of ERASURE_PATTERNS) {
    if (pattern.test(out)) {
      out = out.replace(
        pattern,
        "the later economic outcome changed accounting treatment, but the earlier verified event remains historically occurred unless the record itself is invalidated",
      );
      repaired = true;
    }
  }

  // Visible lesson text only when repairing erasure or answering an explicit ask —
  // never because the draft casually mentioned "return"/"historically".
  const needsNative =
    packReversal &&
    (erasedOriginally || asksOccurrence) &&
    !/does not by itself (?:mean|prove|erase)/i.test(out);
  if (needsNative) {
    out = `${out}\n\n${occurrencePreservationNote(domain)}`.trim();
    repaired = true;
  }

  return {
    message: out.replace(/\n{3,}/g, "\n\n").trim(),
    repaired,
    lessonTextSurfaced: needsNative,
  };
}

/** Scenario-native demotion — never live sales-history phrasing. */
export const SCOPED_PERFORMANCE_DEMOTE =
  "That performance claim is not established from the supplied scenario evidence — treat it as unproven.";

export const LIVE_SALES_HISTORY_DEMOTE =
  "I don't have verified sales-history evidence beyond realised orders — so I won't treat those performance claims as established.";

export function isSourceDomainLanguageLeak(text: string): boolean {
  const t = String(text || "");
  return (
    /\bverified sales-history evidence beyond realised orders\b/i.test(t) ||
    /\bI don't have verified sales-history\b/i.test(t) ||
    /\brealised orders (?:and realised revenue )?remain(?:s)? zero\b/i.test(t) ||
    /\bCurrent product focus is\b/i.test(t) ||
    /\bBrief verified note:\s*focus remains\b/i.test(t) ||
    /\bcommissioning\/KPI state\b/i.test(t) ||
    /\bverified operating state now\b/i.test(t) ||
    /\b\*\*Event-state reading:\*\*/i.test(t) ||
    /\bchargeback, compensation, SLA breach\b/i.test(t)
  );
}

/** Strip source-domain / doctrine surface from synthetic answers. */
export function stripSourceDomainSurfaceLanguage(answer: string, userMessage: string): string {
  const scoped =
    /\bsynthetic\w*|\bscenario[- ]only\b|\bfor analysis(?:\s+only)?\b|\bhypothetical\b/i.test(
      userMessage,
    );
  if (!scoped && !/\bhotel|hospitality|logistics|shipment|healthcare|subscription\b/i.test(userMessage)) {
    return String(answer || "").trim();
  }
  return String(answer || "")
    .replace(/[^.!\n]*verified sales-history evidence beyond realised orders[^.!\n]*[.!]?/gi, "")
    .replace(/[^.!\n]*I don't have verified sales-history[^.!\n]*[.!]?/gi, "")
    .replace(/\n*\*\*Event-state reading:\*\*[^\n]*(?:\n(?!\n)[^\n]*)*/gi, "")
    .replace(/\bcommissioning\/KPI state\b/gi, "scenario evidence")
    .replace(/\brealised orders\b/gi, "realised counts")
    .replace(/[^\S\n]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
