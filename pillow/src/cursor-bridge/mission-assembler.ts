import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import type { CursorMissionDocument } from "../planner/types.js";
import type { MissionPlannerEngine } from "../planner/engine.js";
import type { TechnicalChiefEngine } from "../technical-chief/engine.js";
import type { UxDesignerEngine } from "../ux-designer/engine.js";
import { prependMissionSynchronization } from "../vision-synchronization/mission-preamble.js";
import type { VisionSyncPipelineResult } from "../vision-synchronization/types.js";
import { prependContextSynchronization } from "../context-synchronization/mission-preamble.js";
import type { ContextSyncPipelineResult } from "../context-synchronization/types.js";
import type { CursorProtocolEngine } from "../cursor-protocol/engine.js";
import type { RecoveryDoctrineEngine } from "../recovery-doctrine/engine.js";
import { prependRecoveryDoctrine } from "../recovery-doctrine/mission-preamble.js";
import type { BrowserTruthEngine } from "../browser-truth/engine.js";
import { prependBrowserTruth } from "../browser-truth/mission-preamble.js";
import type { E2eTestingEngine } from "../e2e-testing/engine.js";
import { prependE2eTesting } from "../e2e-testing/mission-preamble.js";
import type { JourneySystemEngine } from "../journey-system/engine.js";
import { prependJourneySystem } from "../journey-system/mission-preamble.js";
import type { BrainRuntimeEngine } from "../brain-runtime/engine.js";
import { prependBrainRuntime } from "../brain-runtime/mission-preamble.js";
import type { ProductionModeEngine } from "../production-mode/engine.js";
import { prependProductionMode } from "../production-mode/mission-preamble.js";
import type { DurableSessionEngine } from "../durable-sessions/engine.js";
import { prependDurableSession } from "../durable-sessions/mission-preamble.js";
import type { GuardianMonitoringEngine } from "../guardian-monitoring/engine.js";
import { prependGuardianMonitoring } from "../guardian-monitoring/mission-preamble.js";
import type { ScalingArchitectureEngine } from "../scaling-architecture/engine.js";
import { prependScalingArchitecture } from "../scaling-architecture/mission-preamble.js";
import type { PerformanceGovernanceEngine } from "../performance-governance/engine.js";
import { prependPerformanceGovernance } from "../performance-governance/mission-preamble.js";
import type { ExecutionControlCenterEngine } from "../execution-control-center/engine.js";
import { prependExecutionControlCenter } from "../execution-control-center/mission-preamble.js";
import type { VisionIntegrityEngine } from "../vision-integrity-engine/engine.js";
import { prependVisionIntegrityEngine } from "../vision-integrity-engine/mission-preamble.js";
import type { CursorSupervisorEngine } from "../supervisor/engine.js";
import { prependSupervisorSystem } from "../supervisor/mission-preamble.js";
import type { BuilderMonitorEngine } from "../builder-monitor/engine.js";
import { prependBuilderMonitor } from "../builder-monitor/mission-preamble.js";
import type { EtaEngine } from "../eta-engine/engine.js";
import { prependEtaEngine } from "../eta-engine/mission-preamble.js";
import type { AutonomousRecoveryEngine } from "../autonomous-recovery-engine/engine.js";
import { prependAutonomousRecoveryEngine } from "../autonomous-recovery-engine/mission-preamble.js";
import type { ZeroHumanAutomationEngine } from "../zero-human-automation/engine.js";
import { prependZeroHumanAutomation } from "../zero-human-automation/mission-preamble.js";
import type { FounderShellEngine } from "../founder-shell/engine.js";
import { prependFounderShell } from "../founder-shell/mission-preamble.js";
import type {
  AutonomousEngineeringMission,
  BridgeInstruction,
  EngineeringTask,
} from "./types.js";

