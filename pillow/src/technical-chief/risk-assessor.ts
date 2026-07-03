import type { EngineeringPlan, RiskAssessment, RootCauseAnalysis, SystemDiagnosis } from "./types.js";

export function assessEngineeringRisk(
  diagnosis: SystemDiagnosis,
  rootCause: RootCauseAnalysis,
  plan: EngineeringPlan,
): RiskAssessment {
  const touchesProduction =
    plan.requiredFiles.some((f) => f.includes("vercel") || f.includes("deployment") || f.includes("server-proxy")) ||
    diagnosis.categories.includes("deployment");

  const touchesAuth =
    diagnosis.categories.includes("authentication") ||
    plan.requiredFiles.some((f) => f.includes("auth") || f.includes("session"));

  const touchesData =
    diagnosis.categories.includes("database") ||
    plan.requiredFiles.some((f) => f.includes("database") || f.includes("sqlite"));

  const productionRisk = diagnosis.severity === "critical" ? "critical" : touchesProduction ? "high" : "medium";
  const architecturalRisk =
    diagnosis.categories.includes("architecture_drift") || plan.requiredFiles.length > 5 ? "medium" : "low";
  const securityRisk = touchesAuth ? "high" : "low";
  const performanceRisk =
    diagnosis.categories.includes("performance") || diagnosis.categories.includes("redis") ? "medium" : "low";
  const dataIntegrityRisk = touchesData ? "high" : "low";
  const businessContinuityRisk = diagnosis.severity === "critical" ? "critical" : "medium";
  const technicalDebtImpact = rootCause.recurrenceLikelihood === "high" ? "high" : "medium";
  const maintenanceCost = plan.steps.length > 4 ? "medium" : "low";

  const mitigations = [
    "Run full validation suite before push",
    "Verify production health endpoints after deploy",
    "Keep rollback commit hash documented",
    plan.rollbackStrategy,
  ];

  if (touchesAuth) mitigations.push("Validate founder session flow without exposing credentials in logs");

  const summary = [
    `Production risk: ${productionRisk}`,
    `Security risk: ${securityRisk}`,
    `Recurrence likelihood: ${rootCause.recurrenceLikelihood}`,
    `Confidence in root cause: ${Math.round(rootCause.confidenceScore * 100)}%`,
  ].join(". ");

  return {
    productionRisk,
    architecturalRisk,
    securityRisk,
    performanceRisk,
    dataIntegrityRisk,
    businessContinuityRisk,
    technicalDebtImpact,
    maintenanceCost,
    summary,
    mitigations,
  };
}
