import type {
  AuditSummary,
  CertificationSummary,
  DeploymentRecommendation,
  ExecutiveChecklistItem,
  ProductionReadinessSummary,
  Q1109ContractConsumption,
  ReadinessClassification,
  RiskSummary,
} from "./types.js";

export function generateExecutiveSummary(input: {
  certificationSummary: CertificationSummary;
  auditSummary: AuditSummary;
  productionReadinessSummary: ProductionReadinessSummary;
  decision: string;
  q1109ContractConsumed: Q1109ContractConsumption;
}): string {
  const finartStatus = input.q1109ContractConsumed.consumed
    ? "Q11-08 Financial Readiness Audit contract consumed"
    : input.q1109ContractConsumed.attempted
      ? "Q11-08 Financial Readiness Audit contract attempted but not consumable"
      : "Q11-08 Financial Readiness Audit not implemented / not injected";
  return [
    `Executive Acceptance Pack Q11-09 aggregates ${input.certificationSummary.boundCount}/${input.certificationSummary.totalSources} certification sources and ${input.auditSummary.boundCount}/${input.auditSummary.totalSources} audit sources.`,
    `Production readiness evidence: ${input.productionReadinessSummary.evidencePresentCount}/${input.productionReadinessSummary.totalSources} sources with structural evidence.`,
    `Prior gate: ${finartStatus}.`,
    `Overall pack decision: ${input.decision}. Grand King retains final production deployment authority.`,
  ].join(" ");
}

export function generateOutstandingIssueSummary(input: {
  certificationSummary: CertificationSummary;
  auditSummary: AuditSummary;
  productionReadinessSummary: ProductionReadinessSummary;
  q1109ContractConsumed: Q1109ContractConsumption;
}): string[] {
  const issues: string[] = [];

  if (!input.q1109ContractConsumed.consumed) {
    issues.push(
      input.q1109ContractConsumed.evidence ||
        "Q11-08 Financial Readiness Audit prior gate missing or not consumable",
    );
  }

  for (const ref of input.certificationSummary.reports) {
    if (ref.classification === "failed") {
      issues.push(`${ref.source}: certification failed — ${ref.evidence.join("; ")}`);
    } else if (ref.classification === "missing") {
      issues.push(`${ref.source}: certification evidence missing — ${ref.evidence.join("; ")}`);
    } else if (ref.classification === "partially_certified") {
      issues.push(`${ref.source}: partially certified — ${ref.evidence.join("; ")}`);
    } else if (ref.classification === "blocked") {
      issues.push(`${ref.source}: blocked — ${ref.evidence.join("; ")}`);
    }
  }

  for (const ref of input.auditSummary.reports) {
    if (ref.classification === "failed") {
      issues.push(`${ref.source}: audit failed — ${ref.evidence.join("; ")}`);
    } else if (ref.classification === "missing") {
      issues.push(`${ref.source}: audit evidence missing — ${ref.evidence.join("; ")}`);
    } else if (ref.classification === "partially_certified") {
      issues.push(`${ref.source}: partially certified — ${ref.evidence.join("; ")}`);
    } else if (ref.classification === "blocked") {
      issues.push(`${ref.source}: blocked — ${ref.evidence.join("; ")}`);
    }
  }

  if (input.productionReadinessSummary.overallClassification !== "certified") {
    issues.push(
      `Production readiness evidence incomplete: classification=${input.productionReadinessSummary.overallClassification}`,
    );
  }

  return issues;
}

export function generateDeploymentRecommendation(input: {
  decision: string;
  outstandingIssues: string[];
}): DeploymentRecommendation {
  const now = new Date().toISOString();
  let recommendation: DeploymentRecommendation["recommendation"] = "withhold";
  if (input.decision === "certify") recommendation = "deploy";
  else if (input.decision === "escalate") recommendation = "escalate";
  else if (input.decision === "defer") recommendation = "defer";

  return {
    computedAt: now,
    recommendation,
    rationale: [
      "Executive Acceptance Pack recommends only — Grand King decides production deployment",
      `Pack decision=${input.decision}`,
      ...input.outstandingIssues.slice(0, 5).map((issue) => `Outstanding: ${issue}`),
    ],
    grandKingDecisionRequired: true,
    evidence: [`recommendation=${recommendation}`, `decision=${input.decision}`],
  };
}

