import { nextAssetId } from "./compliance-store.js";
import type {
  AcwInput,
  AnalyticsFixture,
  CheckStatus,
  ComplianceEvidenceSnapshot,
  ComplianceRisk,
  ComplianceScope,
  DisclaimerValidation,
  DisclosureValidation,
  FindingSeverity,
  OpportunityFixture,
  PlatformRuleValidation,
  PolicyFinding,
  ReadinessAssessment,
  ReadinessStatus,
  RecommendedCorrection,
  ReviewFixture,
  SeoFixture,
} from "./types.js";

export function resolveOpportunity(input: AcwInput): OpportunityFixture | null {
  return input.opportunityReport ?? input.fixtureOpportunity ?? null;
}

export function resolveReview(input: AcwInput): ReviewFixture | null {
  return input.reviewReport ?? input.fixtureReview ?? null;
}

export function resolveSeo(input: AcwInput): SeoFixture | null {
  return input.seoReport ?? input.fixtureSeo ?? null;
}

export function resolveAnalytics(input: AcwInput): AnalyticsFixture | null {
  return input.analyticsReport ?? input.fixtureAnalytics ?? null;
}

export function resolveEvidence(input: AcwInput): ComplianceEvidenceSnapshot {
  return { ...(input.complianceEvidence ?? input.fixtureEvidence ?? {}) };
}

