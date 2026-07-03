import type {
  CertificationDecision,
  CursorEngineeringReview,
  EngineeringPlan,
  ExecutiveEngineeringReport,
  ImplementationValidation,
  RootCauseAnalysis,
  SystemDiagnosis,
  RiskAssessment,
} from "./types.js";

export function certifyEngineeringWork(input: {
  summary: string;
  diagnosis: SystemDiagnosis;
  rootCause: RootCauseAnalysis;
  plan: EngineeringPlan;
  risks: RiskAssessment;
  validation: ImplementationValidation;
  cursorReview: CursorEngineeringReview;
  filesChanged: string[];
}): ExecutiveEngineeringReport {
  const blockers = [
    ...input.validation.blockers,
    ...input.cursorReview.requiredCorrections,
  ];

  let certificationDecision: CertificationDecision = "certified";
  let certificationRationale = "All validation gates passed; Cursor review approved; production safe.";

  if (blockers.length > 0 || !input.cursorReview.approved) {
    certificationDecision = "rejected";
    certificationRationale = `Certification blocked: ${blockers.slice(0, 3).join("; ")}`;
  } else if (
    !input.validation.productionVerified ||
    !input.validation.testsVerified ||
    input.risks.productionRisk === "critical"
  ) {
    certificationDecision = "conditional";
    certificationRationale =
      "Conditional certification — complete production verification and test suite before full sign-off.";
  }

  const remainingRisks = [
    ...input.risks.mitigations.map((m) => `Mitigation: ${m}`),
    ...input.cursorReview.technicalDebt,
    ...input.cursorReview.regressions,
  ];

  if (input.rootCause.recurrenceLikelihood !== "low") {
    remainingRisks.push(`Recurrence risk: ${input.rootCause.recurrenceLikelihood}`);
  }

  const architectureImpact = [
    `Layers touched: ${input.diagnosis.affectedLayers.join(", ") || "none identified"}`,
    `Critical path modules: ${input.diagnosis.affectedModules.slice(0, 4).join(", ") || "TBD"}`,
    input.plan.recommendedSolution,
  ].join(". ");

  return {
    version: "PILLOW-TC-001",
    generatedAt: new Date().toISOString(),
    summary: input.summary,
    diagnosis: input.diagnosis,
    rootCause: input.rootCause,
    filesChanged: input.filesChanged,
    architectureImpact,
    risks: input.risks,
    validation: input.validation,
    remainingRisks,
    certificationDecision,
    certificationRationale,
  };
}

export function formatExecutiveEngineeringReport(report: ExecutiveEngineeringReport): string {
  const sections = [
    `# Executive Engineering Report (${report.version})`,
    `Generated: ${report.generatedAt}`,
    "",
    "## Summary",
    report.summary,
    "",
    "## Diagnosis",
    report.diagnosis.summary,
    `Categories: ${report.diagnosis.categories.join(", ")}`,
    `Symptoms: ${report.diagnosis.symptoms.join("; ")}`,
    "",
    "## Root Cause",
    report.rootCause.rootCause,
    `Confidence: ${Math.round(report.rootCause.confidenceScore * 100)}%`,
    `Business impact: ${report.rootCause.businessImpact}`,
    `Technical impact: ${report.rootCause.technicalImpact}`,
    "",
    "## Files Changed",
    report.filesChanged.length > 0 ? report.filesChanged.map((f) => `- ${f}`).join("\n") : "- None listed",
    "",
    "## Architecture Impact",
    report.architectureImpact,
    "",
    "## Risks",
    report.risks.summary,
    "",
    "## Validation",
    `Production verified: ${report.validation.productionVerified}`,
    `Tests verified: ${report.validation.testsVerified}`,
    `Blockers: ${report.validation.blockers.length > 0 ? report.validation.blockers.join("; ") : "none"}`,
    "",
    "## Remaining Risks",
    report.remainingRisks.map((r) => `- ${r}`).join("\n") || "- None",
    "",
    "## Certification Decision",
    `**${report.certificationDecision.toUpperCase()}** — ${report.certificationRationale}`,
  ];

  return sections.join("\n");
}