export function classifyProductionReadiness(input: {
  certificationSummary: CertificationSummary;
  auditSummary: AuditSummary;
  productionReadinessSummary: ProductionReadinessSummary;
  q1109ContractConsumed: Q1109ContractConsumption;
}): ReadinessClassification {
  if (!input.q1109ContractConsumed.consumed) return "blocked";
  if (input.auditSummary.failedCount > 0 || input.certificationSummary.failedCount > 0) return "failed";
  if (input.auditSummary.missingCount > 0 || input.certificationSummary.missingCount > 0) return "missing";
  if (input.auditSummary.blockedCount > 0 || input.certificationSummary.blockedCount > 0) return "blocked";
  if (
    input.auditSummary.partiallyCertifiedCount > 0 ||
    input.certificationSummary.partiallyCertifiedCount > 0 ||
    input.productionReadinessSummary.overallClassification === "partially_certified"
  ) {
    return "partially_certified";
  }
  if (
    input.auditSummary.certifiedCount === input.auditSummary.boundCount &&
    input.certificationSummary.certifiedCount === input.certificationSummary.boundCount &&
    input.productionReadinessSummary.overallClassification === "certified"
  ) {
    return "certified";
  }
  return "partially_certified";
}

export function produceExecutiveChecklist(input: {
  certificationSummary: CertificationSummary;
  auditSummary: AuditSummary;
  productionReadinessSummary: ProductionReadinessSummary;
  q1109ContractConsumed: Q1109ContractConsumption;
}): ExecutiveChecklistItem[] {
  const items: ExecutiveChecklistItem[] = [];
  let seq = 0;
  const nextId = () => `chk-${String(++seq).padStart(3, "0")}`;

  items.push({
    itemId: nextId(),
    category: "prior_gate",
    label: "Q11-08 Financial Readiness Audit consumable contract",
    status: input.q1109ContractConsumed.consumed ? "certified" : "missing",
    evidence: [input.q1109ContractConsumed.evidence],
  });

  for (const ref of input.certificationSummary.reports) {
    items.push({
      itemId: nextId(),
      category: "certification",
      label: `${ref.source} certification report`,
      status: ref.classification,
      evidence: ref.evidence,
    });
  }

  for (const ref of input.auditSummary.reports) {
    items.push({
      itemId: nextId(),
      category: "audit",
      label: `${ref.source} audit report`,
      status: ref.classification,
      evidence: ref.evidence,
    });
  }

  for (const ref of input.productionReadinessSummary.sources) {
    items.push({
      itemId: nextId(),
      category: "readiness",
      label: `${ref.source} production readiness evidence`,
      status: ref.evidencePresent ? "certified" : ref.bound ? "partially_certified" : "missing",
      evidence: ref.evidence,
    });
  }

  items.push({
    itemId: nextId(),
    category: "governance",
    label: "Grand King final production deployment authority preserved",
    status: "certified",
    evidence: ["Executive Acceptance Pack never approves production deployment directly"],
  });

  return items;
}

export function buildRiskSummary(outstandingIssues: string[]): RiskSummary {
  const now = new Date().toISOString();
  const criticalRisks = outstandingIssues.filter(
    (issue) =>
      issue.includes("failed") ||
      issue.includes("Financial Readiness") ||
      issue.includes("not implemented") ||
      issue.includes("not consumable"),
  );
  const moderateRisks = outstandingIssues.filter(
    (issue) => issue.includes("partially") || issue.includes("blocked"),
  );
  const lowRisks = outstandingIssues.filter(
    (issue) => !criticalRisks.includes(issue) && !moderateRisks.includes(issue),
  );
  return {
    computedAt: now,
    totalRisks: outstandingIssues.length,
    criticalRisks,
    moderateRisks,
    lowRisks,
    evidence: outstandingIssues.slice(0, 10),
  };
}

export function computeConfidenceScore(input: {
  certificationSummary: CertificationSummary;
  auditSummary: AuditSummary;
  productionReadinessSummary: ProductionReadinessSummary;
  q1109ContractConsumed: Q1109ContractConsumption;
}): number {
  const certTotal = Math.max(input.certificationSummary.totalSources, 1);
  const auditTotal = Math.max(input.auditSummary.totalSources, 1);
  const certScore = input.certificationSummary.certifiedCount / certTotal;
  const auditScore = input.auditSummary.certifiedCount / auditTotal;
  const readinessScore =
    input.productionReadinessSummary.evidencePresentCount /
    Math.max(input.productionReadinessSummary.totalSources, 1);
  const priorGateScore = input.q1109ContractConsumed.consumed ? 1 : 0;
  const raw = (certScore + auditScore + readinessScore + priorGateScore) / 4;
  return Math.round(Math.min(1, Math.max(0, raw)) * 100) / 100;
}
