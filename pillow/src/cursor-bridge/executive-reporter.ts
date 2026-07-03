import type {
  AutonomousEngineeringMission,
  BridgeValidationResult,
  DispatchMode,
  ExecutiveBridgeReport,
  LogInterpretation,
} from "./types.js";

export function buildExecutiveBridgeReport(input: {
  mission: AutonomousEngineeringMission;
  dispatchMode: DispatchMode;
  validation: BridgeValidationResult;
  logSummaries: LogInterpretation[];
}): ExecutiveBridgeReport {
  let certificationDecision: ExecutiveBridgeReport["certificationDecision"] = "complete";
  const nextActions: string[] = [];

  if (!input.validation.passed) {
    certificationDecision = input.validation.blockers.length > 0 ? "failed" : "conditional";
    nextActions.push("Address blockers and re-run validation pipeline");
    if (!input.validation.buildOk) nextActions.push("Fix build/typecheck errors");
    if (!input.validation.cursorReviewOk) nextActions.push("Correct Cursor review findings");
    if (!input.validation.deploymentOk) nextActions.push("Investigate deployment logs");
  } else {
    nextActions.push("Mission complete — no Grand King action required");
  }

  const executiveSummary = [
    `Instruction: ${input.mission.instruction.rawInstruction}`,
    `Kind: ${input.mission.instruction.kind}`,
    `Mission: ${input.mission.title}`,
    `Dispatch: ${input.dispatchMode}`,
    `Validation: ${input.validation.passed ? "PASSED" : "FAILED"}`,
    `Build: ${input.validation.buildOk ? "OK" : "FAIL"}`,
    `Deployment: ${input.validation.deploymentOk ? "OK" : "PENDING/FAIL"}`,
    `Browser: ${input.validation.browserOk ? "OK" : "PENDING/FAIL"}`,
    `Cursor review: ${input.validation.cursorReviewOk ? "APPROVED" : "REJECTED"}`,
  ].join("\n");

  return {
    version: "PILLOW-CB-001",
    generatedAt: new Date().toISOString(),
    instruction: input.mission.instruction.rawInstruction,
    missionTitle: input.mission.title,
    dispatchMode: input.dispatchMode,
    validation: input.validation,
    logSummaries: input.logSummaries,
    certificationDecision,
    executiveSummary,
    nextActions,
  };
}

export function formatExecutiveBridgeReport(report: ExecutiveBridgeReport): string {
  const logLines = report.logSummaries.map(
    (l) => `- ${l.source}: ${l.summary}${l.errors.length ? ` (${l.errors[0]})` : ""}`,
  );

  return [
    "--- Autonomous Cursor Bridge Report (PILLOW-CB-001) ---",
    report.executiveSummary,
    "",
    "### Certification",
    `Decision: ${report.certificationDecision.toUpperCase()}`,
    "",
    "### Log Interpretation",
    ...(logLines.length ? logLines : ["- No logs ingested"]),
    "",
    "### Findings",
    ...(report.validation.findings.length
      ? report.validation.findings.slice(0, 5).map((f) => `- ${f}`)
      : ["- None"]),
    "",
    "### Next Actions",
    ...report.nextActions.map((a) => `- ${a}`),
    "",
    "### Risk",
    report.validation.blockers.length
      ? report.validation.blockers.slice(0, 3).join("; ")
      : "No blockers",
  ].join("\n");
}
