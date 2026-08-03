import type { PeerReviewRuntimeConfiguration } from "./configuration.js";
import type {
  EscalationStatus,
  ImpactLevel,
  IndependentReview,
  PeerReviewRuntimeInput,
  ReviewFinding,
  ReviewOutcome,
  ReviewerCandidate,
} from "./types.js";

export type ReviewBundle = {
  peerReviewRequired: boolean;
  selectedReviewers: string[];
  independentReviews: IndependentReview[];
  findings: ReviewFinding[];
  agreementLevel: number;
  issuesFound: string[];
  requiredRevisions: string[];
  disagreements: string[];
  outcome: ReviewOutcome;
  escalationStatus: EscalationStatus;
  impactLevel: ImpactLevel | string;
};

/** Pure peer-review coordination helpers for Q0-21. */
export class PeerReviewResolver {
  normalizeImpact(value: string | null | undefined): ImpactLevel {
    const normalized = (value ?? "medium").toString().trim().toLowerCase();
    if (normalized === "low" || normalized === "medium" || normalized === "high" || normalized === "critical") {
      return normalized;
    }
    return "medium";
  }

  isReviewRequired(
    impact: ImpactLevel,
    config: PeerReviewRuntimeConfiguration,
    skipReview = false,
  ): boolean {
    if (skipReview) return false;
    if (impact === "critical") return config.criticalImpactRequiresReview;
    if (impact === "high") return config.highImpactRequiresReview;
    return impact === "medium";
  }

  selectReviewers(
    originalWorker: string,
    candidates: ReviewerCandidate[],
    config: PeerReviewRuntimeConfiguration,
    limit = 2,
  ): ReviewerCandidate[] {
    return [...candidates]
      .filter(
        (c) =>
          c.available &&
          c.workerId !== originalWorker &&
          c.qualificationScore >= config.minReviewerQualification,
      )
      .sort((a, b) => b.qualificationScore - a.qualificationScore)
      .slice(0, Math.max(1, limit));
  }

  synthesizeIndependentReviews(
    input: PeerReviewRuntimeInput,
    selected: ReviewerCandidate[],
    config: PeerReviewRuntimeConfiguration,
  ): IndependentReview[] {
    if (input.independentReviews && input.independentReviews.length > 0) {
      return input.independentReviews.map((ir) => ({
        ...ir,
        findings: [...(ir.findings ?? [])],
        issues: [...(ir.issues ?? [])],
        criteriaScores: { ...(ir.criteriaScores ?? {}) },
        agreementScore: clamp(ir.agreementScore),
      }));
    }

    return selected.map((reviewer, index) => {
      const base = Math.min(95, reviewer.qualificationScore + (index === 0 ? 2 : -4));
      const issues =
        base < config.minAgreementForApproval
          ? [`quality_gap:${reviewer.workerId}`]
          : [];
      const findings =
        issues.length > 0
          ? [`Reviewer ${reviewer.workerId} identified revision needs`]
          : [`Reviewer ${reviewer.workerId} found output acceptable`];
      const recommendedOutcome: ReviewOutcome =
        base >= config.minAgreementForApproval + 10
          ? "approved"
          : base >= config.minAgreementForApproval
            ? "approved_with_notes"
            : "revision_required";
      const criteriaScores: IndependentReview["criteriaScores"] = {};
      for (const criterion of config.reviewCriteria) {
        criteriaScores[criterion] = clamp(base - (criterion === "risk" ? 3 : 0));
      }
      return {
        reviewerId: reviewer.workerId,
        recommendedOutcome,
        agreementScore: clamp(base),
        findings,
        issues,
        criteriaScores,
      };
    });
  }

  detectDisagreements(reviews: IndependentReview[]): string[] {
    const disagreements: string[] = [];
    if (reviews.length < 2) return disagreements;
    const outcomes = unique(reviews.map((r) => String(r.recommendedOutcome)));
    if (outcomes.length > 1) {
      disagreements.push(`outcome_disagreement:${outcomes.join("|")}`);
    }
    for (let i = 0; i < reviews.length; i += 1) {
      for (let j = i + 1; j < reviews.length; j += 1) {
        const left = reviews[i]!;
        const right = reviews[j]!;
        if (Math.abs(left.agreementScore - right.agreementScore) >= 20) {
          disagreements.push(`agreement_gap:${left.reviewerId}|${right.reviewerId}`);
        }
      }
    }
    return disagreements;
  }