export function assembleEngineeringMission(input: {
  instruction: BridgeInstruction;
  bootstrap: EmpireBootstrapContext;
  planner: MissionPlannerEngine;
  technicalChief: TechnicalChiefEngine;
  uxDesigner: UxDesignerEngine;
  syncPipeline: VisionSyncPipelineResult;
  contextPipeline: ContextSyncPipelineResult;
  cursorProtocol: CursorProtocolEngine;
  recoveryDoctrine: RecoveryDoctrineEngine;
  browserTruth: BrowserTruthEngine;
  e2eTesting: E2eTestingEngine;
  journeySystem: JourneySystemEngine;
  brainRuntime: BrainRuntimeEngine;
  productionMode: ProductionModeEngine;
  durableSessions: DurableSessionEngine;
  guardianMonitoring: GuardianMonitoringEngine;
  scalingArchitecture: ScalingArchitectureEngine;
  performanceGovernance: PerformanceGovernanceEngine;
  executionControlCenter: ExecutionControlCenterEngine;
  visionIntegrity: VisionIntegrityEngine;
  supervisor: CursorSupervisorEngine;
  builderMonitor: BuilderMonitorEngine;
  etaEngine: EtaEngine;
  autonomousRecoveryEngine: AutonomousRecoveryEngine;
  zeroHumanAutomationEngine: ZeroHumanAutomationEngine;
  founderShellEngine: FounderShellEngine;
}): AutonomousEngineeringMission {
  const bridgeMissionId = randomUUID();
  const { instruction, syncPipeline, contextPipeline } = input;

  let mission: AutonomousEngineeringMission;

  switch (instruction.kind) {
    case "ux_change":
      mission = assembleUxMission(bridgeMissionId, instruction, input.uxDesigner, input.bootstrap);
      break;
    case "investigation":
      mission = assembleInvestigationMission(bridgeMissionId, instruction, input.technicalChief, input.bootstrap);
      break;
    case "deployment":
    case "release":
      mission = assembleDeploymentMission(bridgeMissionId, instruction, input.bootstrap);
      break;
    case "cursor_review":
      mission = assembleReviewMission(bridgeMissionId, instruction, input.bootstrap);
      break;
    case "architecture":
      mission = assembleArchitectureMission(bridgeMissionId, instruction, input.technicalChief, input.bootstrap);
      break;
    default:
      mission = assemblePlannedMission(bridgeMissionId, instruction, input.planner, input.bootstrap);
  }

  return applySynchronization(
    mission,
    syncPipeline,
    contextPipeline,
    input.cursorProtocol,
    input.recoveryDoctrine,
    input.browserTruth,
    input.e2eTesting,
    input.journeySystem,
    input.brainRuntime,
    input.productionMode,
    input.durableSessions,
    input.guardianMonitoring,
    input.scalingArchitecture,
    input.performanceGovernance,
    input.executionControlCenter,
    input.visionIntegrity,
    input.supervisor,
    input.builderMonitor,
    input.etaEngine,
    input.autonomousRecoveryEngine,
    input.zeroHumanAutomationEngine,
    input.founderShellEngine,
    input.bootstrap,
  );
}

function assembleUxMission(
  bridgeMissionId: string,
  instruction: BridgeInstruction,
  uxDesigner: UxDesignerEngine,
  bootstrap: EmpireBootstrapContext,
): AutonomousEngineeringMission {
  const design = uxDesigner.designFromRequest(instruction.rawInstruction);
  const spec = design.proposals[0]!.spec;

  const tasks: EngineeringTask[] = spec.layoutChanges.map((change, i) => ({
    order: i + 1,
    action: change,
    files: spec.requiredFiles,
  }));

  if (tasks.length === 0) {
    tasks.push({
      order: 1,
      action: spec.objective,
      files: spec.requiredFiles,
    });
  }

  const formatted = buildFormattedDocument({
    title: `UX Engineering — ${design.screen?.title ?? "Cockpit"}`,
    objective: instruction.rawInstruction,
    tasks,
    acceptance: spec.acceptanceCriteria,
    validation: [
      "Typecheck empireai-web",
      "Build empireai-web",
      "Browser verify at target route",
      "Confirm Pillow Operating Shell unaffected",
    ],
    deployment: ["Vercel preview deploy after local validation"],
    risk: design.reasoning.recommendations.slice(0, 2).join("; ") || "Low — UI-only change",
    cursorPrompt: spec.cursorMissionSummary,
  });

  return buildMission(bridgeMissionId, instruction, {
    title: `UX: ${instruction.rawInstruction.slice(0, 60)}`,
    objective: instruction.rawInstruction,
    files: spec.requiredFiles,
    tasks,
    acceptance: spec.acceptanceCriteria,
    validation: [
      "Run pillow typecheck and build",
      "Run empireai-web typecheck and build",
      "Visual QA at sm/md/lg breakpoints",
    ],
    deployment: ["Commit Phase change · push · Vercel auto-deploy"],
    risk: `UX score ${design.reasoning.overallScore}/100 — ${design.reasoning.recommendations[0] ?? "standard QA"}`,
    cursorPrompt: spec.cursorMissionSummary,
    formatted,
    bootstrap,
  });
}

