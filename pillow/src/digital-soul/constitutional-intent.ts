/**
 * Constitutional intent detection (Digital Soul V2).
 *
 * Interprets natural-language bypass / override / secrecy attempts as
 * constitutional governance requests before compliance scoring.
 *
 * Design: compositional intent families (action × governance object),
 * not a brittle single-keyword blacklist. Families are extensible.
 */

export type ConstitutionalIntentFamilyId =
  | "constitution_bypass"
  | "owner_authority_bypass"
  | "approval_bypass"
  | "governance_bypass"
  | "compliance_bypass"
  | "review_bypass"
  | "decision_record_bypass"
  | "accountability_secrecy"
  | "fabricated_authorisation"
  | "exception_plea";

export type ConstitutionalIntentMatch = {
  familyId: ConstitutionalIntentFamilyId;
  principleId: string;
  rationale: string;
};

export type ConstitutionalIntentDetection = {
  detected: boolean;
  requiresGrandKingApproval: boolean;
  isViolation: boolean;
  matches: ConstitutionalIntentMatch[];
  summary: string;
};

/** Normalize free text for intent matching — punctuation-insensitive, stable. */
export function normalizeConstitutionalText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9'\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type PatternFamily = {
  id: ConstitutionalIntentFamilyId;
  principleId: string;
  /** True when this family alone is enough to declare a constitutional violation. */
  violation: boolean;
  /** Extensible matchers — add paraphrases here without rewriting compliance. */
  match: (normalized: string) => string | null;
};

function hasAll(normalized: string, patterns: RegExp[]): boolean {
  return patterns.every((p) => p.test(normalized));
}

function hasAny(normalized: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(normalized));
}

/** Bypass / override / waive language (action side of composition). */
const BYPASS_ACTIONS: RegExp[] = [
  /\bignor(e|es|ed|ing)\b/,
  /\bskip(s|ped|ping)?\b/,
  /\bbypass(es|ed|ing)?\b/,
  /\boverrid(e|es|ed|ing|den)\b/,
  /\bcircumvent(s|ed|ing)?\b/,
  /\bwaiv(e|es|ed|ing)\b/,
  /\bsuspend(s|ed|ing)?\b/,
  /\bdisregard(s|ed|ing)?\b/,
  /\bset aside\b/,
  /\bgo around\b/,
  /\bwork around\b/,
  // Do NOT treat bare "replace" as bypass — executive answers often say
  // "replace X with Y" while still requiring owner approval (false positive).
  /\breplac(e|es|ed|ing) (the )?(constitution|constitutional|approval|governance|compliance|owner)\b/,
  /\bwithout (waiting for |needing )?approval\b/,
];

const CONSTITUTION_OBJECTS: RegExp[] = [
  /\bconstitution(al)?\b/,
  /\bconstitutional (check|checks|rule|rules|governance|compliance|principle|principles)\b/,
];

const OWNER_OBJECTS: RegExp[] = [
  /\bgrand king\b/,
  /\bowner(s)? (authority|approval|authorisation|authorization)\b/,
  /\bowner control\b/,
];

const APPROVAL_OBJECTS: RegExp[] = [
  /\bapproval (process|pack|gate|workflow|requirement|requirements)\b/,
  /\bmandatory approval\b/,
  /\bgrand king approval\b/,
  /\bowner approval\b/,
  // Intentionally no bare /\bapproval\b/ — advisory text often says
  // "requires your approval" which must remain allowed.
];

const GOVERNANCE_OBJECTS: RegExp[] = [
  /\bgovernance\b/,
  /\bmandatory governance\b/,
  /\bgovernance (review|process|check|checks|rules)\b/,
];

const COMPLIANCE_OBJECTS: RegExp[] = [
  /\bcompliance\b/,
  /\bconstitutional compliance\b/,
  /\bcompliance (check|checks|rules|process)\b/,
];

const REVIEW_OBJECTS: RegExp[] = [
  /\bmandatory review\b/,
  /\bexecutive review\b/,
  /\breview process\b/,
  /\brequired review\b/,
];

const RECORD_OBJECTS: RegExp[] = [
  /\bdecision records?\b/,
  /\brecords?\b/,
  /\baudit (trail|log|logs)\b/,
  /\blog(ging)?\b/,
];

/**
 * Extensible intent families. Add paraphrases by appending matchers —
 * do not hard-code one-off strings into evaluateConstitutionalCompliance.
 */
