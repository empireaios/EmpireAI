import type {
  BusinessManagementEvaluation,
  CompanyCreationPackage,
  CompanyOperationSnapshot,
  ContinuousOptimizationReport,
  EmpireCompany,
  EmpireOperatingSystemReport,
  EmpireReadinessCertification,
  EmpireScalingPlan,
  ExecutiveGovernanceReport,
} from "./types.js";

export function buildEmpireOperatingSystemReport(input: {
  portfolio: EmpireCompany[];
  creationPackages: CompanyCreationPackage[];
  operationSnapshots: CompanyOperationSnapshot[];
  managementEvaluations: BusinessManagementEvaluation[];
  optimizationReports: ContinuousOptimizationReport[];
  scalingPlan: EmpireScalingPlan;
  governance: ExecutiveGovernanceReport;
  readiness: EmpireReadinessCertification;
}): EmpireOperatingSystemReport {
  const recommendedActions: string[] = [];

  if (input.readiness.certificationLevel !== "production") {
    recommendedActions.push("Complete readiness gaps before autonomous company scaling");
  }

  for (const eval_ of input.managementEvaluations.slice(0, 2)) {
    if (eval_.autoRecommendations[0]) {
      recommendedActions.push(`${eval_.companyId}: ${eval_.autoRecommendations[0]}`);
    }
  }

  recommendedActions.push(...input.scalingPlan.scalingPriorities.slice(0, 1));
  recommendedActions.push(...input.governance.protectionActions.slice(0, 2));

  const executiveBrief = formatExecutiveBrief({ ...input, recommendedActions });

  return {
    version: "PILLOW-EOS-001",
    generatedAt: new Date().toISOString(),
    portfolio: input.portfolio,
    creationPackages: input.creationPackages,
    operationSnapshots: input.operationSnapshots,
    managementEvaluations: input.managementEvaluations,
    optimizationReports: input.optimizationReports,
    scalingPlan: input.scalingPlan,
    governance: input.governance,
    readiness: input.readiness,
    recommendedActions,
    executiveBrief,
  };
}

function formatExecutiveBrief(input: {
  portfolio: EmpireCompany[];
  creationPackages: CompanyCreationPackage[];
  operationSnapshots: CompanyOperationSnapshot[];
  managementEvaluations: BusinessManagementEvaluation[];
  scalingPlan: EmpireScalingPlan;
  governance: ExecutiveGovernanceReport;
  readiness: EmpireReadinessCertification;
  recommendedActions: string[];
}): string {
  const lines: string[] = [
    "--- Empire Operating System (PILLOW-EOS-001) ---",
    `Empire Readiness: ${input.readiness.overallReadinessScore}/100 (${input.readiness.certificationLevel})`,
    `Companies managed: ${input.portfolio.length}`,
    "",
    "### Portfolio",
    ...input.portfolio.map(
      (c) => `- ${c.name} (${c.status}) — ${c.productCatalog.length} product(s) · ${c.brand}`,
    ),
    "",
    "### Company Operations",
    ...input.operationSnapshots.map(
      (s) =>
        `- ${s.companyName}: est. revenue $${s.monthlyRevenueEstimateUsd}/mo · efficiency ${s.operationalEfficiencyScore}/100`,
    ),
    "",
    "### Autonomous Management",
    ...input.managementEvaluations.map(
      (e) => `- ${e.companyId}: health ${e.overallHealthScore}/100 · ${e.autoRecommendations[0]}`,
    ),
  ];

  if (input.creationPackages.length > 0) {
    lines.push("", "### Company Creation");
    for (const pkg of input.creationPackages.slice(0, 2)) {
      lines.push(`- ${pkg.brand} — readiness ${pkg.launchReadiness}`);
    }
  }

  lines.push(
    "",
    "### Empire Scaling",
    `Portfolio health: ${input.scalingPlan.portfolioHealthScore}/100`,
    ...input.scalingPlan.scalingPriorities.slice(0, 3).map((p) => `- ${p}`),
    "",
    "### Executive Governance",
    `Compliance: ${input.governance.overallComplianceScore}/100`,
    ...input.governance.checks.map((c) => `- ${c.domain}: ${c.status} (${c.score}/100)`),
    "",
    "### Empire Readiness Certification",
    input.readiness.summary,
    "",
    "### Recommended Actions",
    ...input.recommendedActions.map((a) => `- ${a}`),
  );

  return lines.join("\n");
}

export function certifyEmpireReadiness(input: {
  governance: ExecutiveGovernanceReport;
  scalingPlan: EmpireScalingPlan;
  managementEvaluations: BusinessManagementEvaluation[];
  creationReady: boolean;
}): EmpireReadinessCertification {
  const avgHealth =
    input.managementEvaluations.length > 0
      ? Math.round(
          input.managementEvaluations.reduce((s, e) => s + e.overallHealthScore, 0) /
            input.managementEvaluations.length,
        )
      : 50;

  const overallReadinessScore = Math.round(
    input.governance.overallComplianceScore * 0.35 +
    input.scalingPlan.portfolioHealthScore * 0.25 +
    avgHealth * 0.25 +
    (input.creationReady ? 15 : 0),
  );

  const businessCreationReady = input.creationReady && input.governance.overallComplianceScore >= 60;
  const businessOperationReady = avgHealth >= 65 && input.managementEvaluations.length >= 1;
  const scalingReady =
    input.scalingPlan.portfolioHealthScore >= 65 && input.scalingPlan.activeCompanies >= 1;
  const governanceReady = input.governance.overallComplianceScore >= 70;

  const allReady = businessCreationReady && businessOperationReady && scalingReady && governanceReady;
  const mostlyReady = businessCreationReady && businessOperationReady;

  const certificationLevel: EmpireReadinessCertification["certificationLevel"] = allReady
    ? "production"
    : mostlyReady
      ? "conditional"
      : "not_ready";

  const summary = allReady
    ? "EmpireAI certified for autonomous multi-business creation, operation, and scaling"
    : mostlyReady
      ? "EmpireAI conditionally ready — resolve governance or infrastructure gaps before full autonomy"
      : "EmpireAI not yet ready for autonomous company operations";

  return {
    overallReadinessScore,
    businessCreationReady,
    businessOperationReady,
    scalingReady,
    governanceReady,
    certificationLevel,
    summary,
  };
}

export function formatEmpireOperatingSystemReport(report: EmpireOperatingSystemReport): string {
  return report.executiveBrief;
}
