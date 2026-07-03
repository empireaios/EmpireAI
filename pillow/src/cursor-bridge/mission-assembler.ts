import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import type { CursorMissionDocument } from "../planner/types.js";
import type { MissionPlannerEngine } from "../planner/engine.js";
import type { TechnicalChiefEngine } from "../technical-chief/engine.js";
import type { UxDesignerEngine } from "../ux-designer/engine.js";
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
}): AutonomousEngineeringMission {
  const bridgeMissionId = randomUUID();
  const { instruction } = input;

  switch (instruction.kind) {
    case "ux_change":
      return assembleUxMission(bridgeMissionId, instruction, input.uxDesigner, input.bootstrap);
    case "investigation":
      return assembleInvestigationMission(bridgeMissionId, instruction, input.technicalChief, input.bootstrap);
    case "deployment":
    case "release":
      return assembleDeploymentMission(bridgeMissionId, instruction, input.bootstrap);
    case "cursor_review":
      return assembleReviewMission(bridgeMissionId, instruction, input.bootstrap);
    case "architecture":
      return assembleArchitectureMission(bridgeMissionId, instruction, input.technicalChief, input.bootstrap);
    default:
      return assemblePlannedMission(bridgeMissionId, instruction, input.planner, input.bootstrap);
  }
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
