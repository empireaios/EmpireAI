/**
 * Canonical fact-precedence for bounded Pillow tasks.
 *
 * A Explicit facts supplied by the current bounded task
 * B Persisted authoritative operating state
 * C Deterministic derivations from A and B
 * D Retrieved external/live facts (only when required)
 * E LLM prose
 * F Safety/status appenders (may restrict actions; must not rewrite A–C)
 */
export type FactPrecedenceTier = "A" | "B" | "C" | "D" | "E" | "F";

export type SuppliedContributionFact = {
  label: string;
  amountUsd: number;
  raw: string;
  tier: "A";
};

export type CanonicalOperatingProjection = {
  operatingMode: "SYNTHETIC";
  birthStatus: "NOT_BORN";
  realCommerceAuthorized: false;
  realCommerceAuthorityLabel: "unauthorized";
  tier: "B";
};

/** Tier-B defaults — Birth unauthorized, real commerce locked. */
export function canonicalOperatingProjection(): CanonicalOperatingProjection {
  return {
    operatingMode: "SYNTHETIC",
    birthStatus: "NOT_BORN",
    realCommerceAuthorized: false,
    realCommerceAuthorityLabel: "unauthorized",
    tier: "B",
  };
}

/**
 * Extract explicitly supplied contribution amounts from the current task text.
 * A supplied contribution is already a contribution — do not require selling price.
 * Excludes response-template totals (Total/Cumulative synthetic contribution: …).
 */
export function extractSuppliedContributionFacts(
  message: string,
): SuppliedContributionFact[] {
  const t = String(message || "");
  const out: SuppliedContributionFact[] = [];
  const seen = new Set<string>();

  const patterns: RegExp[] = [
    // Order A contribution: US$4.20
    /\b((?:Order\s+)?[A-Za-z0-9][A-Za-z0-9_-]{0,24})\s+contribution\s*[:=]\s*(?:US\$|USD\s*|S\$|SGD\s*|\$)\s*(-?\d+(?:\.\d+)?)/gi,
    // contribution for Order A: US$4.20
    /\bcontribution\s+(?:for|of)\s+((?:Order\s+)?[A-Za-z0-9][A-Za-z0-9_-]{0,24})\s*[:=]?\s*(?:US\$|USD\s*|S\$|SGD\s*|\$)\s*(-?\d+(?:\.\d+)?)/gi,
    // A: contribution US$4.20
    /\b([A-Za-z](?:Order)?)\s*[:\-]\s*contribution\s+(?:US\$|USD\s*|S\$|SGD\s*|\$)\s*(-?\d+(?:\.\d+)?)/gi,
  ];

  const excludeLabel =
    /^(?:total|cumulative|aggregate|sum|grand\s*total|checkpoint|operating|real-?commerce)/i;

  for (const re of patterns) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(t)) !== null) {
      const label = String(m[1] || "").trim();
      const amountUsd = Number(m[2]);
      if (!label || !Number.isFinite(amountUsd)) continue;
      if (excludeLabel.test(label)) continue;
      if (/^synthetic$/i.test(label)) continue;
      // Drop response-template totals: "Total synthetic contribution: US$…"
      if (/\btotal\b|\bcumulative\b|\baggregate\b/i.test(m[0])) continue;
      const before = t.slice(Math.max(0, m.index! - 24), m.index!);
      if (/\btotal\b/i.test(before)) continue;
      const key = `${label.toLowerCase()}::${amountUsd.toFixed(2)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        label,
        amountUsd,
        raw: m[0],
        tier: "A",
      });
    }
  }

  return out;
}

export function sumSuppliedContributionsUsd(
  facts: SuppliedContributionFact[],
): number | null {
  if (facts.length === 0) return null;
  const sum = facts.reduce((a, f) => a + f.amountUsd, 0);
  return Math.round((sum + Number.EPSILON) * 100) / 100;
}

/**
 * True when the ask is aggregation/total of already-supplied contribution facts,
 * not a unit-economics compute from price/cost/fee.
 */
export function isSuppliedContributionAggregationAsk(message: string): boolean {
  const t = String(message || "");
  const facts = extractSuppliedContributionFacts(t);
  if (facts.length < 1) return false;

  const asksTotal =
    /\b(?:total|sum|aggregate|cumulative)\b/i.test(t) &&
    /\bcontribution\b/i.test(t);
  const asksExactContract =
    /\b(?:exactly\s+\d+\s+lines?|checkpoint\s+token|response\s+contract)\b/i.test(t);

  // Explicit compute-from-price cues → unit-econ path owns it.
  const asksUnitEconCompute =
    /\b(?:selling\s+)?price\b/i.test(t) &&
    /\b(?:cost|supplier|COGS|fee|shipping)\b/i.test(t) &&
    /\b(?:compute|calculate|unit economics)\b/i.test(t);

  if (asksUnitEconCompute) return false;
  return asksTotal || asksExactContract || facts.length >= 2;
}

export function formatUsdContribution(n: number): string {
  return `US$${n.toFixed(2)}`;
}

/**
 * Conflicting authority: typed error string for visible fail-closed paths.
 * Never emit contradictory prose.
 */
export function factPrecedenceConflictError(
  field: string,
  owners: string[],
): string {
  return `FACT_PRECEDENCE_CONFLICT: field=${field}; competing_owners=${owners.join("|")}`;
}