function bool(value: boolean | null | undefined): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function textPresent(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function checkFromBool(value: boolean | null, evidenced: boolean): CheckStatus {
  if (!evidenced || value == null) return "unknown";
  return value ? "pass" : "fail";
}

export function buildComplianceScope(
  affiliateProjectId: string,
  evidence: ComplianceEvidenceSnapshot,
  frameworks: string[],
): ComplianceScope {
  const platform = evidence.platform?.trim() || null;
  return {
    scopeId: nextAssetId("scope"),
    affiliateProjectId,
    platforms: platform ? [platform] : [],
    frameworks: frameworks.length
      ? [...frameworks]
      : ["affiliate_disclosure", "platform_policy", "required_disclaimer"],
    evidencePresent: Boolean(platform || frameworks.length || evidence.disclosurePresent != null),
    fabricated: false,
  };
}

export function buildDisclosureValidation(
  evidence: ComplianceEvidenceSnapshot,
  review: ReviewFixture | null,
  seo: SeoFixture | null,
): DisclosureValidation {
  const disclosurePresent =
    bool(evidence.disclosurePresent) ??
    bool(review?.disclosurePresent) ??
    bool(seo?.hasDisclosureSection) ??
    bool(evidence.seoHasDisclosureSection);
  const disclosureTextObserved = textPresent(evidence.disclosureText);
  const linkDisclosurePresent = bool(evidence.linkDisclosurePresent);
  const placement = evidence.disclosurePlacement ?? null;
  const evidencePresent =
    disclosurePresent != null ||
    disclosureTextObserved ||
    linkDisclosurePresent != null ||
    placement != null;
  const status = checkFromBool(disclosurePresent, evidencePresent);
  const notes: string[] = [];
  if (!evidencePresent) notes.push("Disclosure evidence not provided — status unknown");
  if (disclosurePresent === false) notes.push("Disclosure marked absent in evidence");
  if (disclosurePresent === true && !disclosureTextObserved) {
    notes.push("Disclosure flagged present without observed disclosure text");
  }
  if (placement === "missing") notes.push("Disclosure placement marked missing");
  return {
    validationId: nextAssetId("disc"),
    status:
      status === "pass" && (placement === "missing" || linkDisclosurePresent === false)
        ? "partial"
        : status,
    disclosurePresent,
    disclosureTextObserved,
    placement,
    linkDisclosurePresent,
    notes,
    fabricated: false,
    evidencePresent,
    legalConclusion: "not_legal_advice",
  };
}

export function buildPlatformRuleValidation(
  evidence: ComplianceEvidenceSnapshot,
): PlatformRuleValidation {
  const platform = evidence.platform?.trim() || null;
  const rulesAcknowledged = bool(evidence.platformRulesAcknowledged);
  const evidencePresent = platform != null || rulesAcknowledged != null;
  const status =
    !evidencePresent
      ? "unknown"
      : rulesAcknowledged === true && platform
        ? "pass"
        : rulesAcknowledged === false
          ? "fail"
          : "partial";
  const notes: string[] = [];
  if (!platform) notes.push("Platform not evidenced");
  if (rulesAcknowledged == null) notes.push("Platform rule acknowledgement not evidenced");
  if (rulesAcknowledged === false) notes.push("Platform rules not acknowledged in evidence");
  return {
    validationId: nextAssetId("plat"),
    status,
    platform,
    rulesAcknowledged,
    notes,
    fabricated: false,
    evidencePresent,
    legalConclusion: "not_legal_advice",
  };
}

export function buildDisclaimerValidation(
  evidence: ComplianceEvidenceSnapshot,
): DisclaimerValidation {
  const requiredDisclaimerPresent = bool(evidence.requiredDisclaimerPresent);
  const disclaimerTextObserved = textPresent(evidence.disclaimerText);
  const evidencePresent = requiredDisclaimerPresent != null || disclaimerTextObserved;
  const status = checkFromBool(requiredDisclaimerPresent, evidencePresent);
  const notes: string[] = [];
  if (!evidencePresent) notes.push("Disclaimer evidence not provided — status unknown");
  if (requiredDisclaimerPresent === false) notes.push("Required disclaimer marked absent");
  if (requiredDisclaimerPresent === true && !disclaimerTextObserved) {
    notes.push("Disclaimer flagged present without observed disclaimer text");
  }
  return {
    validationId: nextAssetId("disclaim"),
    status:
      status === "pass" && !disclaimerTextObserved ? "partial" : status,
    requiredDisclaimerPresent,
    disclaimerTextObserved,
    notes,
    fabricated: false,
    evidencePresent,
    legalConclusion: "not_legal_advice",
  };
}

export function buildPolicyFindings(params: {
  disclosure: DisclosureValidation;
  platform: PlatformRuleValidation;
  disclaimer: DisclaimerValidation;
  evidence: ComplianceEvidenceSnapshot;
}): PolicyFinding[] {
  const findings: PolicyFinding[] = [];
  const push = (
    area: PolicyFinding["area"],
    severity: FindingSeverity,
    summary: string,
    evidencePresent: boolean,
  ) => {
    findings.push({
      findingId: nextAssetId("find"),
      area,
      severity,
      summary,
      evidencePresent,
      fabricated: false,
      legalConclusion: "not_legal_advice",
    });
  };

  if (params.disclosure.status === "fail") {
    push("disclosure", "critical", "Affiliate disclosure failed validation against evidence", true);
  } else if (params.disclosure.status === "partial") {
    push("disclosure", "medium", "Affiliate disclosure validation incomplete against evidence", true);
  } else if (params.disclosure.status === "unknown") {
    push("disclosure", "high", "Affiliate disclosure cannot be verified — evidence missing", false);
  }

  if (params.disclaimer.status === "fail") {
    push("disclaimer", "high", "Required disclaimer failed validation against evidence", true);
  } else if (params.disclaimer.status === "unknown") {
    push("disclaimer", "medium", "Required disclaimer cannot be verified — evidence missing", false);
  }

  if (params.platform.status === "fail") {
    push("platform", "high", "Platform policy acknowledgement failed against evidence", true);
  } else if (params.platform.status === "unknown") {
    push("platform", "medium", "Platform policy compliance cannot be verified — evidence missing", false);
  }

  if (params.evidence.linkDisclosurePresent === false) {
    push("link", "medium", "Link disclosure marked absent in evidence", true);
  }

  const prohibited = params.evidence.prohibitedClaimsDetected ?? [];
  for (const claim of prohibited) {
    if (typeof claim === "string" && claim.trim()) {
      push(
        "promotional_claim",
        "critical",
        `Potential prohibited promotional claim evidenced: ${claim.trim()}`,
        true,
      );
    }
  }

  if (
    params.evidence.contentMentionsAffiliateRelationship === false &&
    params.disclosure.disclosurePresent !== true
  ) {
    push(
      "content",
      "medium",
      "Content does not evidence affiliate relationship mention",
      true,
    );
  }

  return findings;
}

function severityWeight(severity: FindingSeverity): number {
  switch (severity) {
    case "critical":
      return 40;
    case "high":
      return 25;
    case "medium":
      return 15;
    case "low":
      return 5;
    case "info":
      return 1;
    default:
      return 10;
  }
}

export function buildComplianceRisks(findings: PolicyFinding[]): ComplianceRisk[] {
  return findings
    .filter((f) => f.severity === "critical" || f.severity === "high" || f.severity === "medium")
    .map((f) => ({
      riskId: nextAssetId("risk"),
      category: f.area,
      severity: f.severity,
      score: severityWeight(f.severity),
      detail: f.summary,
      evidencePresent: f.evidencePresent,
      fabricated: false,
      legalConclusion: "not_legal_advice" as const,
    }));
}

export function buildRecommendedCorrections(findings: PolicyFinding[]): RecommendedCorrection[] {
  const corrections: RecommendedCorrection[] = [];
  for (const finding of findings) {
    if (finding.severity === "info") continue;
    let recommendation = "Review evidenced compliance gap with programme requirements";
    if (finding.area === "disclosure") {
      recommendation =
        "Add a clear affiliate disclosure where readers can observe it before promotional claims";
    } else if (finding.area === "disclaimer") {
      recommendation = "Include the required disclaimer text evidenced by programme rules";
    } else if (finding.area === "platform") {
      recommendation = "Acknowledge and align content with evidenced platform programme rules";
    } else if (finding.area === "link") {
      recommendation = "Ensure affiliate links carry evidenced link-level disclosure where required";
    } else if (finding.area === "promotional_claim") {
      recommendation =
        "Remove or substantiate promotional claims flagged in evidence before publication review";
    }
    corrections.push({
      correctionId: nextAssetId("corr"),
      area: finding.area,
      recommendation,
      rationale: finding.summary,
      priority:
        finding.severity === "critical"
          ? "critical"
          : finding.severity === "high"
            ? "high"
            : finding.severity === "medium"
              ? "medium"
              : "low",
      fabricated: false,
      evidencePresent: finding.evidencePresent,
      legalConclusion: "not_legal_advice",
    });
  }
  return corrections;
}

export function buildReadinessAssessment(params: {
  disclosure: DisclosureValidation;
  platform: PlatformRuleValidation;
  disclaimer: DisclaimerValidation;
  findings: PolicyFinding[];
  risks: ComplianceRisk[];
}): ReadinessAssessment {
  const blockers: string[] = [];
  for (const finding of params.findings) {
    if (finding.severity === "critical" || finding.severity === "high") {
      blockers.push(finding.summary);
    }
  }
  if (params.disclosure.status === "fail" || params.disclosure.status === "unknown") {
    blockers.push("Disclosure validation not passed");
  }
  if (params.disclaimer.status === "fail") {
    blockers.push("Required disclaimer validation failed");
  }
  if (params.platform.status === "fail") {
    blockers.push("Platform rule validation failed");
  }

  const riskScore = params.risks.reduce((sum, r) => sum + (r.score ?? 0), 0);
  const evidenced =
    params.disclosure.evidencePresent ||
    params.platform.evidencePresent ||
    params.disclaimer.evidencePresent ||
    params.findings.some((f) => f.evidencePresent);

  let status: ReadinessStatus = "unknown";
  if (!evidenced) {
    status = "unknown";
  } else if (blockers.length > 0) {
    status = riskScore >= 40 ? "not_ready" : "needs_remediation";
  } else if (
    params.disclosure.status === "pass" &&
    params.disclaimer.status === "pass" &&
    (params.platform.status === "pass" || params.platform.status === "partial")
  ) {
    status = "approval_ready";
  } else {
    status = "ready_for_review";
  }

  return {
    assessmentId: nextAssetId("ready"),
    status,
    riskScore: evidenced ? riskScore : null,
    blockers: Array.from(new Set(blockers)),
    notes: [
      "Readiness is an evidence-based operational assessment only",
      "Does not publish content or provide legal advice",
      "Does not automatically approve non-compliant assets",
    ],
    fabricated: false,
    evidencePresent: evidenced,
    autoApproved: false,
    legalConclusion: "not_legal_advice",
  };
}

export function computeConfidence(params: {
  disclosureEvidenced: boolean;
  platformEvidenced: boolean;
  disclaimerEvidenced: boolean;
  hasOpportunity: boolean;
  hasReview: boolean;
  hasSeo: boolean;
  findingCount: number;
}): number {
  let score = 0;
  if (params.disclosureEvidenced) score += 0.25;
  if (params.platformEvidenced) score += 0.15;
  if (params.disclaimerEvidenced) score += 0.2;
  if (params.hasOpportunity) score += 0.1;
  if (params.hasReview) score += 0.15;
  if (params.hasSeo) score += 0.15;
  if (params.findingCount === 0 && params.disclosureEvidenced) score += 0;
  return Number(Math.min(1, score).toFixed(4));
}