function assembleInvestigationMission(
  bridgeMissionId: string,
  instruction: BridgeInstruction,
  technicalChief: TechnicalChiefEngine,
  bootstrap: EmpireBootstrapContext,
): AutonomousEngineeringMission {
  const analysis = technicalChief.analyzeIssue({ problemDescription: instruction.rawInstruction });
  const tasks: EngineeringTask[] = analysis.plan.steps.map((s) => ({
    order: s.order,
    action: s.action,
    files: s.files,
  }));

  const formatted = buildFormattedDocument({
    title: `Investigation — ${instruction.rawInstruction.slice(0, 60)}`,
    objective: instruction.rawInstruction,
    tasks,
    acceptance: analysis.plan.acceptanceCriteria,
    validation: analysis.plan.validationPlan,
    deployment: [analysis.plan.deploymentPlan],
    risk: analysis.risks.summary,
    cursorPrompt: analysis.executiveBrief,
  });

  return buildMission(bridgeMissionId, instruction, {
    title: `Investigate: ${instruction.rawInstruction.slice(0, 60)}`,
    objective: analysis.rootCause.rootCause,
    files: analysis.plan.requiredFiles,
    tasks,
    acceptance: analysis.plan.acceptanceCriteria,
    validation: analysis.plan.validationPlan,
    deployment: [analysis.plan.deploymentPlan],
    risk: analysis.risks.summary,
    cursorPrompt: [
      analysis.executiveBrief,
      "",
      "Implement recommended fix per engineering plan.",
      `Rollback: ${analysis.plan.rollbackStrategy}`,
    ].join("\n"),
    formatted,
    bootstrap,
  });
}

function assembleDeploymentMission(
  bridgeMissionId: string,
  instruction: BridgeInstruction,
  bootstrap: EmpireBootstrapContext,
): AutonomousEngineeringMission {
  const tasks: EngineeringTask[] = [
    { order: 1, action: "Run full test suite (pillow + backend + empireai-web)", files: [] },
    { order: 2, action: "Verify Railway health endpoint", files: ["deployment/MANAGED_DEPLOYMENT.md"] },
    { order: 3, action: "Verify Vercel BFF proxy and Pillow health", files: ["empireai-web/lib/brain/server-proxy.ts"] },
    { order: 4, action: "Push to main and monitor deploy logs", files: [] },
    { order: 5, action: "Production browser acceptance at empire-ai.co", files: [] },
  ];

  const formatted = buildFormattedDocument({
    title: "Production Deployment",
    objective: instruction.rawInstruction,
    tasks,
    acceptance: [
      "All CI checks pass",
      "Railway /health returns 200",
      "Vercel /api/pillow/health returns 200",
      "Login → session → chat flow works",
    ],
    validation: ["Interpret Railway deploy log", "Interpret Vercel deploy log", "Browser E2E"],
    deployment: ["git push origin main", "Monitor Railway redeploy", "Monitor Vercel redeploy"],
    risk: "Production deployment — verify rollback path before push",
    cursorPrompt: instruction.rawInstruction,
  });

  return buildMission(bridgeMissionId, instruction, {
    title: "Deploy latest version",
    objective: instruction.rawInstruction,
    files: ["deployment/MANAGED_DEPLOYMENT.md", "empireai-web/vercel.json"],
    tasks,
    acceptance: [
      "Production health endpoints 200",
      "No Failed to fetch in Pillow Operating Shell",
      "Executive Home loads with brain data",
    ],
    validation: ["Railway log interpretation", "Vercel log interpretation", "Browser test"],
    deployment: ["Push main · Railway auto-deploy · Vercel auto-deploy"],
    risk: "High — production deployment requires validation gate",
    cursorPrompt: instruction.rawInstruction,
    formatted,
    bootstrap,
  });
}

