import type {
  EvidenceClass,
  EvidenceMode,
  EvidenceRecord,
  EvidencedValue,
  ResearchFixturePayload,
} from "./types.js";

let evidenceSeq = 0;

export function resetEvidenceSequenceForTesting() {
  evidenceSeq = 0;
}

export function nextEvidenceId(prefix = "lmrw-ev") {
  evidenceSeq += 1;
  return `${prefix}-${String(evidenceSeq).padStart(4, "0")}`;
}

export function normalizeEvidenceClass(value: unknown): EvidenceClass {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  if (raw === "verified" || raw === "estimated" || raw === "inference" || raw === "unknown") {
    return raw;
  }
  return "unknown";
}

export function normalizeEvidenceMode(value: unknown): EvidenceMode {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  if (raw === "fixture" || raw === "sandbox" || raw === "cached" || raw === "live") {
    return raw;
  }
  return "fixture";
}

export function unknownEvidenced(value = "unknown — no supporting evidence provided"): EvidencedValue {
  return { value, evidenceClass: "unknown" };
}

export function evidenced(
  value: string,
  evidenceClass: EvidenceClass = "unknown",
  explanation?: string,
): EvidencedValue {
  return { value, evidenceClass: normalizeEvidenceClass(evidenceClass), explanation };
}

/** Normalize fixture/sandbox/cached evidence payloads. Never invent claims when empty. */
export function normalizeFixturePayload(
  raw: ResearchFixturePayload | EvidenceRecord[] | null | undefined,
  fallbackMode: EvidenceMode = "fixture",
): ResearchFixturePayload | null {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    if (!raw.length) return null;
    return {
      evidence: raw.map((item) => normalizeEvidenceRecord(item, fallbackMode)),
      evidenceMode: fallbackMode,
    };
  }
  const mode = normalizeEvidenceMode(raw.evidenceMode ?? fallbackMode);
  return {
    demand: raw.demand ?? null,
    competitors: Array.isArray(raw.competitors)
      ? raw.competitors.map((c) => ({ ...c }))
      : null,
    pricing: raw.pricing ?? null,
    painPoints: Array.isArray(raw.painPoints) ? raw.painPoints.map((p) => ({ ...p })) : null,
    gaps: Array.isArray(raw.gaps) ? raw.gaps.map((g) => ({ ...g })) : null,
    opportunities: Array.isArray(raw.opportunities)
      ? raw.opportunities.map((o) => ({ ...o }))
      : null,
    attractiveness: raw.attractiveness ?? null,
    evidence: Array.isArray(raw.evidence)
      ? raw.evidence.map((e) => normalizeEvidenceRecord(e, mode))
      : null,
    customerSegments: Array.isArray(raw.customerSegments)
      ? raw.customerSegments.map(String)
      : null,
    risks: Array.isArray(raw.risks) ? raw.risks.map(String) : null,
    assumptions: Array.isArray(raw.assumptions) ? raw.assumptions.map(String) : null,
    unknowns: Array.isArray(raw.unknowns) ? raw.unknowns.map(String) : null,
    evidenceMode: mode,
  };
}

export function normalizeEvidenceRecord(
  item: Partial<EvidenceRecord> & { claim?: string; source?: string },
  mode: EvidenceMode,
): EvidenceRecord {
  const now = new Date().toISOString();
  return {
    evidenceId: item.evidenceId?.trim() || nextEvidenceId(),
    sourceReference: String(item.sourceReference ?? item.source ?? "unspecified").trim(),
    sourceType: String(item.sourceType ?? "research_input").trim(),
    sourceDate: item.sourceDate ?? null,
    retrievalTimestamp: item.retrievalTimestamp ?? now,
    geographicRelevance: String(item.geographicRelevance ?? "unspecified").trim(),
    serviceRelevance: String(item.serviceRelevance ?? "unspecified").trim(),
    evidenceStrength:
      item.evidenceStrength === "weak" ||
      item.evidenceStrength === "moderate" ||
      item.evidenceStrength === "strong"
        ? item.evidenceStrength
        : "unknown",
    confidenceLevel:
      typeof item.confidenceLevel === "number" && Number.isFinite(item.confidenceLevel)
        ? Math.max(0, Math.min(1, item.confidenceLevel))
        : 0,
    inferenceMade: item.inferenceMade === true,
    evidenceClass: normalizeEvidenceClass(item.evidenceClass),
    evidenceMode: normalizeEvidenceMode(item.evidenceMode ?? mode),
    claim: String(item.claim ?? "").trim() || "unspecified claim",
  };
}

export function resolveFixtureFromInput(input: {
  existingResearchEvidence?: ResearchFixturePayload | EvidenceRecord[] | null;
  fixtureEvidence?: ResearchFixturePayload | null;
}): ResearchFixturePayload | null {
  return (
    normalizeFixturePayload(input.fixtureEvidence, "fixture") ??
    normalizeFixturePayload(input.existingResearchEvidence, "fixture")
  );
}

export function hasObservableFixtureContent(fixture: ResearchFixturePayload | null): boolean {
  if (!fixture) return false;
  return Boolean(
    fixture.demand ||
      (fixture.competitors && fixture.competitors.length) ||
      fixture.pricing ||
      (fixture.painPoints && fixture.painPoints.length) ||
      (fixture.gaps && fixture.gaps.length) ||
      (fixture.opportunities && fixture.opportunities.length) ||
      fixture.attractiveness ||
      (fixture.evidence && fixture.evidence.length) ||
      (fixture.customerSegments && fixture.customerSegments.length),
  );
}