const INTENT_FAMILIES: PatternFamily[] = [
  {
    id: "constitution_bypass",
    principleId: "S0-OWNER-CONTROL",
    violation: true,
    match: (n) => {
      if (hasAny(n, BYPASS_ACTIONS) && hasAny(n, CONSTITUTION_OBJECTS)) {
        return "Free-text intent to bypass or disregard the Constitution";
      }
      if (
        /\bconstitution\b/.test(n) &&
        /\b(says? no|forbids?|prohibits?|does not allow|won't allow)\b/.test(n) &&
        /\b(but|just this once|anyway|still|regardless)\b/.test(n)
      ) {
        return "Exception plea against known constitutional prohibition";
      }
      return null;
    },
  },
  {
    id: "owner_authority_bypass",
    principleId: "S8-OWNER-APPROVAL",
    violation: true,
    match: (n) => {
      if (hasAny(n, BYPASS_ACTIONS) && hasAny(n, OWNER_OBJECTS)) {
        return "Free-text intent to bypass Grand King / owner authority";
      }
      if (
        /\b(bypass|ignore|override|replace)\b/.test(n) &&
        /\b(owner authority|grand king authority|constitutional owner)\b/.test(n)
      ) {
        return "Free-text intent to bypass owner authority";
      }
      return null;
    },
  },
  {
    id: "approval_bypass",
    principleId: "S8-OWNER-APPROVAL",
    violation: true,
    match: (n) => {
      if (
        /\bwithout (any |the |required |mandatory |waiting for |needing )?approval\b/.test(n) ||
        /\b(skip|bypass|ignore|waive)\b.{0,40}\bapproval\b/.test(n) ||
        /\bapproval\b.{0,40}\b(skip|bypass|ignore|waive)\b/.test(n)
      ) {
        return "Free-text intent to skip or waive required approval";
      }
      if (
        hasAny(n, [
          /\bskip(s|ped|ping)?\b/,
          /\bbypass(es|ed|ing)?\b/,
          /\bignor(e|es|ed|ing)\b/,
          /\bwaiv(e|es|ed|ing)\b/,
        ]) &&
        hasAny(n, APPROVAL_OBJECTS)
      ) {
        return "Free-text intent to skip or waive required approval";
      }
      if (/\bignore the approval process\b/.test(n)) {
        return "Free-text intent to ignore the approval process";
      }
      return null;
    },
  },
  {
    id: "governance_bypass",
    principleId: "S8-OWNER-APPROVAL",
    violation: true,
    match: (n) => {
      if (hasAny(n, BYPASS_ACTIONS) && hasAny(n, GOVERNANCE_OBJECTS)) {
        return "Free-text intent to skip or bypass governance";
      }
      if (/\bskip governance\b/.test(n) || /\bwithout governance\b/.test(n)) {
        return "Free-text intent to proceed without governance";
      }
      return null;
    },
  },
  {
    id: "compliance_bypass",
    principleId: "S0-OWNER-CONTROL",
    violation: true,
    match: (n) => {
      if (hasAny(n, BYPASS_ACTIONS) && hasAny(n, COMPLIANCE_OBJECTS)) {
        return "Free-text intent to override or skip constitutional compliance";
      }
      if (/\boverride constitutional checks?\b/.test(n)) {
        return "Free-text intent to override constitutional checks";
      }
      return null;
    },
  },
  {
    id: "review_bypass",
    principleId: "S8-OWNER-APPROVAL",
    violation: true,
    match: (n) => {
      if (hasAny(n, BYPASS_ACTIONS) && hasAny(n, REVIEW_OBJECTS)) {
        return "Free-text intent to skip mandatory / executive review";
      }
      if (/\bignore mandatory review\b/.test(n)) {
        return "Free-text intent to ignore mandatory review";
      }
      return null;
    },
  },
  {
    id: "decision_record_bypass",
    principleId: "S8-DECISION",
    violation: true,
    match: (n) => {
      if (
        /\b(don'?t|do not|never)\s+(record|log|write|persist)\b/.test(n) &&
        hasAny(n, RECORD_OBJECTS)
      ) {
        return "Free-text intent to suppress decision recording";
      }
      if (
        /\b(update|fix|backfill)\b/.test(n) &&
        hasAny(n, RECORD_OBJECTS) &&
        /\blater\b/.test(n)
      ) {
        return "Free-text intent to defer or backfill decision records later";
      }
      return null;
    },
  },
  {
    id: "accountability_secrecy",
    principleId: "S14-NO-MANIPULATION",
    violation: true,
    match: (n) => {
      if (/\bdo (this|it|that) privately\b/.test(n) || /\bkeep (this|it) private\b/.test(n)) {
        return "Free-text intent to conceal executive action from accountability";
      }
      if (
        /\b(don'?t|do not)\s+tell\b/.test(n) &&
        /\b(anyone|anybody|them|others|the board|grand king)\b/.test(n)
      ) {
        return "Free-text intent to suppress disclosure / accountability";
      }
      if (/\boff the record\b/.test(n) || /\bno paper trail\b/.test(n)) {
        return "Free-text intent to avoid accountable record of action";
      }
      return null;
    },
  },
  {
    id: "fabricated_authorisation",
    principleId: "S0-NON-FABRICATION",
    violation: true,
    match: (n) => {
      if (
        /\bpretend\b/.test(n) &&
        /\b(already )?(approved|authori[sz]ed|authorisation|authorization)\b/.test(n)
      ) {
        return "Free-text intent to fabricate prior approval";
      }
      if (
        /\bact as if\b/.test(n) &&
        /\b(already )?(authori[sz]ed|approved|the owner|grand king)\b/.test(n)
      ) {
        return "Free-text intent to assume fabricated authorisation";
      }
      if (
        /\b(i |we )?(already )?authori[sz]e(d|s)? you\b/.test(n) &&
        /\b(verbally|orally|without|skip|just do)\b/.test(n)
      ) {
        return "Free-text verbal authorisation claim without approval artifact";
      }
      if (/\bclaims? (to have )?approval\b/.test(n) && /\bwithout\b/.test(n)) {
        return "Free-text approval claim without verified artifact";
      }
      return null;
    },
  },
  {
    id: "exception_plea",
    principleId: "S0-OWNER-CONTROL",
    violation: true,
    match: (n) => {
      if (
        /\bjust this once\b/.test(n) &&
        (hasAny(n, CONSTITUTION_OBJECTS) ||
          hasAny(n, OWNER_OBJECTS) ||
          hasAny(n, APPROVAL_OBJECTS) ||
          hasAny(n, GOVERNANCE_OBJECTS) ||
          hasAny(n, COMPLIANCE_OBJECTS))
      ) {
        return "One-time exception plea against constitutional / owner governance";
      }
      if (
        /\bi know\b/.test(n) &&
        hasAny(n, CONSTITUTION_OBJECTS) &&
        /\b(but|however|anyway|still)\b/.test(n)
      ) {
        return "Acknowledged constitutional prohibition with request to proceed anyway";
      }
      return null;
    },
  },
];

/**
 * Detect free-text constitutional governance bypass / fabrication / secrecy intent.
 * Safe on empty input. Does not replace structured compliance flags.
 */
export function detectConstitutionalIntent(
  recommendation: string | undefined | null,
): ConstitutionalIntentDetection {
  const raw = recommendation?.trim() ?? "";
  if (!raw) {
    return {
      detected: false,
      requiresGrandKingApproval: false,
      isViolation: false,
      matches: [],
      summary: "No recommendation text to interpret",
    };
  }

  const normalized = normalizeConstitutionalText(raw);
  const matches: ConstitutionalIntentMatch[] = [];

  for (const family of INTENT_FAMILIES) {
    const rationale = family.match(normalized);
    if (!rationale) continue;
    matches.push({
      familyId: family.id,
      principleId: family.principleId,
      rationale,
    });
  }

  // De-duplicate by family
  const unique = new Map<string, ConstitutionalIntentMatch>();
  for (const m of matches) {
    if (!unique.has(m.familyId)) unique.set(m.familyId, m);
  }
  const deduped = [...unique.values()];
  const detected = deduped.length > 0;
  const isViolation = detected; // all current families are hard governance conflicts
  const requiresGrandKingApproval = detected;

  return {
    detected,
    requiresGrandKingApproval,
    isViolation,
    matches: deduped,
    summary: detected
      ? `Constitutional governance intent detected: ${deduped.map((m) => m.familyId).join(", ")}`
      : "No constitutional bypass intent detected",
  };
}

/** Test helper — list registered family ids for extensibility checks. */
export function listConstitutionalIntentFamilyIds(): ConstitutionalIntentFamilyId[] {
  return INTENT_FAMILIES.map((f) => f.id);
}