function assembleReviewMission(
  bridgeMissionId: string,
  instruction: BridgeInstruction,
  bootstrap: EmpireBootstrapContext,
): AutonomousEngineeringMission {
  const tasks: EngineeringTask[] = [
    { order: 1, action: "Collect changed files from git diff", files: [] },
    { order: 2, action: "Run Technical Chief Cursor review", files: ["pillow/src/technical-chief/cursor-review-engine.ts"] },
    { order: 3, action: "Run validation pipeline (typecheck, build, tests)", files: [] },
    { order: 4, action: "Produce Executive Engineering Report", files: [] },
  ];

  const formatted = buildFormattedDocument({
    title: "Cursor Work Review",
    objective: instruction.rawInstruction,
    tasks,
    acceptance: ["Cursor review approved", "No critical findings", "Tests pass"],
    validation: ["Technical Chief certification", "Build log clean"],
    deployment: ["No deploy unless review passes"],
    risk: "Medium — unreviewed Cursor output may contain hallucinated paths",
    cursorPrompt: instruction.rawInstruction,
  });

  return buildMission(bridgeMissionId, instruction, {
    title: "Review Cursor engineering work",
    objective: instruction.rawInstruction,
    files: [],
    tasks,
    acceptance: ["Technical Chief Cursor review approved", "Validation pipeline passed"],
    validation: ["typecheck", "build", "test", "cursor-review-engine"],
    deployment: [],
    risk: "Review-only — no deployment until certified",
    cursorPrompt: instruction.rawInstruction,
    formatted,
    bootstrap,
  });
}

function assembleArchitectureMission(
  bridgeMissionId: string,
  instruction: BridgeInstruction,
  technicalChief: TechnicalChiefEngine,
  bootstrap: EmpireBootstrapContext,
): AutonomousEngineeringMission {
  return assembleInvestigationMission(bridgeMissionId, instruction, technicalChief, bootstrap);
}

function assemblePlannedMission(
  bridgeMissionId: string,
  instruction: BridgeInstruction,
  planner: MissionPlannerEngine,
  bootstrap: EmpireBootstrapContext,
): AutonomousEngineeringMission {
  const document = planner.generateNextMission();
  if (document) {
    const tasks: EngineeringTask[] = document.acceptanceCriteria.map((c, i) => ({
      order: i + 1,
      action: c,
      files: [],
    }));

    return buildMission(bridgeMissionId, instruction, {
      title: document.title,
      objective: document.objective,
      files: [],
      tasks,
      acceptance: document.acceptanceCriteria,
      validation: document.validation,
      deployment: ["Per mission validation section"],
      risk: "Per Mission Planner dependency analysis",
      cursorPrompt: document.formatted,
      formatted: document.formatted,
      bootstrap,
    });
  }

  const tasks: EngineeringTask[] = [
    {
      order: 1,
      action: instruction.rawInstruction,
      files: ["pillow/src/", "empireai-web/", "backend/src/"],
    },
  ];

  const formatted = buildFormattedDocument({
    title: "Engineering Mission",
    objective: instruction.rawInstruction,
    tasks,
    acceptance: ["Instruction implemented", "Tests pass", "No regression"],
    validation: ["typecheck", "build", "test"],
    deployment: ["Standard git push deploy path"],
    risk: "Standard engineering risk",
    cursorPrompt: instruction.rawInstruction,
  });

  return buildMission(bridgeMissionId, instruction, {
    title: instruction.rawInstruction.slice(0, 80),
    objective: instruction.rawInstruction,
    files: [],
    tasks,
    acceptance: ["King instruction fulfilled", "Validation pipeline passed"],
    validation: ["typecheck", "build", "test"],
    deployment: [],
    risk: "Generic engineering",
    cursorPrompt: instruction.rawInstruction,
    formatted,
    bootstrap,
  });
}

