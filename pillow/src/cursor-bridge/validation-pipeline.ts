import { reviewCursorEngineeringOutput } from "../technical-chief/cursor-review-engine.js";
import { validateImplementation } from "../technical-chief/implementation-validator.js";
import type { TechnicalChiefEngine } from "../technical-chief/engine.js";
import type { UxDesignerEngine } from "../ux-designer/engine.js";
import type {
  AutonomousEngineeringMission,
  BridgeValidationResult,
  LogInterpretation,
  LogSource,
} from "./types.js";
import { interpretAllLogs } from "./log-interpreters.js";

export function runValidationPipeline(input: {
  mission: AutonomousEngineeringMission;
  changedFiles: string[];
  logs: Array<{ source: LogSource; text: string }>;
  technicalChief: TechnicalChiefEngine;
  uxDesigner?: UxDesignerEngine;
  diffSummary?: string;
}): { interpretations: LogInterpretation[]; validation: BridgeValidationResult } {
  const interpretations = interpretAllLogs(input.logs);

  const buildLogs = interpretations.filter(
    (i) => i.source === "build" || i.source === "typecheck" || i.source === "test",
  );
  const buildOk =
    buildLogs.length === 0 || buildLogs.every((i) => i.success);

  const deployLogs = interpretations.filter(
    (i) => i.source === "railway" || i.source === "vercel",
  );
  const deploymentOk = deployLogs.length === 0 || deployLogs.every((i) => i.success);

  const browserLogs = interpretations.filter((i) => i.source === "browser");
  const browserOk = browserLogs.length === 0 || browserLogs.every((i) => i.success);

  const cursorReview = reviewCursorEngineeringOutput({
    changedFiles: input.changedFiles,
    diffSummary: input.diffSummary,
  });

  const implValidation = validateImplementation({
    changedFiles: input.changedFiles,
    hasTypecheckPass: buildOk,
    hasTestsPass: interpretations.some((i) => i.source === "test" && i.success),
    hasBuildPass: buildOk,
    productionHealthOk: deploymentOk && browserOk,
    pillowSessionOk: browserOk,
  });

  const findings = [
    ...implValidation.findings,
    ...cursorReview.findings.map((f) => `${f.severity}: ${f.message}`),
    ...interpretations.filter((i) => !i.success).map((i) => `${i.source}: ${i.summary}`),
  ];

  const blockers = [
    ...implValidation.blockers,
    ...cursorReview.requiredCorrections,
    ...interpretations
      .filter((i) => !i.success)
      .flatMap((i) => i.errors.slice(0, 2)),
  ];

  let businessWorkflowOk = true;
  if (input.uxDesigner && input.mission.instruction.kind === "ux_change") {
    const uxResult = input.uxDesigner.designFromRequest(input.mission.instruction.rawInstruction);
    const uxValidation = input.uxDesigner.validateImplementation({
      originalRequest: input.mission.instruction.rawInstruction,
      spec: uxResult.proposals[0]!.spec,
      changedFiles: input.changedFiles,
    });
    businessWorkflowOk = uxValidation.passed;
    if (!uxValidation.passed) {
      blockers.push(...uxValidation.blockers);
      findings.push(...uxValidation.findings);
    }
  }

  const passed =
    blockers.length === 0 &&
    buildOk &&
    cursorReview.approved &&
    businessWorkflowOk;

  return {
    interpretations,
    validation: {
      passed,
      buildOk,
      deploymentOk,
      browserOk,
      cursorReviewOk: cursorReview.approved,
      businessWorkflowOk,
      findings,
      blockers,
    },
  };
}
