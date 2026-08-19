/**
 * Event-state distinction — later economic/service outcomes must not
 * automatically erase established historical occurrence.
 *
 * Layers (kept separate):
 * EVENT_OCCURRED | OPERATIONAL_STATUS_AT_TIME | LATER_SERVICE_OUTCOME |
 * ECONOMIC_OUTCOME | CURRENT_ACCOUNTING_TREATMENT
 *
 * Does not encode sealed examination content.
 */

export type EventStateLayer =
  | "EVENT_OCCURRED"
  | "OPERATIONAL_STATUS_AT_TIME"
  | "LATER_SERVICE_OUTCOME"
  | "ECONOMIC_OUTCOME"
  | "CURRENT_ACCOUNTING_TREATMENT";

/** Pack establishes earlier performance/completion AND a later reversal-class outcome. */
export function packEstablishesOccurrenceThenLaterReversal(userMessage: string): boolean {
  const t = String(userMessage || "");
  const occurred =
    /\b(completed|delivered|performed|shipped|fulfilled|settled|occurred|recorded (?:as )?complete|physically (?:occurred|completed)|service (?:was )?performed|activated|payment (?:was )?settled)\b/i.test(
      t,
    );
  const laterReversal =
    /\b(refund|full refund|return(?:ed)?|charge\s*-?backs?|charged\s+back|compensat(?:ed|ion)|revers(?:al|ed)|cancell(?:ed|ation) after|SLA (?:breach|failure)|quality failure|later (?:adverse|economic) outcome)\b/i.test(
      t,
    );
  return occurred && laterReversal;
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

export const OCCURRENCE_PRESERVATION_NOTE = [
  "**Event-state reading:** A later refund, return, chargeback, compensation, SLA breach, or adverse economic outcome does not by itself prove the earlier verified event never occurred.",
  "Keep separate: historical occurrence, operational status at the time, later service outcome, economic outcome, and current accounting treatment.",
  "Only evidence that specifically invalidates the historical record (fraud, void, never executed, erroneous duplicate) may erase historical occurrence.",
].join(" ");

export const OCCURRENCE_INVALIDATION_NOTE = [
  "**Event-state reading:** Later verified evidence indicates the earlier record itself is invalid (fraudulent, void, erroneous, or never executed).",
  "In that case historical occurrence may be treated as not established — because the record was invalidated, not merely because economics later reversed.",
].join(" ");

/**
 * Repair answers that collapse later reversal into historical non-occurrence
 * when the pack did not supply record-invalidation evidence.
 */
export function repairHistoricalOccurrenceErasure(
  answer: string,
  userMessage: string,
): { message: string; repaired: boolean } {
  const text = String(answer || "").trim();
  if (!text) return { message: text, repaired: false };

  const packReversal = packEstablishesOccurrenceThenLaterReversal(userMessage);
  const packInvalidates = packSuppliesOccurrenceInvalidation(userMessage);
  if (!packReversal && !answerErasesHistoricalOccurrence(text)) {
    return { message: text, repaired: false };
  }

  if (packInvalidates) {
    // Ensure invalidation framing is present; do not force occurrence preservation.
    if (!/invalidat|fraud|void|never executed|erroneous/i.test(text)) {
      return {
        message: `${text}\n\n${OCCURRENCE_INVALIDATION_NOTE}`.trim(),
        repaired: true,
      };
    }
    return { message: text, repaired: false };
  }

  if (!answerErasesHistoricalOccurrence(text) && !packReversal) {
    return { message: text, repaired: false };
  }

  let out = text;
  let repaired = false;

  for (const pattern of ERASURE_PATTERNS) {
    if (pattern.test(out)) {
      out = out.replace(
        pattern,
        "the later economic or service outcome changed accounting treatment, but the earlier verified event remains historically occurred unless the record itself is invalidated",
      );
      repaired = true;
    }
  }

  if (packReversal && answerErasesHistoricalOccurrence(text)) {
    // After pattern replace, still append canonical note if erasure residue remains.
    if (answerErasesHistoricalOccurrence(out) || !/Event-state reading/i.test(out)) {
      out = `${out}\n\n${OCCURRENCE_PRESERVATION_NOTE}`.trim();
      repaired = true;
    }
  } else if (packReversal && /refund|return|chargeback|compensat/i.test(out) && /histor/i.test(out)) {
    if (!/Event-state reading|does not by itself prove the earlier/i.test(out)) {
      out = `${out}\n\n${OCCURRENCE_PRESERVATION_NOTE}`.trim();
      repaired = true;
    }
  }

  return { message: out.replace(/\n{3,}/g, "\n\n").trim(), repaired };
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
    /\brealised orders (?:and realised revenue )?remain(?:s)? zero\b/i.test(t) ||
    /\bCurrent product focus is\b/i.test(t) ||
    /\bBrief verified note:\s*focus remains\b/i.test(t) ||
    /\bcommissioning\/KPI state\b/i.test(t) ||
    /\bverified operating state now\b/i.test(t)
  );
}