function applySynchronization(
  mission: AutonomousEngineeringMission,
  syncPipeline: VisionSyncPipelineResult,
  contextPipeline: ContextSyncPipelineResult,
  cursorProtocol: CursorProtocolEngine,
  recoveryDoctrine: RecoveryDoctrineEngine,
  browserTruth: BrowserTruthEngine,
  e2eTesting: E2eTestingEngine,
  journeySystem: JourneySystemEngine,
  brainRuntime: BrainRuntimeEngine,
  productionMode: ProductionModeEngine,
  durableSessions: DurableSessionEngine,
  guardianMonitoring: GuardianMonitoringEngine,
  scalingArchitecture: ScalingArchitectureEngine,
  performanceGovernance: PerformanceGovernanceEngine,
  executionControlCenter: ExecutionControlCenterEngine,
  visionIntegrity: VisionIntegrityEngine,
  supervisor: CursorSupervisorEngine,
  builderMonitor: BuilderMonitorEngine,
  etaEngine: EtaEngine,
  autonomousRecoveryEngine: AutonomousRecoveryEngine,
  zeroHumanAutomationEngine: ZeroHumanAutomationEngine,
  founderShellEngine: FounderShellEngine,
  bootstrap: EmpireBootstrapContext,
): AutonomousEngineeringMission {
  let inner = prependMissionSynchronization(mission.formattedDocument, syncPipeline);
  inner = prependContextSynchronization(inner, contextPipeline);
  inner = prependRecoveryDoctrine(
    inner,
    recoveryDoctrine.formatMissionPreamble({ missionTitle: mission.title }),
  );
  inner = prependE2eTesting(
    inner,
    e2eTesting.formatMissionPreamble({ missionTitle: mission.title }),
  );
  inner = prependJourneySystem(
    inner,
    journeySystem.formatMissionPreamble({ missionTitle: mission.title }),
  );
  inner = prependBrainRuntime(
    inner,
    brainRuntime.formatMissionPreamble({ missionTitle: mission.title }),
  );
  inner = prependProductionMode(
    inner,
    productionMode.formatMissionPreamble({ missionTitle: mission.title }),
  );
  inner = prependDurableSession(
    inner,
    durableSessions.formatMissionPreamble({ missionTitle: mission.title }),
  );
  inner = prependGuardianMonitoring(
    inner,
    guardianMonitoring.formatMissionPreamble({ missionTitle: mission.title }),
  );
  inner = prependScalingArchitecture(
    inner,
    scalingArchitecture.formatMissionPreamble({ missionTitle: mission.title }),
  );
  inner = prependPerformanceGovernance(
    inner,
    performanceGovernance.formatMissionPreamble({ missionTitle: mission.title }),
  );
  inner = prependExecutionControlCenter(
    inner,
    executionControlCenter.formatMissionPreamble({ missionTitle: mission.title }),
  );
  inner = prependVisionIntegrityEngine(
    inner,
    visionIntegrity.formatMissionPreamble({ missionTitle: mission.title }),
  );
  inner = prependSupervisorSystem(
    inner,
    supervisor.formatMissionPreamble({ missionTitle: mission.title, missionId: mission.bridgeMissionId }),
  );
  inner = prependBuilderMonitor(
    inner,
    builderMonitor.formatMissionPreamble({ missionTitle: mission.title, missionId: mission.bridgeMissionId }),
  );
  inner = prependEtaEngine(
    inner,
    etaEngine.formatMissionPreamble({ missionTitle: mission.title, missionId: mission.bridgeMissionId }),
  );
  inner = prependAutonomousRecoveryEngine(
    inner,
    autonomousRecoveryEngine.formatMissionPreamble({
      missionTitle: mission.title,
      missionId: mission.bridgeMissionId,
    }),
  );
  inner = prependZeroHumanAutomation(
    inner,
    zeroHumanAutomationEngine.formatMissionPreamble({
      missionTitle: mission.title,
      missionId: mission.bridgeMissionId,
    }),
  );
  inner = prependFounderShell(
    inner,
    founderShellEngine.formatMissionPreamble({
      missionId: mission.bridgeMissionId,
      missionTitle: mission.title,
    }),
  );
  inner = prependBrowserTruth(
    inner,
    browserTruth.formatMissionPreamble({ missionTitle: mission.title }),
  );
  const wrapped = cursorProtocol.wrapMissionDocument(inner, {
    missionTitle: mission.title,
    missionPurpose: mission.objective,
    acceptanceCriteria: mission.acceptanceCriteria,
    validationSteps: mission.validationSteps,
    contextPipeline,
  });
  const formattedDocument = wrapped.document;
  let cursorPrompt = prependMissionSynchronization(mission.cursorPrompt, syncPipeline);
  cursorPrompt = prependContextSynchronization(cursorPrompt, contextPipeline);
  const promptWrapped = cursorProtocol.wrapMissionDocument(cursorPrompt, {
    missionTitle: mission.title,
    missionPurpose: mission.objective,
    contextPipeline,
  });
  const artifactPath = writeArtifact(
    bootstrap.repositoryRoot,
    mission.bridgeMissionId,
    formattedDocument,
  );
  return {
    ...mission,
    formattedDocument,
    cursorPrompt: promptWrapped.document,
    artifactPath,
    synchronizationApplied: true,
    contextSynchronizationApplied: true,
    cursorProtocolApplied: wrapped.gate.envelope.allPreMissionChecksPassed,
  };
}