  resolve(input: PeerReviewRuntimeInput, config: PeerReviewRuntimeConfiguration): ReviewBundle {
    const impact = this.normalizeImpact(input.impactLevel);
    const originalWorker = input.originalWorker?.trim() || "worker-unspecified";
    const candidates = (input.reviewerCandidates ?? []).map((c) => ({
      ...c,
      specialties: [...(c.specialties ?? [])],
    }));

    if (input.forceEscalate === true) {
      return {
        peerReviewRequired: true,
        selectedReviewers: [],
        independentReviews: [],
        findings: [
          {
            criterion: "executive_readiness",
            summary: "Forced escalation to Pillow before peer consensus",
            severity: "high",
          },
        ],
        agreementLevel: 0,
        issuesFound: ["forced_escalation"],
        requiredRevisions: [],
        disagreements: ["forced_escalation"],
        outcome: "escalated",
        escalationStatus: "escalated_to_pillow",
        impactLevel: impact,
      };
    }

    const required = this.isReviewRequired(impact, config, input.skipReview === true);
    if (!required) {
      return {
        peerReviewRequired: false,
        selectedReviewers: [],
        independentReviews: [],
        findings: [
          {
            criterion: "quality",
            summary: "Peer review not required for this impact level",
            severity: "low",
          },
        ],
        agreementLevel: 100,
        issuesFound: [],
        requiredRevisions: [],
        disagreements: [],
        outcome: "approved",
        escalationStatus: "not_required",
        impactLevel: impact,
      };
    }

    const selected = this.selectReviewers(originalWorker, candidates, config);
    if (selected.length === 0) {
      return {
        peerReviewRequired: true,
        selectedReviewers: [],
        independentReviews: [],
        findings: [
          {
            criterion: "executive_readiness",
            summary: "No qualified independent reviewers available",
            severity: "critical",
          },
        ],
        agreementLevel: 0,
        issuesFound: ["no_qualified_reviewers"],
        requiredRevisions: [],
        disagreements: ["no_qualified_reviewers"],
        outcome: "escalated",
        escalationStatus: "escalated_to_pillow",
        impactLevel: impact,
      };
    }

    const independentReviews = this.synthesizeIndependentReviews(input, selected, config);
    const disagreements = this.detectDisagreements(independentReviews);
    const issuesFound = unique(independentReviews.flatMap((r) => r.issues));
    const agreementLevel =
      independentReviews.reduce((sum, r) => sum + r.agreementScore, 0) /
      Math.max(1, independentReviews.length);

    const findings: ReviewFinding[] = [];
    for (const criterion of config.reviewCriteria) {
      const scores = independentReviews
        .map((r) => r.criteriaScores[criterion])
        .filter((s): s is number => typeof s === "number");
      const avg = scores.length
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : agreementLevel;
      findings.push({
        criterion,
        summary:
          avg >= config.minAgreementForApproval
            ? `${criterion} acceptable across reviewers`
            : `${criterion} below approval threshold`,
        severity: avg >= config.minAgreementForApproval ? "low" : avg >= 50 ? "medium" : "high",
      });
    }

    let outcome: ReviewOutcome;
    let escalationStatus: EscalationStatus = "not_required";
    let requiredRevisions: string[] = [];

    if (input.forceRevision === true) {
      outcome = "revision_required";
      requiredRevisions = [
        "Address peer review findings before Pillow acceptance",
        ...issuesFound.map((i) => `Resolve issue: ${i}`),
      ];
    } else if (disagreements.length >= config.disagreementEscalationThreshold) {
      outcome = "escalated";
      escalationStatus = "escalated_to_pillow";
    } else if (
      independentReviews.some((r) => r.recommendedOutcome === "rejected") ||
      agreementLevel < 40
    ) {
      outcome = "rejected";
      requiredRevisions = ["Rebuild output against rejected peer review findings"];
    } else if (
      independentReviews.some((r) => r.recommendedOutcome === "revision_required") ||
      agreementLevel < config.minAgreementForApproval ||
      issuesFound.length > 0
    ) {
      outcome = "revision_required";
      requiredRevisions = [
        "Revise output to resolve peer review issues",
        ...issuesFound.map((i) => `Fix: ${i}`),
      ];
    } else if (
      independentReviews.some((r) => r.recommendedOutcome === "approved_with_notes") ||
      agreementLevel < config.minAgreementForApproval + 10
    ) {
      outcome = "approved_with_notes";
    } else {
      outcome = "approved";
    }

    return {
      peerReviewRequired: true,
      selectedReviewers: selected.map((s) => s.workerId),
      independentReviews,
      findings,
      agreementLevel: clamp(agreementLevel),
      issuesFound,
      requiredRevisions: unique(requiredRevisions),
      disagreements,
      outcome,
      escalationStatus,
      impactLevel: impact,
    };
  }
}

function clamp(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}
