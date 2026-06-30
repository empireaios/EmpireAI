import { randomUUID } from "node:crypto";
import { escalatePriority } from "./priority-engine.js";
import type {
  DueDiligenceRecommendation,
  OpportunityKind,
  RecommendationPriority,
  ReviewCategory,
  ReviewFinding,
} from "./types.js";

const CATEGORY_TO_KIND: Partial<Record<ReviewCategory, OpportunityKind>> = {
  architecture_review: "architecture_improvement",
  commercial_review: "commercial_opportunity",
  repository_review: "repository_improvement",
  mission_review: "mission_improvement",
  automation_review: "automation_opportunity",
  governance_review: "workflow_improvement",
  performance_review: "performance_optimization",
  scalability_review: "future_product_opportunity",
  repository_drift_review: "repository_improvement",
  risk_review: "engineering_simplification",
  dependency_review: "engineering_simplification",
  security_review: "architecture_improvement",
};

const CATEGORY_OWNERS: Partial<Record<ReviewCategory, string[]>> = {
  architecture_review: ["Pillow Architecture"],
  repository_review: ["Repository Governance", "Journey"],
  mission_review: ["Mission Planner", "Cursor Supervisor"],
  commercial_review: ["Commercial Intelligence", "Project Status"],
  governance_review: ["Repository Governance", "Decision Register"],
  repository_drift_review: ["Repository Synchronizer", "Journey"],
};

export function findingsToRecommendations(
  findings: ReviewFinding[],
  context: { healthScore?: number; syncRequired?: boolean },
  max = 25,
): DueDiligenceRecommendation[] {
  const recs: DueDiligenceRecommendation[] = [];

  for (const finding of findings) {
    const priority = escalatePriority(finding, context);
    const kind = CATEGORY_TO_KIND[finding.category] ?? "architecture_improvement";
    const owners =
      CATEGORY_OWNERS[finding.category] ??
      inferOwners(finding.evidence);

    recs.push({
      id: randomUUID(),
      priority,
      kind,
      reason: finding.summary,
      evidence: finding.evidence,
      affectedOwners: owners,
      expectedBenefit: benefitForCategory(finding.category),
      estimatedImpact: impactFromPriority(priority),
      recommendedAction: actionForCategory(finding.category, finding.summary),
      requiresGrandKingApproval: true,
    });
  }

  return recs.slice(0, max);
}

function inferOwners(evidence: string[]): string[] {
  const owners = new Set<string>();
  for (const e of evidence) {
    if (/JOURNEY/i.test(e)) owners.add("Journey");
    if (/STATUS/i.test(e)) owners.add("Project Status");
    if (/PILLOW/i.test(e)) owners.add("Pillow Architecture");
    if (/REAL-|commercial/i.test(e)) owners.add("Commercial Intelligence");
  }
  return owners.size > 0 ? [...owners] : ["Repository Governance"];
}

function benefitForCategory(category: ReviewCategory): string {
  const map: Record<ReviewCategory, string> = {
    architecture_review: "Reduce architectural drift and simplify future missions",
    risk_review: "Mitigate engineering and operational risk before escalation",
    repository_review: "Improve repository continuity and governance accuracy",
    dependency_review: "Unblock mission progression and reduce cascade failures",
    mission_review: "Accelerate correct next-mission selection",
    governance_review: "Strengthen executive governance and audit trail",
    commercial_review: "Advance commercial readiness toward PROOF-001",
    security_review: "Reduce exposure before Go-Live",
    performance_review: "Improve runtime and developer iteration speed",
    automation_review: "Reduce manual intervention and Cursor stall recovery",
    scalability_review: "Prepare EmpireAI for growth beyond V1",
    repository_drift_review: "Eliminate Journey/Status/governance drift",
  };
  return map[category];
}

function impactFromPriority(
  p: RecommendationPriority,
): DueDiligenceRecommendation["estimatedImpact"] {
  if (p === "critical") return "critical";
  if (p === "high") return "high";
  if (p === "normal") return "medium";
  return "low";
}

function actionForCategory(category: ReviewCategory, summary: string): string {
  return `Review ${category.replace(/_/g, " ")}: ${summary.slice(0, 120)} — Grand King approval required before execution`;
}