function buildMission(
  bridgeMissionId: string,
  instruction: BridgeInstruction,
  spec: {
    title: string;
    objective: string;
    files: string[];
    tasks: EngineeringTask[];
    acceptance: string[];
    validation: string[];
    deployment: string[];
    risk: string;
    cursorPrompt: string;
    formatted: string;
    bootstrap: EmpireBootstrapContext;
  },
): AutonomousEngineeringMission {
  const artifactPath = writeArtifact(spec.bootstrap.repositoryRoot, bridgeMissionId, spec.formatted);

  return {
    bridgeMissionId,
    title: spec.title,
    objective: spec.objective,
    instruction,
    requiredFiles: spec.files,
    tasks: spec.tasks,
    acceptanceCriteria: spec.acceptance,
    validationSteps: spec.validation,
    deploymentSteps: spec.deployment,
    riskSummary: spec.risk,
    cursorPrompt: spec.cursorPrompt,
    formattedDocument: spec.formatted,
    artifactPath,
  };
}

function buildFormattedDocument(input: {
  title: string;
  objective: string;
  tasks: EngineeringTask[];
  acceptance: string[];
  validation: string[];
  deployment: string[];
  risk: string;
  cursorPrompt: string;
}): string {
  const taskLines = input.tasks.map(
    (t) => `${t.order}. ${t.action}${t.files.length ? ` [${t.files.join(", ")}]` : ""}`,
  );
  return [
    `# Autonomous Cursor Bridge Mission (PILLOW-CB-001)`,
    `## ${input.title}`,
    "",
    "### Objective",
    input.objective,
    "",
    "### Engineering Tasks",
    ...taskLines.map((l) => `- ${l}`),
    "",
    "### Acceptance Criteria",
    ...input.acceptance.map((a) => `- ${a}`),
    "",
    "### Validation",
    ...input.validation.map((v) => `- ${v}`),
    "",
    "### Deployment",
    ...input.deployment.map((d) => `- ${d}`),
    "",
    "### Risk",
    input.risk,
    "",
    "### Cursor Prompt",
    input.cursorPrompt,
  ].join("\n");
}

function writeArtifact(repositoryRoot: string, missionId: string, content: string): string {
  const dir = path.join(repositoryRoot, ".cursor", "missions", "pending");
  fs.mkdirSync(dir, { recursive: true });
  const artifactPath = path.join(dir, `bridge-${missionId.slice(0, 8)}.md`);
  fs.writeFileSync(artifactPath, content, "utf8");
  return artifactPath;
}
