import { PROGRAM_CATALOG } from "../../../orchestration/master-completion-ledger/models/program-catalog.js";
import type { MissionCommandEngine, MissionProposal, MissionType } from "../models/mission-command-engine.js";

function inferMissionType(programId: string, name: string): MissionType {
  const id = programId.toLowerCase();
  const label = name.toLowerCase();
  if (id.includes("operational") || id.includes("access") || label.includes("recovery")) return "recovery";
  if (id.includes("expansion") || id.includes("marketplace") || label.includes("global")) return "expansion";
  if (id.includes("supplier") || id.includes("product")) return "optimization";
  if (id.includes("commerce") || id.includes("revenue")) return "commercial";
  if (id.includes("intelligence") || label.includes("investigation")) return "investigation";
  return "growth";
}

function estimateRoi(blocksUsd100k: boolean, completion: number): number {
  const base = blocksUsd100k ? 2.5 : 1.2;
  const gap = Math.max(0, 100 - completion) / 100;
  return Math.round((base + gap) * 100) / 100;
}

function estimateConfidence(completion: number, blocksUsd100k: boolean): number {
  const base = blocksUsd100k ? 72 : 58;
  return Math.min(95, Math.max(35, base + Math.round((100 - completion) * 0.15)));
}

/** REAL-057 — Mission command engine (governed mission proposals from PROGRAM_CATALOG blockers). */
export function buildMissionCommandEngine(
  workspaceId: string,
  companyId: string,
): MissionCommandEngine {
  const blockingPrograms = PROGRAM_CATALOG.filter((p) => p.blocksUsd100k);
  const candidates = blockingPrograms.length > 0
    ? blockingPrograms
    : PROGRAM_CATALOG.filter((p) => p.baseCompletionPercent < 85);

  const missions: MissionProposal[] = candidates.slice(0, 12).map((program, index) => {
    const type = inferMissionType(program.programId, program.name);
    return {
      missionId: `mce-${program.programId}-${index + 1}`,
      type,
      title: `${program.name} — ${program.nextCursorMission.split("—")[0]?.trim() ?? "Next mission"}`,
      businessValue: program.blocksUsd100k
        ? `Unblocks USD 100K net profit path via ${program.name}`
        : `Advances ${program.name} toward operational readiness`,
      expectedRoi: estimateRoi(program.blocksUsd100k, program.baseCompletionPercent),
      confidence: estimateConfidence(program.baseCompletionPercent, program.blocksUsd100k),
      requiredApproval: true as const,
      sourceProgramId: program.programId,
      sourceProgramName: program.name,
      nextCursorMission: program.nextCursorMission,
    };
  });

  if (missions.length === 0) {
    missions.push({
      missionId: "mce-default-growth-001",
      type: "growth",
      title: "Scale verified winners",
      businessValue: "Compound net profit on live SKUs with governance guardrails",
      expectedRoi: 1.8,
      confidence: 65,
      requiredApproval: true,
      sourceProgramId: "commerce-execution",
      sourceProgramName: "Commerce Execution",
      nextCursorMission: "Scale live products through King approval only",
    });
  }

  return {
    moduleId: "mission-command-engine",
    missionId: "REAL-057",
    workspaceId,
    companyId,
    missions,
    missionCount: missions.length,
    blockingProgramCount: blockingPrograms.length,
    reusedModules: ["master-completion-ledger"],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
